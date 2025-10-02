// deno-lint-ignore-file no-explicit-any
// @ts-nocheck
// Supabase Edge Function: create-employee

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ---- CORS ----
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  // 'Access-Control-Allow-Credentials': 'true', // habilita só se usar cookies
}
const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

// ---- Helpers ----
const emptyToNull = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === '' ? null : v]))

const DEFAULT_EMPLOYEE_ROLE = Deno.env.get('DEFAULT_EMPLOYEE_ROLE') ?? 'MEMBER'

// ---- Handler ----
Deno.serve(async (req) => {
  // Preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (req.method !== 'POST') return json(405, { step: 'method', error: 'Method Not Allowed' })

    const body = await req.json()
    const { email, password, full_name } = body
    if (!email || !password) return json(400, { step: 'validate', error: 'email and password are required' })

    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!url || !serviceKey || !anonKey) {
      return json(500, { step: 'env', error: 'Missing SUPABASE_URL / SERVICE_ROLE / ANON key' })
    }

    // Clients
    const admin = createClient(url, serviceKey)

    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!jwt) return json(401, { step: 'auth', error: 'missing auth token' })

    const { data: authedData, error: getUserErr } = await admin.auth.getUser(jwt)
    if (getUserErr || !authedData?.user) return json(401, { step: 'auth', error: getUserErr?.message || 'unauthorized' })
    const requester = authedData.user

    // company_id: se vier no body, valida que o requester pertence; senão pega a mais recente
    let company_id: string | null = body.company_id ?? null
    if (company_id) {
      const { count, error: relErr } = await admin
        .from('user_companies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', requester.id)
        .eq('company_id', company_id)
      if (relErr) return json(400, { step: 'checkCompany', error: relErr.message })
      if (!count) return json(403, { step: 'checkCompany', error: 'user not linked to provided company' })
    } else {
      const { data: rel, error: relErr } = await admin
        .from('user_companies')
        .select('company_id')
        .eq('user_id', requester.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (relErr) return json(400, { step: 'resolveCompany', error: relErr.message })
      company_id = rel?.company_id ?? null
    }
    if (!company_id) return json(400, { step: 'resolveCompany', error: 'no current company' })

    // Cria usuário auth
    const { data: created, error: cuErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || null },
    })
    if (cuErr || !created?.user) return json(400, { step: 'createUser', error: cuErr?.message || 'failed to create user' })
    const newUser = created.user

    // Vincula à empresa (role configurável)
    let { error: linkErr } = await admin.from('user_companies').insert({
      user_id: newUser.id,
      company_id,
      role: DEFAULT_EMPLOYEE_ROLE, // 'MEMBER' por padrão
    })
    if (linkErr) {
      // fallback automático: se schema antigo exigir 'MEMBER' e DEFAULT_EMPLOYEE_ROLE estiver diferente
      const msg = String(linkErr.message || '')
      const roleConstraint = msg.includes('user_companies_role_check') || msg.toLowerCase().includes('role')
      if (roleConstraint && DEFAULT_EMPLOYEE_ROLE !== 'MEMBER') {
        const retry = await admin.from('user_companies').insert({
          user_id: newUser.id,
          company_id,
          role: 'MEMBER',
        })
        if (retry.error) return json(400, { step: 'linkMembership', error: retry.error.message })
      } else {
        return json(400, { step: 'linkMembership', error: linkErr.message })
      }
    }

    // Perfil (normaliza "" -> null e UPSERT)
    const profileBase = {
      id: newUser.id,
      full_name,
      email,
      phone: body.phone ?? null,
      is_active: body.is_active ?? true,
      job_title: body.job_title ?? null,
      cpf: body.cpf ?? null,
      cep: body.cep ?? null,
      street: body.street ?? null,
      number: body.number ?? null,
      complement: body.complement ?? null,
      neighborhood: body.neighborhood ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      birth_date: body.birth_date ? String(body.birth_date).slice(0, 10) : null,
      hire_date: body.hire_date ? String(body.hire_date).slice(0, 10) : null,
      notes: body.notes ?? null,
    }
    const profile = emptyToNull(profileBase)

    const { error: profErr } = await admin.from('users').upsert(profile, { onConflict: 'id' })
    if (profErr) return json(400, { step: 'upsertProfile', error: profErr.message })

    return json(200, { id: newUser.id, company_id })
  } catch (e: any) {
    return json(500, { step: 'catch', error: e?.message || 'internal error' })
  }
})
