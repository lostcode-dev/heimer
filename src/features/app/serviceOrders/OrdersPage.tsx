import { useEffect, useMemo, useState } from 'react'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import type { IColumns, IPagination } from '@/types'
import { useNavigate } from 'react-router-dom'
import { apiOrders } from '@/lib/api'
import { formatDateTimeBR, formatBRL } from '@/lib/format'
import NameWithAvatar from '@/components/common/NameWithAvatar'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, Circle, PackageCheck, Truck, XCircle, Eye, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

type OrderRow = {
  id: string
  ticket_number: string
  customer_name: string
  customer_phone?: string | null
  technician_name?: string
  technician_phone?: string | null
  status: 'OPEN' | 'IN_PROGRESS' | 'AWAITING_PARTS' | 'READY' | 'DELIVERED' | 'CANCELLED'
  total_amount: number
  created_at: string
  due_date?: string | null
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
    view: ((row: Record<string, any>) => {
      navigate(`/app/orders/${(row as OrderRow).id}`)
    }) as (row: Record<string, any>) => void,
    update: (((rowOrArray: any) => {
      const row = Array.isArray(rowOrArray) ? (rowOrArray[0] as OrderRow) : (rowOrArray as OrderRow)
      navigate(`/app/orders/${row.id}/edit`)
    }) as unknown) as (updatedData: Record<string, any>[]) => void,
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
    { label: 'Cliente', field: 'customer_name', sortable: true, component: ({ row }) => (
      <NameWithAvatar name={row.customer_name} phone={row.customer_phone ?? undefined} />
    ) },
    { label: 'Técnico', field: 'technician_name', sortable: false, component: ({ row }) => (
      <NameWithAvatar name={row.technician_name ?? '-'} phone={row.technician_phone ?? undefined} />
    ) },
    { label: 'Status', field: 'status', sortable: true, component: ({ row }) => {
      const s = row.status
      let cls = 'bg-gray-200 text-gray-800'
      let Icon: any = Circle
      if (s === 'OPEN') { cls = 'bg-blue-100 text-blue-800'; Icon = Circle }
      else if (s === 'IN_PROGRESS') { cls = 'bg-amber-100 text-amber-800'; Icon = PackageCheck }
      else if (s === 'AWAITING_PARTS') { cls = 'bg-purple-100 text-purple-800'; Icon = AlertTriangle }
      else if (s === 'READY') { cls = 'bg-emerald-100 text-emerald-800'; Icon = CheckCircle2 }
      else if (s === 'DELIVERED') { cls = 'bg-sky-100 text-sky-800'; Icon = Truck }
      else if (s === 'CANCELLED') { cls = 'bg-rose-100 text-rose-800'; Icon = XCircle }
      return (
        <Badge variant="outline" className={`gap-1.5 border-transparent ${cls}`}>
          <Icon className="size-3.5" /> {statusLabel[s]}
        </Badge>
      )
    } },
  { label: 'Previsão', field: 'due_date', sortable: true, format: (v) => {
      if (!v) return '—'
      const dt = v.length <= 10 ? new Date(`${v}T00:00:00`) : new Date(v)
      return formatDateTimeBR(dt)
    } },
  { label: 'Total', field: 'total_amount', sortable: true, format: (v) => formatBRL(Number(v) || 0) },
  { label: 'Criada em', field: 'created_at', sortable: true, format: (v) => formatDateTimeBR(v) },
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
        actionsLabels={{ view: 'Detalhes', update: 'Editar', delete: 'Excluir' }}
        actionsIcons={{ view: <Eye size={16} />, update: <Pencil size={16} />, delete: <Trash2 size={16} /> }}
      />
    </>
  )
}
