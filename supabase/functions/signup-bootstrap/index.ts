// deno-lint-ignore-file no-explicit-any
// @ts-nocheck
// Edge Function: signup-bootstrap
// Creates an auth user, a company, links membership, and ensures a public.users profile.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Defina ALLOWED_ORIGIN no Dashboard (ex.: https://app.teu-dominio.com)
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
}

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { email, password, company_name } = await req.json()
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'email and password are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(url, serviceKey)

    // 1) Create auth user (email_confirm true to allow immediate login)
    const { data: created, error: cuErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { company_name: company_name || null },
    })
    if (cuErr || !created?.user) {
      return new Response(JSON.stringify({ error: cuErr?.message || 'failed to create user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const userId = created.user.id

    // 2) Create company
    const desiredName = (company_name || email.split('@')[0] || 'Minha Empresa')
      .toString()
      .trim()
      .slice(0, 120)

    const { data: company, error: compErr } = await admin
      .from('companies')
      .insert({ name: desiredName })
      .select('id')
      .single()

    if (compErr) {
      return new Response(JSON.stringify({ error: compErr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3) Link membership as OWNER
    const { error: linkErr } = await admin.from('user_companies').insert({
      user_id: userId,
      company_id: company.id,
      role: 'OWNER',
    })
    if (linkErr) {
      return new Response(JSON.stringify({ error: linkErr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4) Ensure profile exists (UPSERT com onConflict)
    await admin.from('users').upsert(
      { id: userId },
      { onConflict: 'id' } // PK/unique constraint
    )

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    console.error('signup-bootstrap error', e)
    return new Response(JSON.stringify({ error: e?.message || 'internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
