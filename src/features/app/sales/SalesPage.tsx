import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomSelect from '@/components/custom/Input/CustomSelect'
import { apiProductSearch, apiInventory, apiCash, apiSales } from '@/lib/api'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import type { IColumns, IPagination } from '@/types'
import { formatBRL, parseBRL } from '@/lib/format'


export default function SalesPage() {
  const [open, setOpen] = useState(true)
  const [options, setOptions] = useState<{ value: string; label: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<{ product_id: string; qty: number; unit_price: number; customer_id?: string | null; method: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER' }>({ product_id: '', qty: 1, unit_price: 0, method: 'CASH' })
  const [rows, setRows] = useState<any[]>([])
  const [pagination, setPagination] = useState<IPagination>({ sortField: 'occurred_at', sortOrder: 'DESC', search: '', currentPage: 1, itemsPerPage: 10, currentTotalItems: 0, totalItems: 0, totalPages: 1 })

  useEffect(() => {
    // preload products
    (async () => {
      const data = await apiProductSearch.search('')
      setOptions(data.map((p: any) => ({ value: p.id, label: `${p.sku ?? ''} · ${p.name}` })))
    })()
  }, [])

  useEffect(() => { void fetchSales() }, [pagination.currentPage, pagination.itemsPerPage, pagination.sortField, pagination.sortOrder])

  async function fetchSales() {
    try {
      const { data, count } = await apiSales.listDirectSales({ page: pagination.currentPage - 1, pageSize: pagination.itemsPerPage, sortBy: pagination.sortField, sortDir: pagination.sortOrder === 'ASC' ? 'asc' : 'desc' })
      setRows(data ?? [])
      setPagination((p) => ({ ...p, currentTotalItems: data?.length ?? 0, totalItems: count ?? 0, totalPages: Math.max(1, Math.ceil((count ?? 0) / p.itemsPerPage)) }))
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao carregar vendas')
    }
  }

  function change<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: val }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.product_id) return toast.error('Selecione um produto')
    if (Number(form.qty) <= 0) return toast.error('Quantidade inválida')
    if (Number(form.unit_price) <= 0) return toast.error('Preço inválido')
    setLoading(true)
    try {
      // 1) baixa no estoque
      await apiInventory.create({ product_id: form.product_id, type: 'OUT', qty: Number(form.qty), reason: 'Venda direta' })
      // 2) caixa (entrada)
      const session = await (async () => {
        try { const s = await (await import('@/lib/api')).apiCash.getOpenSession(); return s } catch { return null } 
      })()
      if (!session?.id) toast.message('Sem caixa aberto', { description: 'A venda foi registrada no estoque, mas não há caixa aberto para lançar a entrada.' })
      else await apiCash.addIncome({ cash_session_id: session.id, amount: Number(form.qty) * Number(form.unit_price), method: form.method, notes: 'Venda direta' })
      // 3) registrar venda
      await apiSales.createDirectSale({ product_id: form.product_id, qty: Number(form.qty), unit_price: Number(form.unit_price), method: form.method, cash_session_id: session?.id ?? null })
      toast.success('Venda registrada')
      setOpen(false)
      void fetchSales()
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao registrar venda')
    } finally {
      setLoading(false)
    }
  }

  const columns: IColumns[] = [
    { label: 'Quando', field: 'occurred_at', sortable: true, format: (v) => new Date(v).toLocaleString('pt-BR') },
    { label: 'Produto', field: 'product', sortable: false, format: (_v, row) => `${row.product?.sku ?? ''} · ${row.product?.name ?? ''}` },
    { label: 'Qtd', field: 'qty', sortable: true },
    { label: 'Preço', field: 'unit_price', sortable: true, format: (v) => formatBRL(Number(v)||0) },
    { label: 'Total', field: 'total', sortable: true, format: (v) => formatBRL(Number(v)||0) },
    { label: 'Forma', field: 'method', sortable: true },
  ]

  const onRequest = (updated: IPagination) => setPagination(updated)

  return (
    <section className="space-y-6">
      <CustomForm open={open} onOpenChange={setOpen} title="Nova venda" onSubmit={submit} submitLabel={loading ? 'Salvando...' : 'Registrar venda'} submitDisabled={loading}>
        <>
          <CustomSelect name="product" label="Produto" value={form.product_id} onChange={(v) => change('product_id', v)} options={options} searchable onSearch={async (q) => {
            const data = await apiProductSearch.search(q)
            setOptions(data.map((p: any) => ({ value: p.id, label: `${p.sku ?? ''} · ${p.name}` })))
          }} />
          <div className="grid md:grid-cols-3 gap-4">
            <CustomInput name="qty" label="Quantidade" value={String(form.qty)} onChange={(v) => change('qty', Number(v.replace(/\D/g, '')) || 0)} />
            <CustomInput name="price" label="Preço unitário" value={formatBRL(form.unit_price)} onChange={(v) => change('unit_price', parseBRL(v))} />
            <CustomSelect name="method" label="Forma de pagamento" value={form.method} onChange={(v) => change('method', v as any)} options={[{ value: 'CASH', label: 'Dinheiro' }, { value: 'CARD', label: 'Cartão' }, { value: 'PIX', label: 'PIX' }, { value: 'TRANSFER', label: 'Transferência' }]} />
          </div>
          {/* Cliente opcional pode ser adicionado depois via busca; guardamos o id quando estiver disponível */}
        </>
      </CustomForm>

      <div>
        <CustomTable
          data={rows}
          columns={columns}
          pagination={pagination}
          selected={[]}
          loading={loading}
          onRequest={onRequest}
        />
      </div>
    </section>
  )
}
