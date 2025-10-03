// @ts-nocheck
// Deno Edge Function: close-cash-session
// Portuguese PDF content, English code identifiers

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function handle(req: Request) {
  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')
  const closedBy = url.searchParams.get('closedBy')
  if (!sessionId) return new Response('sessionId missing', { status: 400 })

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')
  if (!serviceRoleKey || !supabaseUrl) return new Response('env missing', { status: 500 })

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Invariants: no OPEN/IN_PROGRESS with unreconciled cash payments
  const { data: openOrders, error: orderErr } = await supabase
    .from('service_orders')
    .select('id,status')
    .in('status', ['OPEN', 'IN_PROGRESS'])
  if (orderErr) return new Response(orderErr.message, { status: 500 })
  if (openOrders && openOrders.length > 0) {
    return new Response('Há ordens não finalizadas. Não é possível fechar o caixa.', { status: 409 })
  }

  // Compute totals
  const { data: movements, error: movErr } = await supabase
    .from('cash_movements')
    .select('amount,type')
    .eq('cash_session_id', sessionId)
  if (movErr) return new Response(movErr.message, { status: 500 })
  const closingAmount = (movements ?? []).reduce((acc, m) => acc + Number(m.amount), 0)

  // Get counted amount (if provided previously)
  const { data: sessionRow } = await supabase
    .from('cash_sessions')
    .select('counted_amount')
    .eq('id', sessionId)
    .maybeSingle()
  const countedAmount = Number((sessionRow as any)?.counted_amount ?? 0)
  const difference = (Number.isFinite(countedAmount) ? countedAmount : 0) - closingAmount

  // Update cash session
  const { error: updErr } = await supabase
    .from('cash_sessions')
    .update({ closing_amount: closingAmount, closed_at: new Date().toISOString(), closed_by: closedBy, difference })
    .eq('id', sessionId)
  if (updErr) return new Response(updErr.message, { status: 500 })

  // Generate simple PDF (placeholder text in Portuguese) and store to Storage bucket 'reports'
  const pdfContent = new TextEncoder().encode(`Relatório Z\nSessão: ${sessionId}\nTotal calculado: R$ ${closingAmount.toFixed(2)}\nConferido: R$ ${countedAmount.toFixed(2)}\nDiferença: R$ ${difference.toFixed(2)}`)
  const fileName = `reports/${sessionId}.pdf`
  const { error: uploadErr } = await supabase.storage.from('reports').upload(fileName, pdfContent, {
    contentType: 'application/pdf',
    upsert: true,
  })
  if (uploadErr) return new Response(uploadErr.message, { status: 500 })

  const { data: signed } = await supabase.storage.from('reports').createSignedUrl(fileName, 60 * 60)

  // Append audit
  await supabase.from('audit_logs').insert({
    action: 'CLOSE_CASH',
    entity: 'cash_sessions',
    entity_id: sessionId,
    metadata: { signed_url: signed?.signedUrl },
  })

  return new Response(JSON.stringify({ url: signed?.signedUrl }), { headers: { 'content-type': 'application/json' } })
}

Deno.serve(handle)
