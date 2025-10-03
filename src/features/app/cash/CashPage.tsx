import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { apiCash } from '@/lib/api'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import type { IColumns, IPagination } from '@/types'
import { MovementForm } from './MovementForm'
import { ExpenseForm } from './ExpenseForm'
import { InternalMovementForm } from './InternalMovementForm'
import CustomInput from '@/components/custom/Input/CustomInput'

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
  const [counted, setCounted] = useState<string>('')
  const [openExpense, setOpenExpense] = useState(false)
  const [openInternal, setOpenInternal] = useState(false)

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
      const countedAmount = Number((counted || '').replace(/[^0-9.,-]/g, '').replace(',', '.')) || undefined
      const res = await apiCash.closeSession(session.id, { counted_amount: countedAmount, closedBy: null })
      toast.success('Caixa fechado')
      setSession(null)
      setRows([])
      if (res.url) window.open(res.url, '_blank')
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao fechar caixa') }
  }

  const columns: IColumns<any>[] = [
    { label: 'Tipo', field: 'type', sortable: true },
    { label: 'Valor', field: 'amount', sortable: true, format: (v) => `R$ ${(Number(v)||0).toFixed(2)}` },
    { label: 'Forma', field: 'method', sortable: true, format: (v) => v ?? '-' },
    { label: 'Categoria', field: 'category', sortable: true, format: (v) => v ?? '-' },
    { label: 'Origem', field: 'reference_type', sortable: true },
    { label: 'Quando', field: 'occurred_at', sortable: true, format: (v) => new Date(v).toLocaleString('pt-BR') },
    { label: 'Obs', field: 'notes', sortable: false, format: (v) => v ?? '-' },
  ]

  const total = useMemo(() => rows.reduce((acc, r) => acc + Number(r.amount || 0), 0), [rows])
  const byMethod = useMemo(() => {
    const m: Record<string, number> = {}
    for (const r of rows) { const k = r.method || '-'; m[k] = (m[k] || 0) + Number(r.amount || 0) }
    return m
  }, [rows])

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Caixa {session ? 'aberto' : 'fechado'}</h2>
        <div className="text-sm flex items-center gap-3">
          <span>Total: <span className="font-semibold">R$ {total.toFixed(2)}</span></span>
          <span className="text-muted-foreground">{Object.entries(byMethod).map(([k,v]) => `${k}: R$ ${v.toFixed(2)}`).join(' · ')}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 items-end">
        {!session && (
          <Button onClick={openSession} className="bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-600">Abrir caixa</Button>
        )}
        {session && (
          <>
            <Button onClick={() => setOpenForm(true)}>Movimentação manual</Button>
            <Button variant="outline" onClick={() => setOpenExpense(true)}>Registrar despesa</Button>
            <Button variant="outline" onClick={() => setOpenInternal(true)}>Reforço/Sangria</Button>
            <Button variant="secondary" onClick={attachPending}>Anexar pagamentos em dinheiro</Button>
            <CustomInput name="counted" label="Conferido em caixa (R$)" value={counted} onChange={setCounted} placeholder="Ex.: 980,00" />
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
          <ExpenseForm open={openExpense} onOpenChange={setOpenExpense} onSubmit={async (d) => { if (!session?.id) return; try { await apiCash.addExpense({ cash_session_id: session.id, ...d }); toast.success('Despesa registrada'); setOpenExpense(false); void fetchMovements(session.id) } catch (e: any) { toast.error(e?.message ?? 'Falha ao registrar despesa') } }} />
          <InternalMovementForm open={openInternal} onOpenChange={setOpenInternal} onSubmit={async (d) => { if (!session?.id) return; try { await apiCash.addInternal({ cash_session_id: session.id, ...d }); toast.success('Movimentação registrada'); setOpenInternal(false); void fetchMovements(session.id) } catch (e: any) { toast.error(e?.message ?? 'Falha ao registrar movimentação') } }} />
        </>
      ) : (
        <Card className="p-4 text-sm text-slate-500">Nenhuma movimentação. Abra o caixa para começar.</Card>
      )}
    </section>
  )
}
