import { useEffect, useMemo, useState } from 'react'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import type { IColumns, IPagination } from '@/types'
import { useNavigate } from 'react-router-dom'
import { apiOrders } from '@/lib/api'
import { toast } from 'sonner'

type OrderRow = {
  id: string
  ticket_number: string
  customer_name: string
  customer_phone?: string | null
  status: 'OPEN' | 'IN_PROGRESS' | 'AWAITING_PARTS' | 'READY' | 'DELIVERED' | 'CANCELLED'
  total_amount: number
  created_at: string
}

const statusLabel: Record<OrderRow['status'], string> = {
  OPEN: 'Aberta',
  IN_PROGRESS: 'Em andamento',
  AWAITING_PARTS: 'Aguardando peças',
  READY: 'Pronta',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelada',
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState<IPagination>({
    sortField: 'created_at',
    sortOrder: 'DESC',
    search: '',
    currentPage: 1,
    itemsPerPage: 10,
    currentTotalItems: 0,
    totalItems: 0,
    totalPages: 1,
  })
  const [rows, setRows] = useState<OrderRow[]>([])
  const [selected, setSelected] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(false)

  async function fetchData() {
    setLoading(true)
    try {
      const { data, count } = await apiOrders.listPaginated({
        page: pagination.currentPage - 1,
        pageSize: pagination.itemsPerPage,
        query: pagination.search,
        sortBy: pagination.sortField,
        sortDir: pagination.sortOrder === 'ASC' ? 'asc' : 'desc',
      })
      setRows((data ?? []) as OrderRow[])
      setPagination((p) => ({
        ...p,
        currentTotalItems: data?.length ?? 0,
        totalItems: count ?? 0,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / p.itemsPerPage)),
      }))
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao carregar ordens')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [pagination.currentPage, pagination.itemsPerPage, pagination.search, pagination.sortField, pagination.sortOrder])

  const onRequest = (updated: IPagination) => setPagination(updated)

  const actions = useMemo(() => ({
    update: ((updatedData: Record<string, any>[]) => {
      const row = Array.isArray(updatedData) ? updatedData[0] : (updatedData as unknown as Record<string, any>)
      navigate(`/app/orders/${(row as OrderRow).id}`)
    }) as (updatedData: Record<string, any>[]) => void,
    delete: ((row: Record<string, any>) => {
      (async () => {
        try {
          await apiOrders.remove((row as OrderRow).id)
          toast.success('Ordem removida')
          fetchData()
        } catch (err: any) {
          toast.error(err?.message ?? 'Falha ao remover ordem')
        }
      })()
    }) as (row: Record<string, any>) => void,
  }), [])

  const columns: IColumns<OrderRow>[] = [
    { label: 'Ticket', field: 'ticket_number', sortable: true },
    { label: 'Cliente', field: 'customer_name', sortable: true, format: (_v, row) => `${row.customer_name}${row.customer_phone ? ` · ${row.customer_phone}` : ''}` },
    { label: 'Status', field: 'status', sortable: true, format: (v) => statusLabel[v as OrderRow['status']] },
    { label: 'Total', field: 'total_amount', sortable: true, format: (v) => `R$ ${(Number(v) || 0).toFixed(2)}` },
    { label: 'Criada em', field: 'created_at', sortable: true, format: (v) => new Date(v).toLocaleString('pt-BR') },
  ]

  return (
    <>
      <CustomTable
        data={rows}
        columns={columns}
        pagination={pagination}
        selected={selected}
        loading={loading}
        actions={actions}
        onRowSelectionChange={(rows: unknown[]) => setSelected(rows as OrderRow[])}
        onRequest={onRequest}
        onAddItem={() => navigate('/app/orders/new')}
        onRemoveItens={(rows: unknown[]) => {
          const ids = (rows as OrderRow[]).map((r) => r.id)
          Promise.all(ids.map((id) => apiOrders.remove(id)))
            .then(() => { toast.success('Ordens removidas'); fetchData() })
            .catch((e) => toast.error(e?.message ?? 'Falha ao remover'))
        }}
      />
    </>
  )
}
