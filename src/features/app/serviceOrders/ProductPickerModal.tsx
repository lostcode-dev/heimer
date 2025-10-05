import { useEffect, useMemo, useState } from 'react'
import { apiProducts } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import CustomForm from '@/components/custom/Input/CustomForm'
import { toast } from 'sonner'
import { ProductForm } from '@/features/app/products/ProductForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import { formatBRL } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

type ProductRow = {
  id: string
  sku: string
  name: string
  unit_price: number
  stock_qty?: number
}

export default function ProductPickerModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (rows: ProductRow[]) => void
}) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<ProductRow[]>([])
  const [count, setCount] = useState(0)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [selectedData, setSelectedData] = useState<Record<string, ProductRow>>({})
  const [openProductForm, setOpenProductForm] = useState(false)
  const [savingProduct, setSavingProduct] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize])

  useEffect(() => {
    let timer: number | undefined
    setLoading(true)
    timer = window.setTimeout(async () => {
      try {
        const { data, count } = await apiProducts.listPaginated({ page, pageSize, query, sortBy: 'name', sortDir: 'asc' })
        setRows(
          (data as any[]).map((r) => ({
            id: r.id,
            sku: r.sku,
            name: r.name,
            unit_price: Number(r.unit_price || 0),
            stock_qty: Number((r as any).stock_qty ?? 0),
          }))
        )
        setCount(count)
      } catch (e: any) {
        toast.error(e?.message ?? 'Falha ao carregar produtos')
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => { if (timer) window.clearTimeout(timer) }
  }, [page, pageSize, query, reloadKey])

  function toggleRow(id: string, checked: boolean) {
    setSelected((prev) => ({ ...prev, [id]: checked }))
    if (checked) {
      const found = rows.find(r => r.id === id)
      if (found) setSelectedData((prev) => ({ ...prev, [id]: found }))
    } else {
      setSelectedData((prev) => { const { [id]: _omit, ...rest } = prev; return rest })
    }
  }

  async function handleCreateProductViaSidebar(data: { sku: string; name: string; category?: string | null; unit_cost?: number; unit_price: number; reorder_level?: number; categories?: string[]; tags?: string[] }) {
    setSavingProduct(true)
    try {
      const created = await apiProducts.create({
        sku: data.sku,
        name: data.name,
        category: data.category ?? undefined,
        unit_cost: Number(data.unit_cost ?? 0),
        unit_price: Number(data.unit_price ?? 0),
        reorder_level: Number(data.reorder_level ?? 0),
        categories: data.categories,
        tags: data.tags,
      })
      toast.success('Produto criado')
      setOpenProductForm(false)
      setReloadKey((k) => k + 1)
      setSelected((prev) => ({ ...prev, [created.id]: true }))
      setSelectedData((prev) => ({ ...prev, [created.id]: { id: created.id, sku: data.sku, name: data.name, unit_price: Number(data.unit_price ?? 0), stock_qty: 0 } }))
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao criar produto')
    } finally {
      setSavingProduct(false)
    }
  }

  function handleConfirm() {
    const list = Object.values(selectedData)
    if (!list.length) {
      toast.message('Selecione ao menos um produto')
      return
    }
    onConfirm(list)
    onOpenChange(false)
  }

  return (
    <CustomForm
      open={open}
      onOpenChange={onOpenChange}
      title="Selecionar produtos"
      description="Busque e selecione produtos para adicionar à ordem"
      submitLabel="Adicionar"
      submitDisabled={loading}
      onSubmit={(e) => { e.preventDefault(); handleConfirm() }}
      variant="dialog"
      footer={
        <div className="w-full flex items-center justify-between gap-2">
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleConfirm} disabled={loading}>Adicionar selecionados</Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-end gap-2">
          <div className="grow">
            <CustomInput
              name="search"
              placeholder="Buscar por SKU ou nome"
              value={query}
              onChange={setQuery}
              icon={<Search className="size-4 text-muted-foreground" />}
            />
          </div>
          <Button variant="outline" onClick={() => setOpenProductForm(true)}>+ Novo</Button>
        </div>

        {/* Sidebar product form */}
        <ProductForm
          open={openProductForm}
          onOpenChange={setOpenProductForm}
          loading={savingProduct}
          onSubmit={handleCreateProductViaSidebar}
        />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    <TableCell className="w-10"><Skeleton className="h-4 w-4 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="ml-auto h-5 w-12 rounded" /></TableCell>
                  </TableRow>
                ))
              )}
              {!loading && rows.map((r) => (
                <TableRow key={r.id} data-state={selected[r.id] && 'selected'}>
                  <TableCell className="w-10">
                    <Checkbox checked={!!selected[r.id]} onCheckedChange={(v) => toggleRow(r.id, !!v)} />
                  </TableCell>
                  <TableCell>{r.sku}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell className="text-right">{formatBRL(Number(r.unit_price || 0))}</TableCell>
                  <TableCell className="text-right">
                    {(() => {
                      const qty = Number(r.stock_qty ?? 0)
                      const critical = qty <= 0
                      const cls = critical ? 'bg-rose-600 text-white border-transparent' : 'bg-emerald-600 text-white border-transparent'
                      const Icon = critical ? AlertTriangle : CheckCircle
                      return (
                        <Badge className={`px-2 py-0.5 gap-1.5 ${cls}`}>
                          <Icon className="size-3.5" />
                          {qty}
                        </Badge>
                      )
                    })()}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && !rows.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">{loading ? 'Carregando...' : 'Sem resultados'}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Selected items summary */}
        {Object.keys(selectedData).length > 0 && (
          <div className="rounded-md border bg-muted/30 p-2">
            <div className="text-xs font-medium mb-1">Selecionados ({Object.keys(selectedData).length}):</div>
            <div className="flex flex-wrap gap-2">
              {Object.values(selectedData).map((it) => (
                <Badge key={it.id} variant="outline" className="gap-1">
                  {it.sku} · {it.name}
                  <button type="button" className="ml-1 inline-flex items-center" onClick={() => toggleRow(it.id, false)} aria-label="Remover seleção">
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm">Página {page + 1} de {totalPages}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label="Anterior">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page + 1 >= totalPages} aria-label="Próxima">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </CustomForm>
  )
}
