// @ts-nocheck
// Supabase Edge Function: stripe-webhook
// Verifies Stripe webhook signature and syncs subscription/invoice data into Postgres (company-scoped)
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

type SupabaseModule = typeof import('https://esm.sh/@supabase/supabase-js@2.46.1')

serve(async (req) => {
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_URL'.toLowerCase())
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!sig || !webhookSecret || !stripeKey || !supabaseUrl || !serviceKey) {
    return new Response('Missing configuration', { status: 500 })
  }

  // dynamic import to reduce cold-start
  const Stripe = (await import('https://esm.sh/stripe@13.10.0?target=deno')).default
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any })
  const supabase: SupabaseModule = await import('https://esm.sh/@supabase/supabase-js@2.46.1')
  const admin = supabase.createClient(supabaseUrl, serviceKey)

  const rawBody = await req.text()
  let event: any
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 })
  }

  // Optionally store event for audit
  try {
    await admin.from('stripe_events').insert({ id: event.id, type: event.type, payload: event as any })
  } catch (_) { /* ignore duplicates or RLS */ }

  async function findCompanyIdByStripeCustomer(stripeCustomerId: string): Promise<string | null> {
    const { data } = await admin.from('stripe_customers').select('company_id').eq('stripe_customer_id', stripeCustomerId).maybeSingle()
    return (data as any)?.company_id ?? null
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as any
      const company_id = await findCompanyIdByStripeCustomer(sub.customer)
      if (!company_id) break
      const payload = {
        company_id,
        stripe_subscription_id: String(sub.id),
        stripe_price_id: sub.items?.data?.[0]?.price?.id ?? null,
        status: String(sub.status),
        cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
        cancel_at_period_end: Boolean(sub.cancel_at_period_end),
        current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
        current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
        trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      }
      // upsert by subscription id
      await admin.from('billing_subscriptions').upsert(payload, { onConflict: 'stripe_subscription_id' })
      break
    }
    case 'invoice.created':
    case 'invoice.updated':
    case 'invoice.paid':
    case 'invoice.payment_succeeded': {
      const inv = event.data.object as any
      const company_id = await findCompanyIdByStripeCustomer(inv.customer)
      if (!company_id) break
      const payload = {
        company_id,
        stripe_invoice_id: String(inv.id),
        stripe_subscription_id: inv.subscription ? String(inv.subscription) : null,
        hosted_invoice_url: inv.hosted_invoice_url ?? null,
        status: inv.status ?? null,
        currency: inv.currency ?? null,
        amount_due: inv.amount_due ?? 0,
        amount_paid: inv.amount_paid ?? 0,
        amount_remaining: inv.amount_remaining ?? 0,
        invoice_date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
      }
      await admin.from('billing_invoices').upsert(payload, { onConflict: 'stripe_invoice_id' })
      break
    }
    case 'customer.created': {
      const c = event.data.object as any
      // If we receive this first, we can't derive company_id; skip
      break
    }
  }

  return new Response('ok', { status: 200 })
})
