import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { apiInventory, apiProducts, apiProductSuppliers } from '@/lib/api'
import type { IColumns, IPagination } from '@/types'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatBRL } from '@/lib/format'
import { ProductForm } from './ProductForm'

export default function ProductDetailsPage() {
  const navigate = useNavigate()
  const { sku } = useParams<{ sku: string }>()
  const [product, setProduct] = useState<any | null>(null)
  const [pagination, setPagination] = useState<IPagination>({
    sortField: 'occurred_at', sortOrder: 'DESC', search: '', currentPage: 1, itemsPerPage: 10,
    currentTotalItems: 0, totalItems: 0, totalPages: 1,
  })
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Array<{ supplier_id: string; supplier_name?: string; supplier_sku?: string | null; supplier_price?: number | null; notes?: string | null }>>([])
  const [openEdit, setOpenEdit] = useState(false)
  const [saving, setSaving] = useState(false)

  async function fetchProduct() {
    try {
      if (!sku) return
      const p = await apiProducts.getBySku(sku)
      setProduct(p)
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao carregar produto') }
  }

  async function fetchSuppliers() {
    try {
      if (!product?.id) return
      const list = await apiProductSuppliers.listByProduct(product.id)
      setSuppliers(list as any)
    } catch (e: any) {
      // silently ignore
      setSuppliers([])
    }
  }

  async function fetchMovements() {
    if (!product?.id) return
    setLoading(true)
    try {
      const { data, count } = await apiInventory.listByProductPaginated(product.id, {
        page: pagination.currentPage - 1,
        pageSize: pagination.itemsPerPage,
        sortBy: pagination.sortField,
        sortDir: pagination.sortOrder === 'ASC' ? 'asc' : 'desc',
      })
      setRows(data ?? [])
      setPagination((p) => ({ ...p, currentTotalItems: data?.length ?? 0, totalItems: count ?? 0, totalPages: Math.max(1, Math.ceil((count ?? 0) / p.itemsPerPage)) }))
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao carregar movimentos') } finally { setLoading(false) }
  }

  useEffect(() => { void fetchProduct() }, [sku])
  useEffect(() => { if (product?.id) { void fetchSuppliers(); void fetchMovements() } }, [product?.id])
  useEffect(() => { if (product?.id) void fetchMovements() }, [pagination.currentPage, pagination.itemsPerPage, pagination.sortField, pagination.sortOrder])

  const onRequest = (updated: IPagination) => setPagination(updated)

  const columns: IColumns[] = [
    { label: 'Tipo', field: 'type', sortable: true, format: (v) => {
      const map: Record<string, { label: string; className: string }> = {
        IN: { label: 'Entrada', className: 'bg-emerald-600 text-white border-transparent' },
        OUT: { label: 'Saída', className: 'bg-rose-600 text-white border-transparent' },
        ADJUSTMENT: { label: 'Ajuste', className: 'bg-sky-600 text-white border-transparent' },
      }
      const meta = map[v as keyof typeof map] ?? { label: String(v), className: 'bg-muted text-foreground' }
      return <Badge className={`px-2 py-0.5 ${meta.className}`}>{meta.label}</Badge>
    } },
    { label: 'Quantidade', field: 'qty', sortable: true },
    { label: 'Motivo', field: 'reason', sortable: true, format: (v) => v ?? '-' },
    { label: 'Data', field: 'occurred_at', sortable: true, format: (v) => new Date(v).toLocaleString('pt-BR') },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{product ? `${product.sku} · ${product.name}` : 'Carregando...'}</h2>
          <div className="text-sm text-muted-foreground"> Estoque: {product?.stock_qty ?? 0} </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button variant="default" onClick={() => setOpenEdit(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Editar produto
          </Button>
        </div>
      </div>

      {/* Info chips */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant="secondary">Preço: {formatBRL(Number(product?.unit_price ?? 0))}</Badge>
        <Badge variant="secondary">Custo: {formatBRL(Number(product?.unit_cost ?? 0))}</Badge>
      </div>

      {/* Categories & Tags */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Categorias:</span>
          <div className="flex flex-wrap gap-1">
            {Array.isArray(product?.categories) && product!.categories!.length > 0 ? (
              product!.categories!.map((c: string, i: number) => (
                <Badge key={`${c}-${i}`} variant="outline">{c}</Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tags:</span>
          <div className="flex flex-wrap gap-1">
            {Array.isArray(product?.tags) && product!.tags!.length > 0 ? (
              product!.tags!.map((t: string, i: number) => (
                <Badge key={`${t}-${i}`} variant="outline">{t}</Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </div>
        </div>
      </div>

      {/* Suppliers */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Fornecedores</div>
        {suppliers.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhum fornecedor vinculado.</div>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2">Fornecedor</th>
                  <th className="text-left px-3 py-2">SKU</th>
                  <th className="text-left px-3 py-2">Preço</th>
                  <th className="text-left px-3 py-2">Observações</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2">{s.supplier_name ?? '-'}</td>
                    <td className="px-3 py-2">{s.supplier_sku ?? '-'}</td>
                    <td className="px-3 py-2">{formatBRL(Number(s.supplier_price ?? 0))}</td>
                    <td className="px-3 py-2">{s.notes ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CustomTable
        data={rows}
        columns={columns}
        pagination={pagination}
        selected={[]}
        loading={loading}
        onRequest={onRequest}
      />

      {/* Edit Sidebar */}
      {product && (
        <ProductForm
          open={openEdit}
          onOpenChange={setOpenEdit}
          initial={{
            id: product.id,
            sku: product.sku,
            name: product.name,
            category: product.category,
            unit_cost: Number(product.unit_cost ?? 0),
            unit_price: Number(product.unit_price ?? 0),
            reorder_level: Number(product.reorder_level ?? 0),
            categories: Array.isArray(product.categories) ? product.categories : null,
            tags: Array.isArray(product.tags) ? product.tags : null,
          }}
          loading={saving}
          onSubmit={async (data) => {
            if (!product?.id) return
            setSaving(true)
            try {
              await apiProducts.update(product.id, {
                sku: data.sku,
                name: data.name,
                category: data.category ?? null,
                unit_cost: data.unit_cost ?? 0,
                unit_price: data.unit_price,
                reorder_level: data.reorder_level ?? 0,
                categories: data.categories ?? [],
                tags: data.tags ?? [],
              })
              const buf = (window as any).__productSuppliersBuffer as Array<{ supplier_id: string; supplier_sku?: string | null; supplier_price?: number | null; notes?: string | null }> | undefined
              if (buf && buf.length) {
                await apiProductSuppliers.replaceAll(product.id, buf)
                ;(window as any).__productSuppliersBuffer = undefined
              }
              toast.success('Produto atualizado')
              await Promise.all([fetchProduct(), fetchSuppliers()])
              setOpenEdit(false)
            } catch (e: any) {
              toast.error(e?.message ?? 'Falha ao atualizar produto')
            } finally {
              setSaving(false)
            }
          }}
        />
      )}
    </div>
  )
}
