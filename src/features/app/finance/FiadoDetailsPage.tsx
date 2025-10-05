import { Fragment, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { apiReceivables, apiCash } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { formatBRL } from '@/lib/format'
import { Button } from '@/components/ui/button'
import NameWithAvatar from '@/components/common/NameWithAvatar'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock3, CircleDot, Ban, Mail, MapPin, Banknote, ArrowDownCircle, Wallet, History, CreditCard } from 'lucide-react'
import { ReceivePayModal } from './ReceivePayModal'
import { MultiReceiveModal } from './MultiReceiveModal'
import { HandCoins } from 'lucide-react'

export default function FiadoDetailsPage() {
    const { customerId } = useParams()
    const [customer, setCustomer] = useState<any | null>(null)
    const [receivables, setReceivables] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [receiveOpen, setReceiveOpen] = useState(false)
    const [selectedReceivable, setSelectedReceivable] = useState<any | null>(null)

    useEffect(() => { void fetchData() }, [customerId])

    async function fetchData() {
        if (!customerId) return
        try {
            setLoading(true)
            const { data } = await apiReceivables.listByCustomerFiados(customerId)
            setCustomer(data.customer)
            setReceivables(data.receivables)
        } catch (e: any) { toast.error(e?.message ?? 'Falha ao carregar fiado do cliente') } finally { setLoading(false) }
    }

    const total = receivables.reduce((acc, r: any) => acc + Number(r.amount || 0), 0)
    const received = receivables.reduce((acc, r: any) => acc + Number(r.received_total || 0), 0)
    const remaining = Math.max(0, total - received)

    const cid = String(customerId ?? '')
    const [multiOpen, setMultiOpen] = useState(false)

    return (
        <section className="space-y-4">
            <Card className="p-4">
                {loading ? (
                    <div className="grid gap-2">
                        <div className="h-5 w-48 bg-muted rounded" />
                        <div className="h-4 w-64 bg-muted rounded" />
                        <div className="h-4 w-80 bg-muted rounded" />
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <NameWithAvatar name={customer?.full_name ?? '-'} phone={customer?.phone ?? undefined} />
                            <div className="text-sm text-muted-foreground flex flex-wrap gap-x-6 gap-y-1">
                                {customer?.email ? (
                                    <span className="inline-flex items-center gap-1">
                                        <Mail className="h-3 w-3" /> {customer.email}
                                    </span>
                                ) : null}
                                {customer?.street ? (
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>
                                            {customer.street}{customer.number ? `, ${customer.number}` : ''}
                                            {customer.neighborhood ? ` · ${customer.neighborhood}` : ''}
                                            {customer.city ? ` · ${customer.city}` : ''}
                                            {customer.state ? `/${customer.state}` : ''}
                                        </span>
                                    </span>
                                ) : null}
                            </div>
                        </div>
                        <div>
                            <Button variant="default" onClick={() => setMultiOpen(true)} className="gap-2"><HandCoins className="h-4 w-4" /> Receber pagamento</Button>

                        </div>
                    </div>
                )}
            </Card>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 w-24 bg-muted rounded" />
                            <div className="h-6 w-32 bg-muted rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border p-3 bg-card relative">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1">Valor Total</div>
                        <div className="text-xl font-bold">{formatBRL(total)}</div>
                        <Banknote className="h-6 w-6 absolute right-3 top-3 text-muted-foreground" />
                    </div>
                    <div className="rounded-lg border p-3 bg-card relative">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1">Recebido</div>
                        <div className="text-xl font-bold text-emerald-600">{formatBRL(received)}</div>
                        <ArrowDownCircle className="h-6 w-6 absolute right-3 top-3 text-muted-foreground" />

                    </div>
                    <div className="rounded-lg border p-3 bg-card relative">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1">Restante</div>
                        <div className="text-xl font-bold text-rose-600">{formatBRL(remaining)}</div>
                        <Wallet className="h-6 w-6 absolute right-3 top-3 text-muted-foreground" />

                    </div>
                </div>
            )}

            <Card className="p-4">
                <div className="font-medium mb-2 inline-flex items-center gap-2"><History className="h-4 w-4" /> Histórico</div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-muted-foreground">
                                <th className="px-2 py-1">Venda</th>
                                <th className="px-2 py-1">Quando</th>
                                <th className="px-2 py-1">Vendedor</th>
                                <th className="px-2 py-1">Descrição</th>
                                <th className="px-2 py-1">Valor</th>
                                <th className="px-2 py-1">Recebido</th>
                                <th className="px-2 py-1">Status</th>
                                <th className="px-2 py-1"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {(loading ? Array.from({ length: 5 }).map((_, idx) => ({ __skeleton: true, id: idx })) : receivables).map((r: any) => {
                                if (r.__skeleton) {
                                    return (
                                        <tr key={`s-${r.id}`} className="border-t">
                                            {Array.from({ length: 8 }).map((_, i) => (
                                                <td key={i} className="px-2 py-2"><div className="h-4 w-full bg-muted rounded" /></td>
                                            ))}
                                        </tr>
                                    )
                                }
                                const received = Number(r.received_total || 0)
                                const total = Number(r.amount || 0)
                                const remaining = Math.max(0, total - received)
                                const seller = r.sale?.seller ?? null
                                const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; Icon: any }> = {
                                    OPEN: { label: 'Aberto', variant: 'destructive', Icon: Clock3 },
                                    PARTIAL: { label: 'Parcial', variant: 'secondary', Icon: CircleDot },
                                    PAID: { label: 'Pago', variant: 'default', Icon: CheckCircle2 },
                                    CANCELLED: { label: 'Cancelado', variant: 'outline', Icon: Ban },
                                }
                                const st = statusMap[r.status] ?? statusMap.OPEN
                                return (
                                    <Fragment key={r.id}>
                                        <tr className="border-t align-middle">
                                            <td className="px-2 py-1">{r.reference_id ? String(r.reference_id).slice(-5) : '-'}</td>
                                            <td className="px-2 py-1">{r.sale?.occurred_at ? new Date(r.sale.occurred_at).toLocaleString('pt-BR') : (r.issue_date ? new Date(r.issue_date).toLocaleString('pt-BR') : '-')}</td>
                                            <td className="px-2 py-1">{seller ? <NameWithAvatar name={seller.full_name} phone={seller.phone ?? undefined} /> : '-'}</td>
                                            <td className="px-2 py-1">{r.description?.replace?.(String(r.reference_id ?? ''), '') ?? r.description}</td>
                                            <td className="px-2 py-1">{formatBRL(total)}</td>
                                            <td className="px-2 py-1">{formatBRL(received)}</td>
                                            <td className="px-2 py-1"><Badge variant={st.variant} className="flex items-center gap-1"><st.Icon className="h-3 w-3" /> {st.label}</Badge></td>
                                            <td className="px-2 py-1 text-right">
                                                <Button size="sm" variant="outline" onClick={() => { setSelectedReceivable(r); setReceiveOpen(true) }} disabled={remaining <= 0}>Receber</Button>
                                            </td>
                                        </tr>
                                        {Array.isArray(r.payments) && r.payments.length > 0 && (
                                            <tr className="bg-muted/40">
                                                <td colSpan={6} className="px-2 py-1">
                                                    <div className="text-xs text-muted-foreground mb-1 inline-flex items-center gap-1"><CreditCard className="h-3 w-3" /> Pagamentos</div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="text-left text-muted-foreground">
                                                                    <th className="px-2 py-1">Quando</th>
                                                                    <th className="px-2 py-1">Método</th>
                                                                    <th className="px-2 py-1">Valor</th>
                                                                    <th className="px-2 py-1">Observações</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {r.payments.map((p: any) => {
                                                                    const labels: Record<string, string> = { CASH: 'Dinheiro', CARD: 'Cartão', PIX: 'PIX', TRANSFER: 'Transferência', FIADO: 'Fiado' }
                                                                    const methodLabel = labels[p.method] ?? p.method
                                                                    return (
                                                                        <tr key={p.id}>
                                                                            <td className="px-2 py-1">{p.received_at ? new Date(p.received_at).toLocaleString('pt-BR') : '-'}</td>
                                                                            <td className="px-2 py-1">{methodLabel}</td>
                                                                            <td className="px-2 py-1">{formatBRL(Number(p.amount) || 0)}</td>
                                                                            <td className="px-2 py-1">{p.notes ?? ''}</td>
                                                                        </tr>
                                                                    )
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            <ReceivePayModal
                open={receiveOpen}
                onOpenChange={setReceiveOpen}
                title="Receber Fiado"
                defaultAmount={Math.max(0, Number(selectedReceivable?.amount || 0) - Number(selectedReceivable?.received_total || 0))}
                onSubmit={async (d) => {
                    try {
                        const session = d.addToCash ? await (async () => { try { return await apiCash.getOpenSession() } catch { return null } })() : null
                        await apiReceivables.addReceipt({ receivable_id: selectedReceivable!.id, amount: d.amount, method: d.method, notes: d.notes ?? null, cash_session_id: session?.id ?? null })
                        toast.success('Recebimento registrado')
                        setReceiveOpen(false)
                        setSelectedReceivable(null)
                        void fetchData()
                    } catch (e: any) { toast.error(e?.message ?? 'Falha ao receber') }
                }}
            />

            <MultiReceiveModal open={multiOpen} onOpenChange={setMultiOpen} customerId={cid} onDone={() => { void fetchData() }} />
        </section>
    )
}
