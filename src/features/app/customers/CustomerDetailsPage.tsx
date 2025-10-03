import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { apiCustomers, apiOrders, apiSales, apiReceivables, apiCash } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, DollarSign, UsersRound, Clock3, AlertTriangle } from 'lucide-react'
import { formatBRL } from '@/lib/format'
import { ReceivePayModal } from '../finance/ReceivePayModal'

export default function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<any | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [receivables, setReceivables] = useState<any[]>([])

  useEffect(() => { let m = true; (async () => {
    try {
      if (!id) return
      const [c, o, s, r] = await Promise.all([
        apiCustomers.getById(id),
        apiOrders.listByCustomer(id, { page: 0, pageSize: 10 }),
        apiSales.listDirectSalesByCustomer(id, { page: 0, pageSize: 10 }),
        apiReceivables.listByCustomerOpen(id),
      ])
      if (!m) return
      setCustomer(c)
      setOrders(o.data)
      setSales(s.data)
      setReceivables(r)
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao carregar cliente') } finally { if (m) setLoading(false) }
  })(); return () => { m = false } }, [id])

  const indicators = useMemo(() => {
    const totalSales = (sales ?? []).reduce((acc, s: any) => acc + Number(s.total || 0), 0)
    const totalOrders = (orders ?? []).reduce((acc, o: any) => acc + Number(o.total_amount || 0), 0)
    const purchasesCount = (sales?.length || 0) + (orders?.length || 0)
    const lastPurchaseTs = Math.max(
      ...(sales ?? []).map((s: any) => new Date(s.occurred_at).getTime()),
      ...(orders ?? []).map((o: any) => new Date(o.created_at).getTime()),
      0,
    )
    const lastPurchase = lastPurchaseTs > 0 ? new Date(lastPurchaseTs) : null
    const outstanding = (receivables ?? []).reduce((acc, r: any) => acc + Number(r.remaining || 0), 0)
    const overdueCount = (receivables ?? []).filter((r: any) => new Date(r.due_date) < new Date()).length
    return { totalSpent: totalSales + totalOrders, purchasesCount, lastPurchase, outstanding, overdueCount }
  }, [sales, orders, receivables])

  const [receiveOpen, setReceiveOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<any | null>(null)
  function openReceive(r: any) { setSelectedRow(r); setReceiveOpen(true) }
  async function submitReceive(data: { amount: number; method: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER'; notes?: string | null }) {
    const session = await (async () => { try { return await apiCash.getOpenSession() } catch { return null } })()
    await apiReceivables.addReceipt({ receivable_id: selectedRow!.id, amount: data.amount, method: data.method, cash_session_id: session?.id ?? null, notes: data.notes ?? null })
    toast.success('Recebimento registrado')
    const updated = await apiReceivables.listByCustomerOpen(id!)
    setReceivables(updated)
    setSelectedRow(null)
  }

  if (loading) return <div className="text-sm text-muted-foreground">Carregando...</div>
  if (!customer) return <div className="text-sm text-muted-foreground">Cliente não encontrado.</div>

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="size-4" /></Button>
          <h2 className="text-lg font-semibold">{customer.full_name}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total gasto</div>
          <div className="flex items-center gap-2 text-xl font-semibold"><DollarSign className="size-4" /> {formatBRL(indicators.totalSpent)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Compras</div>
          <div className="flex items-center gap-2 text-xl font-semibold"><UsersRound className="size-4" /> {indicators.purchasesCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Última compra</div>
          <div className="flex items-center gap-2 text-xl font-semibold"><Clock3 className="size-4" /> {indicators.lastPurchase ? indicators.lastPurchase.toLocaleDateString('pt-BR') : '-'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Em aberto</div>
          <div className="flex items-center gap-2 text-xl font-semibold"><AlertTriangle className="size-4 text-rose-600" /> {formatBRL(indicators.outstanding)}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-2">
          <div className="text-sm font-semibold">Vendas (Produtos)</div>
          <ul className="space-y-2 text-sm">
            {sales.length === 0 ? <li className="text-muted-foreground">Sem vendas.</li> : sales.map((s: any) => (
              <li key={s.id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <div className="font-medium">{s.product?.sku ?? ''} · {s.product?.name ?? ''}</div>
                  <div className="text-xs text-muted-foreground">{new Date(s.occurred_at).toLocaleString('pt-BR')}</div>
                </div>
                <div className="text-right">
                  <div>{s.qty} × {formatBRL(s.unit_price)}</div>
                  <div className="text-muted-foreground text-xs">Total {formatBRL(s.total)}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="text-sm font-semibold">Ordens de Serviço</div>
          <ul className="space-y-2 text-sm">
            {orders.length === 0 ? <li className="text-muted-foreground">Sem ordens.</li> : orders.map((o: any) => (
              <li key={o.id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <div className="font-medium">{o.ticket_number}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString('pt-BR')}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{o.status}</div>
                  <div className="font-medium">{formatBRL(o.total_amount)}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-4 space-y-2">
        <div className="text-sm font-semibold">Em aberto (Contas a Receber deste cliente)</div>
        <ul className="space-y-2 text-sm">
          {receivables.length === 0 ? <li className="text-muted-foreground">Nada em aberto.</li> : receivables.map((r: any) => (
            <li key={r.id} className="flex items-center justify-between rounded border p-2">
              <div>
                <div className="font-medium">{r.description}</div>
                <div className="text-xs text-muted-foreground">Vence {new Date(r.due_date).toLocaleDateString('pt-BR')}</div>
              </div>
              <div className="text-right">
                <div className="text-xs">{formatBRL(r.received_total)} de {formatBRL(r.amount)}</div>
                <div className="font-medium">Restante {formatBRL(r.remaining)}</div>
                <Button variant="outline" size="sm" className="mt-1" onClick={() => openReceive(r)}>Receber</Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <ReceivePayModal open={receiveOpen} onOpenChange={setReceiveOpen} title="Receber" defaultAmount={selectedRow?.remaining ?? 0} onSubmit={async (d) => { try { await submitReceive(d) } catch (e: any) { toast.error(e?.message ?? 'Falha ao receber') } }} />
    </section>
  )
}
