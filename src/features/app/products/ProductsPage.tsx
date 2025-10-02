import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import type { IColumns, IPagination } from '@/types'
import { apiProducts } from '@/lib/api'
import { ProductForm } from './ProductForm'
import { formatBRL } from '@/lib/format'
import { apiProductSuppliers } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Product = {
  id: string
  sku: string
  name: string
  category: string | null
  unit_cost: number
  unit_price: number
  reorder_level: number
  created_at: string
  stock_qty?: number
  categories?: string[] | null
  tags?: string[] | null
}

export default function ProductsPage() {
  const [pagination, setPagination] = useState<IPagination>({
    sortField: 'created_at', sortOrder: 'DESC', search: '', currentPage: 1, itemsPerPage: 10,
    currentTotalItems: 0, totalItems: 0, totalPages: 1,
  })
  const [rows, setRows] = useState<Product[]>([])
  const [selected, setSelected] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [editKey, setEditKey] = useState(0)

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
      setRows((data ?? []) as Product[])
      setPagination((p) => ({ ...p, currentTotalItems: data?.length ?? 0, totalItems: count ?? 0, totalPages: Math.max(1, Math.ceil((count ?? 0) / p.itemsPerPage)) }))
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao carregar produtos')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [pagination.currentPage, pagination.itemsPerPage, pagination.search, pagination.sortField, pagination.sortOrder])

  const onRequest = (updated: IPagination) => setPagination(updated)

  const onAddItem = () => { setEditing(null); setEditKey((k) => k + 1); setOpenForm(true) }

  async function onRemoveItens(items: Product[]) {
    try {
      const removed = await apiProducts.removeMany(items.map((i) => i.id))
      toast.success(`${removed} produto(s) removido(s)`); setSelected([]); fetchData()
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao remover') }
  }

  // We'll enhance onSave to accept suppliers via a temporary ref stored on window by the form
  async function onSave(data: { sku: string; name: string; category?: string | null; unit_cost?: number; unit_price: number; reorder_level?: number; categories?: string[]; tags?: string[] }) {
    try {
      let productId: string
      if (editing) {
        const updated = await apiProducts.update(editing.id, data) as any
        productId = updated.id
        toast.success('Produto atualizado')
      } else {
        const created = await apiProducts.create(data) as any
        productId = created.id
        toast.success('Produto criado')
      }

      // Persist supplier links if available from global buffer (set by ProductForm)
      const buffer: any = (window as any).__productSuppliersBuffer
      if (productId && Array.isArray(buffer) && buffer.length >= 0) {
        await apiProductSuppliers.replaceAll(productId, buffer)
      }
      ; (window as any).__productSuppliersBuffer = undefined
      setOpenForm(false); setEditing(null); fetchData()
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao salvar') }
  }

  const actions = useMemo(() => ({
    update: ((updatedData: Record<string, any>[]) => {
      const row = Array.isArray(updatedData) ? updatedData[0] : (updatedData as unknown as Record<string, any>)
      setEditing(row as Product); setEditKey((k) => k + 1); setOpenForm(true)
    }) as (updatedData: Record<string, any>[]) => void,
    delete: ((row: Record<string, any>) => { (async () => { try { await apiProducts.remove((row as Product).id); toast.success('Produto removido'); fetchData() } catch (e: any) { toast.error(e?.message ?? 'Falha ao remover') } })() }) as (row: Record<string, any>) => void,
  }), [])

  const CategoriesCell: React.FC<{ row: Product }> = ({ row }) => {
    const list = Array.isArray(row.categories) ? row.categories.filter(Boolean) : []
    if (!list.length) return <>-</>
    const visible = list.slice(0, 3)
    const hidden = list.slice(3)
    return (
      <div className="flex gap-1">
        {visible.map((c, i) => (<Badge key={`${c}-${i}`} variant="outline">{c}</Badge>))}
        {hidden.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline">+{hidden.length}</Badge>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              <div className="flex flex-row items-center gap-1 whitespace-nowrap">
                {hidden.map((c, i) => (
                  <Badge key={`h-${c}-${i}`} variant="outline" className="bg-background text-foreground">
                    {c}
                  </Badge>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    )
  }

  const TagsCell: React.FC<{ row: Product }> = ({ row }) => {
    const list = Array.isArray(row.tags) ? row.tags.filter(Boolean) : []
    if (!list.length) return <>-</>
    const visible = list.slice(0, 3)
    const hidden = list.slice(3)
    return (
      <div className="flex  gap-1">
        {visible.map((t, i) => (<Badge key={`${t}-${i}`} variant="outline">{t}</Badge>))}
        {hidden.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline">+{hidden.length}</Badge>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              <div className="flex flex-row items-center gap-1 whitespace-nowrap">
                {hidden.map((t, i) => (
                  <Badge key={`h-${t}-${i}`} variant="outline" className="bg-background text-foreground">
                    {t}
                  </Badge>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    )
  }

  const columns: IColumns<Product>[] = [
    { label: 'SKU', field: 'sku', sortable: true },
    { label: 'Nome', field: 'name', sortable: true },
    { label: 'Custo', field: 'unit_cost', sortable: true, format: (v) => formatBRL(Number(v) || 0) },
    { label: 'Preço', field: 'unit_price', sortable: true, format: (v) => formatBRL(Number(v) || 0) },
    { label: 'Margem', field: 'unit_price', sortable: false, format: (_v, row) => formatBRL((Number(row.unit_price || 0) - Number(row.unit_cost || 0))) },
    { label: 'Estoque', field: 'stock_qty', sortable: true, format: (v) => String(v ?? 0) },
    { label: 'Categorias', field: 'categories', sortable: false, component: CategoriesCell },
    { label: 'Tags', field: 'tags', sortable: false, component: TagsCell },
    { label: 'Criado em', field: 'created_at', sortable: true, format: (v) => new Date(v).toLocaleString('pt-BR') },
  ]

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <CustomTable
          data={rows}
          columns={columns}
          pagination={pagination}
          selected={selected}
          loading={loading}
          actions={actions}
          onRowSelectionChange={(rows: unknown[]) => setSelected(rows as Product[])}
          onRequest={onRequest}
          onAddItem={onAddItem}
          onRemoveItens={(rows: unknown[]) => { void onRemoveItens(rows as Product[]) }}
        />
        <ProductForm
          key={`${editing?.id ?? 'new'}-${editKey}`}
          open={openForm}
          onOpenChange={setOpenForm}
          initial={editing ?? undefined}
          loading={loading}
          onSubmit={onSave}
        />
      </div>
    </div>
  )
}
