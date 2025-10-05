import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomSelect from '@/components/custom/Input/CustomSelect'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import type { IColumns, IPagination } from '@/types'
import { apiCustomerSearch, apiReceivables, apiCash } from '@/lib/api'
import { formatBRL, parseBRL } from '@/lib/format'
import { ReceivePayModal } from './ReceivePayModal'

export default function ReceivablesPage() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<{ value: string; label: string }[]>([])
  const [form, setForm] = useState<{ customer_id?: string | null; description: string; due_date: string; amount: number; notes?: string | null }>({ description: '', due_date: '', amount: 0 })
  const [rows, setRows] = useState<any[]>([])
  const [filters, setFilters] = useState<{ startDate?: string; endDate?: string; status?: string }>({})
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<any | null>(null)
  const [pagination, setPagination] = useState<IPagination>({ sortField: 'due_date', sortOrder: 'ASC', search: '', currentPage: 1, itemsPerPage: 10, currentTotalItems: 0, totalItems: 0, totalPages: 1 })

  const columns: IColumns<any>[] = [
    { label: 'Vencimento', field: 'due_date', sortable: true, format: (v) => new Date(v).toLocaleDateString('pt-BR') },
    { label: 'Cliente', field: 'customer_name', sortable: false },
    { label: 'Descrição', field: 'description', sortable: true },
    { label: 'Valor', field: 'amount', sortable: true, format: (v) => formatBRL(Number(v) || 0) },
    { label: 'Recebido', field: 'received_total', sortable: true, format: (v) => formatBRL(Number(v) || 0) },
    { label: 'Restante', field: 'remaining', sortable: true, format: (v) => formatBRL(Number(v) || 0) },
    { label: 'Status', field: 'status', sortable: true },
  ]

  useEffect(() => { void fetchRows() }, [pagination.currentPage, pagination.itemsPerPage, pagination.sortField, pagination.sortOrder, filters.startDate, filters.endDate, filters.status])

  async function fetchRows() {
    try {
      const { data, count } = await apiReceivables.listPaginated({ page: pagination.currentPage - 1, pageSize: pagination.itemsPerPage, sortBy: pagination.sortField, sortDir: pagination.sortOrder === 'ASC' ? 'asc' : 'desc', startDate: filters.startDate, endDate: filters.endDate, status: filters.status })
      setRows(data ?? [])
      setPagination((p) => ({ ...p, currentTotalItems: data?.length ?? 0, totalItems: count ?? 0, totalPages: Math.max(1, Math.ceil((count ?? 0) / p.itemsPerPage)) }))
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao carregar recebíveis') }
  }

  function change<K extends keyof typeof form>(key: K, val: (typeof form)[K]) { setForm((p) => ({ ...p, [key]: val })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description?.trim()) return toast.error('Informe a descrição')
    if (!form.due_date) return toast.error('Informe o vencimento')
    if (Number(form.amount) <= 0) return toast.error('Informe um valor válido')
    setLoading(true)
    try {
      await apiReceivables.create(form)
      toast.success('Recebível criado')
      setOpen(false)
      setForm({ description: '', due_date: '', amount: 0 })
      void fetchRows()
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao criar recebível') } finally { setLoading(false) }
  }

  function openReceive(row: any) { setSelectedRow(row); setReceiveOpen(true) }
  async function submitReceive(data: { amount: number; method: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER'; notes?: string | null; addToCash?: boolean }) {
    const session = data.addToCash ? await (async () => { try { return await apiCash.getOpenSession() } catch { return null } })() : null
    await apiReceivables.addReceipt({ receivable_id: selectedRow!.id, amount: data.amount, method: data.method, cash_session_id: session?.id ?? null, notes: data.notes ?? null })
    toast.success('Recebimento registrado')
    setSelectedRow(null)
    void fetchRows()
  }

  const actions = useMemo(() => ({ custom: [{ key: 'receive', label: 'Receber', onClick: openReceive }] }), [])

  return (
    <section className="space-y-6">
      <CustomForm open={open} onOpenChange={setOpen} title="Novo recebível" onSubmit={submit} submitLabel={loading ? 'Salvando...' : 'Salvar'} submitDisabled={loading}>
        <>
          <CustomSelect name="customer" label="Cliente" value={form.customer_id ?? ''} onChange={(v) => change('customer_id', v)} options={options} searchable onSearch={async (q) => {
            const data = await apiCustomerSearch.search(q)
            setOptions(data.map((c: any) => ({ value: c.id, label: `${c.full_name ?? ''} ${c.phone ? '· ' + c.phone : ''}` })))
          }} />
          <CustomInput name="description" label="Descrição" value={form.description} onChange={(v) => change('description', v)} />
          <div className="grid md:grid-cols-3 gap-4">
            <CustomInput name="due" type="date" label="Vencimento" value={form.due_date} onChange={(v) => change('due_date', v)} />
            <CustomInput name="amount" label="Valor" value={formatBRL(form.amount)} onChange={(v) => change('amount', parseBRL(v))} />
            <CustomInput name="notes" label="Observações" value={form.notes ?? ''} onChange={(v) => change('notes', v)} />
          </div>
        </>
        <div className="grid md:grid-cols-4 gap-4 mt-2">
          <CustomInput name="start" type="date" label="Início" value={filters.startDate ?? ''} onChange={(v) => setFilters((f) => ({ ...f, startDate: v }))} />
          <CustomInput name="end" type="date" label="Fim" value={filters.endDate ?? ''} onChange={(v) => setFilters((f) => ({ ...f, endDate: v }))} />
          <CustomSelect name="status" label="Status" value={filters.status ?? 'ALL'} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} options={[{ value: 'ALL', label: 'Todos' }, { value: 'OPEN', label: 'Aberto' }, { value: 'PARTIAL', label: 'Parcial' }, { value: 'PAID', label: 'Pago' }, { value: 'CANCELLED', label: 'Cancelado' }]} />
        </div>
      </CustomForm>

      <CustomTable data={rows} columns={columns} pagination={pagination} selected={[]} loading={loading} onRequest={setPagination as any} actions={actions as any} />

      <ReceivePayModal open={receiveOpen} onOpenChange={setReceiveOpen} title="Receber" defaultAmount={selectedRow?.remaining ?? 0} onSubmit={async (d) => { try { await submitReceive(d) } catch (e: any) { toast.error(e?.message ?? 'Falha ao receber') } }} />
    </section>
  )
}
