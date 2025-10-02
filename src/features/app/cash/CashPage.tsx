import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { apiCash } from '@/lib/api'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import type { IColumns, IPagination } from '@/types'
import { MovementForm } from './MovementForm'

export default function CashPage() {
  const [session, setSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [openForm, setOpenForm] = useState(false)
  const [pagination, setPagination] = useState<IPagination>({
    sortField: 'occurred_at', sortOrder: 'DESC', search: '', currentPage: 1, itemsPerPage: 10,
    currentTotalItems: 0, totalItems: 0, totalPages: 1,
  })
  const [rows, setRows] = useState<any[]>([])
  const [selected, setSelected] = useState<any[]>([])

  async function fetchSession() {
    const s = await apiCash.getOpenSession()
    setSession(s)
    if (s) void fetchMovements(s.id)
    else { setRows([]); setPagination((p) => ({ ...p, currentTotalItems: 0, totalItems: 0, totalPages: 1 })) }
  }

  async function fetchMovements(sessionId: string) {
    setLoading(true)
    try {
      const { data, count } = await apiCash.listMovements(sessionId, { page: pagination.currentPage - 1, pageSize: pagination.itemsPerPage })
      setRows(data)
      setPagination((p) => ({ ...p, currentTotalItems: data.length, totalItems: count, totalPages: Math.max(1, Math.ceil((count ?? 0) / p.itemsPerPage)) }))
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao carregar movimentações')
    } finally { setLoading(false) }
  }

  useEffect(() => { void fetchSession() }, [])
  useEffect(() => { if (session?.id) void fetchMovements(session.id) }, [pagination.currentPage, pagination.itemsPerPage, session?.id])

  const onRequest = (updated: IPagination) => setPagination(updated)

  async function openSession() {
    try {
      const created = await apiCash.openSession({ opening_amount: 0 })
      toast.success('Caixa aberto')
      setSession(created)
      setPagination((p) => ({ ...p, currentPage: 1 }))
      void fetchMovements(created.id)
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao abrir caixa') }
  }

  async function addMovement(data: { type: 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT'; amount: number; notes?: string | null }) {
    if (!session?.id) return
    try {
      await apiCash.addManualMovement({ cash_session_id: session.id, ...data })
      toast.success('Movimentação registrada')
      setOpenForm(false)
      void fetchMovements(session.id)
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao registrar movimentação') }
  }

  async function attachPending() {
    if (!session?.id) return
    try {
      const n = await apiCash.attachPendingCashPayments(session.id)
      if (n > 0) { toast.success(`${n} pagamento(s) anexado(s) ao caixa`) } else { toast.info('Nenhum pagamento em dinheiro pendente') }
      void fetchMovements(session.id)
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao anexar pagamentos') }
  }

  async function closeSession() {
    if (!session?.id) return
    try {
      const res = await apiCash.closeSession(session.id)
      toast.success('Caixa fechado')
      setSession(null)
      setRows([])
      if (res.url) window.open(res.url, '_blank')
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao fechar caixa') }
  }

  const columns: IColumns<any>[] = [
    { label: 'Tipo', field: 'type', sortable: true },
    { label: 'Valor', field: 'amount', sortable: true, format: (v) => `R$ ${(Number(v)||0).toFixed(2)}` },
    { label: 'Origem', field: 'reference_type', sortable: true },
    { label: 'Quando', field: 'occurred_at', sortable: true, format: (v) => new Date(v).toLocaleString('pt-BR') },
    { label: 'Obs', field: 'notes', sortable: false, format: (v) => v ?? '-' },
  ]

  const total = useMemo(() => rows.reduce((acc, r) => acc + Number(r.amount || 0), 0), [rows])

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Caixa {session ? 'aberto' : 'fechado'}</h2>
        <div className="text-sm">Total: <span className="font-semibold">R$ {total.toFixed(2)}</span></div>
      </div>
      <div className="flex gap-2">
        {!session && (
          <Button onClick={openSession} className="bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-600">Abrir caixa</Button>
        )}
        {session && (
          <>
            <Button onClick={() => setOpenForm(true)}>Movimentação manual</Button>
            <Button variant="secondary" onClick={attachPending}>Anexar pagamentos em dinheiro</Button>
            <Button variant="destructive" onClick={closeSession}>Fechar caixa</Button>
          </>
        )}
      </div>
      {session ? (
        <>
          <CustomTable
            data={rows}
            columns={columns}
            pagination={pagination}
            selected={selected}
            loading={loading}
            onRowSelectionChange={(rows: unknown[]) => setSelected(rows as any[])}
            onRequest={onRequest}
          />
          <MovementForm open={openForm} onOpenChange={setOpenForm} onSubmit={addMovement} />
        </>
      ) : (
        <Card className="p-4 text-sm text-slate-500">Nenhuma movimentação. Abra o caixa para começar.</Card>
      )}
    </section>
  )
}
