import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import type { IColumns, IPagination } from '@/types'
import { apiProducts } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatBRL } from '@/lib/format'

export type StockRow = {
  id: string
  sku: string
  name: string
  category: string | null
  stock_qty: number
  reorder_level: number
  unit_cost?: number | null
  unit_price?: number | null
}

export default function InventoryStockPage() {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState<IPagination>({
    sortField: 'name', sortOrder: 'ASC', search: '', currentPage: 1, itemsPerPage: 10,
    currentTotalItems: 0, totalItems: 0, totalPages: 1,
  })
  const [rows, setRows] = useState<StockRow[]>([])
  const [selected, setSelected] = useState<StockRow[]>([])
  const [loading, setLoading] = useState(false)

  async function fetchData() {
    setLoading(true)
    try {
      const { data, count } = await apiProducts.listPaginated({
        page: pagination.currentPage - 1,
        pageSize: pagination.itemsPerPage,
        query: pagination.search,
        sortBy: pagination.sortField,
        sortDir: pagination.sortOrder === 'ASC' ? 'asc' : 'desc',
      })
      setRows((data ?? []) as StockRow[])
      setPagination((p) => ({ ...p, currentTotalItems: data?.length ?? 0, totalItems: count ?? 0, totalPages: Math.max(1, Math.ceil((count ?? 0) / p.itemsPerPage)) }))
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao carregar estoque')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [pagination.currentPage, pagination.itemsPerPage, pagination.search, pagination.sortField, pagination.sortOrder])

  const onRequest = (updated: IPagination) => setPagination(updated)

  const actions = useMemo(() => ({
    update: ((row: Record<string, any>) => { const r = row as StockRow; navigate(`/app/products/${r.sku}`) }) as (updatedData: Record<string, any>[]) => void,
  }), [navigate])

  const columns: IColumns<StockRow>[] = [
    {
      label: 'SKU',
      field: 'sku',
      sortable: true,
      component: ({ row }) => (
        <Button
          variant="link"
          className="p-0 h-auto font-medium text-muted-foreground cursor-pointer" 
          onClick={() => navigate(`/app/products/${row.sku}`)}
        >
          {row.sku}
        </Button>
      ),
    },
    { label: 'Produto', field: 'name', sortable: true },
    {
      label: 'Preço',
      field: 'unit_price',
      sortable: true,
      component: ({ row }) => (
        <span>{formatBRL(Number(row.unit_price ?? 0))}</span>
      ),
    },
    {
      label: 'Estoque',
      field: 'stock_qty',
      sortable: true,
      component: ({ row }) => {
        const critical = Number(row.stock_qty ?? 0) <= Number(row.reorder_level ?? 0)
        const cls = critical ? 'bg-rose-600 text-white border-transparent' : 'bg-emerald-600 text-white border-transparent'
        const Icon = critical ? AlertTriangle : CheckCircle
        return (
          <Badge className={`px-2 py-0.5 gap-1.5 ${cls}`}>
            <Icon className="size-3.5" />
            {Number(row.stock_qty ?? 0)}
          </Badge>
        )
      },
    },
    { label: 'Mínimo', field: 'reorder_level', sortable: true },
  ]

  return (
    <CustomTable
      data={rows}
      columns={columns}
      pagination={pagination}
      selected={selected}
      loading={loading}
      actions={actions as any}
      actionsLabels={{ update: 'Detalhes' }}
      actionsIcons={{ update: <Eye className="size-4" /> }}
      onRowSelectionChange={(rows: unknown[]) => setSelected(rows as StockRow[])}
      onRequest={onRequest}
    />
  )
}
