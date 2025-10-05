import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { apiSales } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import type { IColumns, IPagination } from '@/types'
import { formatBRL } from '@/lib/format'
import NameWithAvatar from '@/components/common/NameWithAvatar'
import { Badge } from '@/components/ui/badge'
import { SaleForm } from './SaleForm'

type SaleOrder = {
  id: string
  occurred_at: string
  total: number
  customer?: { id: string; full_name: string; phone?: string | null } | null
  seller?: { id: string; full_name: string; phone?: string | null } | null
  payments?: { method: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER'; amount: number }[]
}


export default function SalesPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<SaleOrder[]>([])
  const [selected, setSelected] = useState<SaleOrder[]>([])
  const [pagination, setPagination] = useState<IPagination>({ sortField: 'occurred_at', sortOrder: 'DESC', search: '', currentPage: 1, itemsPerPage: 10, currentTotalItems: 0, totalItems: 0, totalPages: 1 })
  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<SaleOrder | null>(null)
  const [editKey, setEditKey] = useState(0)

  useEffect(() => { /* no preload needed here; SaleForm handles its own search */ }, [])

  useEffect(() => { void fetchSales() }, [pagination.currentPage, pagination.itemsPerPage, pagination.sortField, pagination.sortOrder])

  async function fetchSales() {
    try {
      setLoading(true)
      const { data, count } = await apiSales.listPosSales({ page: pagination.currentPage - 1, pageSize: pagination.itemsPerPage, sortBy: pagination.sortField, sortDir: pagination.sortOrder === 'ASC' ? 'asc' : 'desc' })
      setRows((data ?? []) as SaleOrder[])
      setPagination((p) => ({ ...p, currentTotalItems: data?.length ?? 0, totalItems: count ?? 0, totalPages: Math.max(1, Math.ceil((count ?? 0) / p.itemsPerPage)) }))
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao carregar vendas')
    } finally {
      setLoading(false)
    }
  }

  const CustomerCell: React.FC<{ row: SaleOrder }> = ({ row }) => (
    row.customer ? <NameWithAvatar name={row.customer.full_name} phone={row.customer.phone ?? undefined} /> : <span>-</span>
  )

  const PaymentsCell: React.FC<{ row: SaleOrder }> = ({ row }) => {
    const methods = Array.from(new Set((row.payments ?? []).map(p => p.method)))
    if (!methods.length) return <span className="text-muted-foreground">-</span>
    const labels: Record<string, string> = { CASH: 'Dinheiro', CARD: 'Cartão', PIX: 'PIX', TRANSFER: 'Transf.', FIADO: 'Fiado' }
    return (
      <div className="flex flex-wrap gap-1">
        {methods.map(m => (
          <Badge key={m} variant="outline">{labels[m] ?? m}</Badge>
        ))}
      </div>
    )
  }

  const columns: IColumns<SaleOrder>[] = [
    { label: 'Quando', field: 'occurred_at', sortable: true, format: (v) => new Date(v).toLocaleString('pt-BR') },
    { label: 'Cliente', field: 'customer', sortable: false, component: CustomerCell },
  { label: 'Vendedor', field: 'seller', sortable: false, component: ({ row }) => row.seller ? <NameWithAvatar name={row.seller.full_name} phone={row.seller.phone ?? undefined} /> : <span>-</span> },
    { label: 'Pagamento', field: 'payments', sortable: false, component: PaymentsCell },
    { label: 'Total', field: 'total', sortable: true, format: (v) => formatBRL(Number(v) || 0) },
  ]

  const onRequest = (updated: IPagination) => setPagination(updated)

  const onAddItem = () => {
    setEditing(null)
    setEditKey((k) => k + 1)
    setOpenForm(true)
  }

  const onRemoveItens = async (items: SaleOrder[]) => {
    if (!items?.length) return
    try {
      setLoading(true)
      for (const it of items) {
        await apiSales.removePosSale(it.id)
      }
      toast.success(`${items.length} venda(s) removida(s)`) 
      setSelected([])
      void fetchSales()
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao remover venda(s)')
    } finally {
      setLoading(false)
    }
  }

  const actions = useMemo(() => ({
    view: (row: Record<string, any>) => { navigate(`/app/sales/${(row as SaleOrder).id}`) },
    update: (updatedData: Record<string, any>[]) => {
      const row = Array.isArray(updatedData) ? updatedData[0] : (updatedData as unknown as Record<string, any>)
      setEditing(row as SaleOrder)
      setEditKey((k) => k + 1)
      setOpenForm(true)
    },
    delete: (row: Record<string, any>) => {
      (async () => {
        try {
          await apiSales.removePosSale((row as SaleOrder).id)
          toast.success('Venda removida com sucesso')
          void fetchSales()
        } catch (err: any) {
          toast.error(err?.message ?? 'Falha ao remover venda')
        }
      })()
    },
  }), [navigate])

  return (
    <section className="space-y-6">
      <SaleForm
        key={`${editing?.id ?? 'new'}-${editKey}`}
        open={openForm}
        onOpenChange={setOpenForm}
        initial={editing ?? undefined}
        onSubmit={async (payload) => {
          const itemsTotal = payload.items.reduce((acc, it) => acc + Number(it.qty) * Number(it.unit_price), 0)
          const paymentsTotal = payload.payments.reduce((acc, p) => acc + Number(p.amount), 0)
          if (!payload.items.length) { throw new Error('Adicione pelo menos um item') }
          if (!payload.payments.length) { throw new Error('Informe pelo menos uma forma de pagamento') }
          if (Math.abs(itemsTotal - paymentsTotal) > 0.009) { throw new Error('Total dos pagamentos deve igualar ao total dos itens') }
          setLoading(true)
          try {
            if (editing?.id) {
              await apiSales.updatePosSale(editing.id, payload)
              toast.success('Venda atualizada')
            } else {
              await apiSales.createPosSale(payload)
              toast.success('Venda registrada')
            }
            setOpenForm(false)
            void fetchSales()
          } finally { setLoading(false) }
        }}
      />

      <div>
        <CustomTable
          data={rows}
          columns={columns}
          pagination={pagination}
          selected={selected}
          actions={actions}
          actionsLabels={{ view: 'Detalhes', update: 'Editar', delete: 'Excluir' }}
          onAddItem={onAddItem}
          onRowSelectionChange={(rows: unknown[]) => setSelected(rows as SaleOrder[])}
          onRemoveItens={(rows: unknown[]) => { void onRemoveItens(rows as SaleOrder[]) }}
          loading={loading}
          onRequest={onRequest}
        />
      </div>
    </section>
  )
}
