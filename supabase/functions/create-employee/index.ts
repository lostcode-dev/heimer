// @ts-nocheck
// Supabase Edge Function: create-employee
// Creates an auth user with email/password, links to current company, and stores profile in public.users
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

serve(async (req) => {
  try {
  const body = await req.json()
  const { email, password, full_name } = body
  if (!email || !password) return new Response(JSON.stringify({ error: 'email and password are required' }), { status: 400 })

    const adminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const url = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_URL'.toLowerCase())
    if (!adminKey || !url) return new Response(JSON.stringify({ error: 'service role or url missing' }), { status: 500 })

    const admin = (await import('https://esm.sh/@supabase/supabase-js@2.46.1')).createClient(url, adminKey)

    // get current authenticated user and company
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!jwt) return new Response(JSON.stringify({ error: 'missing auth token' }), { status: 401 })
    const authed = (await admin.auth.getUser(jwt)).data.user
    if (!authed) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

    const { data: companyIdData, error: cidErr } = await admin.rpc('current_company_id')
    if (cidErr) return new Response(JSON.stringify({ error: cidErr.message }), { status: 400 })
    const company_id = companyIdData as string | null
    if (!company_id) return new Response(JSON.stringify({ error: 'no current company' }), { status: 400 })

    // create auth user
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } })
    if (created.error || !created.data.user) return new Response(JSON.stringify({ error: created.error?.message || 'failed to create user' }), { status: 400 })
    const newUser = created.data.user

    // link to company
    const { error: linkErr } = await admin.from('user_companies').insert({ user_id: newUser.id, company_id, role: 'STAFF' })
    if (linkErr) return new Response(JSON.stringify({ error: linkErr.message }), { status: 400 })

    // insert profile
    const profile = {
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
    const { error: profErr } = await admin.from('users').insert(profile)
    if (profErr) return new Response(JSON.stringify({ error: profErr.message }), { status: 400 })

    return new Response(JSON.stringify({ id: newUser.id }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
