// @ts-nocheck
// Supabase Edge Function: stripe-portal
// Authenticated endpoint to create a Stripe Billing Portal session or Checkout session scoped to the current company
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return new Response(JSON.stringify({ error: 'missing auth token' }), { status: 401 })

  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_URL'.toLowerCase())
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const priceId = Deno.env.get('STRIPE_PRICE_ID')
  const siteUrl = Deno.env.get('SITE_URL') || req.headers.get('origin') || 'http://localhost:5173'
  if (!stripeSecret || !supabaseUrl || !serviceKey || !anonKey) {
    return new Response(JSON.stringify({ error: 'Missing configuration' }), { status: 500 })
  }

  const Stripe = (await import('https://esm.sh/stripe@13.10.0?target=deno')).default
  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' as any })
  const supabasePkg = await import('https://esm.sh/@supabase/supabase-js@2.46.1')
  const admin = supabasePkg.createClient(supabaseUrl, serviceKey)
  // RLS client as the caller to use current_company_id()
  const rls = supabasePkg.createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${jwt}` } } })

  // authenticate and derive company
  const authed = (await admin.auth.getUser(jwt)).data.user
  if (!authed) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  const { data: companyIdData, error: cidErr } = await rls.rpc('current_company_id')
  if (cidErr) return new Response(JSON.stringify({ error: cidErr.message }), { status: 400 })
  const company_id = companyIdData as string | null
  if (!company_id) return new Response(JSON.stringify({ error: 'no current company' }), { status: 400 })

  const body = await req.json().catch(() => ({}))
  const action: 'portal' | 'checkout' = body?.action || 'portal'

  // Ensure stripe customer exists for this company
  let stripeCustomerId: string | null = null
  const { data: existing } = await admin.from('stripe_customers').select('*').eq('company_id', company_id).maybeSingle()
  if (existing) {
    stripeCustomerId = (existing as any).stripe_customer_id
  } else {
    // get company info to seed Stripe customer
  const { data: company } = await admin.from('companies').select('name,email,phone').eq('id', company_id).maybeSingle()
    const customer = await stripe.customers.create({
      name: company?.name || undefined,
      email: company?.email || undefined,
      phone: company?.phone || undefined,
      metadata: { company_id },
    })
    stripeCustomerId = customer.id
  await admin.from('stripe_customers').insert({ company_id, stripe_customer_id: stripeCustomerId, email: company?.email ?? null })
  }

  if (action === 'portal') {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId!,
      return_url: siteUrl,
    })
    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  // action === 'checkout': create subscription checkout session (if price configured)
  if (!priceId) return new Response(JSON.stringify({ error: 'No price configured' }), { status: 400 })
  const success_url = `${siteUrl}/app/settings/billing?status=success`
  const cancel_url = `${siteUrl}/app/settings/billing?status=cancel`
  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId!,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url,
    cancel_url,
    metadata: { company_id },
  })
  return new Response(JSON.stringify({ url: checkout.url }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})
