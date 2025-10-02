// Supabase Edge Function: bootstrap-tenant
// On first authenticated visit, ensure a company exists for the user and link them as ADMIN.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

type Payload = {
  company_name?: string | null
}

serve(async (req) => {
  try {
    const adminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const url = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_URL'.toLowerCase())
    if (!adminKey || !url) return new Response(JSON.stringify({ error: 'service role or url missing' }), { status: 500 })

    const supabase = (await import('https://esm.sh/@supabase/supabase-js@2.58.0')).createClient(url, adminKey)

    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!jwt) return new Response(JSON.stringify({ error: 'missing auth token' }), { status: 401 })
    const { data: userData } = await supabase.auth.getUser(jwt)
    const user = userData.user
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

    const body = (await req.json().catch(() => ({}))) as Payload
    const desiredName = (body.company_name || user.email?.split('@')[0] || 'Minha Empresa').toString().trim().slice(0, 120)

    // Already linked?
    const { data: existingLink, error: linkErr } = await supabase
      .from('user_companies')
      .select('company_id, role')
      .eq('user_id', user.id)
      .maybeSingle()
    if (linkErr) return new Response(JSON.stringify({ error: linkErr.message }), { status: 400 })
    if (existingLink) {
      return new Response(JSON.stringify({ company_id: existingLink.company_id, role: existingLink.role, status: 'unchanged' }), { status: 200 })
    }

    // Create company
    const { data: company, error: compErr } = await supabase
      .from('companies')
      .insert({ name: desiredName })
      .select('id')
      .single()
    if (compErr) return new Response(JSON.stringify({ error: compErr.message }), { status: 400 })

    const company_id = company.id as string

    // Link user as ADMIN
    const { error: ucErr } = await supabase
      .from('user_companies')
      .insert({ user_id: user.id, company_id, role: 'ADMIN' })
    if (ucErr) return new Response(JSON.stringify({ error: ucErr.message }), { status: 400 })

    // Ensure profile row exists/updated
    const full_name = (user.user_metadata?.full_name as string | undefined) ?? null
    const { error: profErr } = await supabase
      .from('users')
      .upsert({ id: user.id, full_name })
    if (profErr) return new Response(JSON.stringify({ error: profErr.message }), { status: 400 })

    return new Response(JSON.stringify({ company_id, role: 'ADMIN', status: 'created' }), { status: 200 })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 })
  }
})
