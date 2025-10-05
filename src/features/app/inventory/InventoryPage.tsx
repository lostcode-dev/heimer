import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import { Link } from 'react-router-dom'
import type { IColumns, IPagination } from '@/types'
import { apiInventory, apiProducts } from '@/lib/api'
import { InventoryForm } from './InventoryForm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Upload, FileSpreadsheet, ShoppingCart, Wrench } from 'lucide-react'
import ImportInventoryModal, { type ImportedRow } from './ImportInventoryModal'
import { supabase } from '@/lib/supabaseClient'
import InventoryStockPage from './InventoryStockPage'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
// removed unused Separator

export type InventoryRow = {
  id: string
  product_id: string
  product?: { id: string; sku: string; name: string } | null
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  qty: number
  reason?: string | null
  occurred_at: string
  reference_id?: string | null
  reference_type?: 'SERVICE_ORDER' | 'MANUAL' | 'DIRECT_SALE' | null
}

export default function InventoryPage() {
  const [pagination, setPagination] = useState<IPagination>({
    sortField: 'occurred_at', sortOrder: 'DESC', search: '', currentPage: 1, itemsPerPage: 10,
    currentTotalItems: 0, totalItems: 0, totalPages: 1,
  })
  const [rows, setRows] = useState<InventoryRow[]>([])
  const [selected, setSelected] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<InventoryRow | null>(null)
  const [editKey, setEditKey] = useState(0)
  // Cache for OS ticket numbers to avoid per-row fetch
  const [orderTickets, setOrderTickets] = useState<Record<string, string>>({})

  async function fetchData() {
    setLoading(true)
    try {
      const { data, count } = await apiInventory.listPaginated({
        page: pagination.currentPage - 1,
        pageSize: pagination.itemsPerPage,
        query: pagination.search,
        sortBy: pagination.sortField,
        sortDir: pagination.sortOrder === 'ASC' ? 'asc' : 'desc',
      })
      setRows((data ?? []) as InventoryRow[])
      setPagination((p) => ({ ...p, currentTotalItems: data?.length ?? 0, totalItems: count ?? 0, totalPages: Math.max(1, Math.ceil((count ?? 0) / p.itemsPerPage)) }))
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao carregar movimentos')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [pagination.currentPage, pagination.itemsPerPage, pagination.search, pagination.sortField, pagination.sortOrder])

  // Prefetch ticket numbers for SERVICE_ORDER references visible in the current page
  useEffect(() => {
    (async () => {
      try {
        const ids = Array.from(
          new Set(
            (rows || [])
              .filter((r) => r.reference_type === 'SERVICE_ORDER' && r.reference_id)
              .map((r) => r.reference_id as string)
          )
        ).filter((id) => !!id && !orderTickets[id])
        if (!ids.length) return
        const { data, error } = await supabase
          .from('service_orders')
          .select('id, ticket_number')
          .in('id', ids)
        if (error) throw error
        const next: Record<string, string> = { ...orderTickets }
        for (const row of data ?? []) {
          next[(row as any).id] = (row as any).ticket_number ?? ''
        }
        setOrderTickets(next)
      } catch {
        // silent
      }
    })()
  }, [rows])

  const onRequest = (updated: IPagination) => setPagination(updated)

  const onAddItem = () => { setEditing(null); setEditKey((k) => k + 1); setOpenForm(true) }

  async function onRemoveItens(items: InventoryRow[]) {
    try {
      const removed = await apiInventory.removeMany(items.map((i) => i.id))
      toast.success(`${removed} movimento(s) removido(s)`); setSelected([]); fetchData()
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao remover') }
  }

  async function onSave(data: { product_id: string; type: 'IN' | 'OUT' | 'ADJUSTMENT'; qty: number; reason?: string | null; occurred_at?: string }) {
    try {
      if (editing) { await apiInventory.update(editing.id, data); toast.success('Movimento atualizado') }
      else { await apiInventory.create(data); toast.success('Movimento criado') }
      setOpenForm(false); setEditing(null); fetchData()
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao salvar') }
  }
  async function onSaveBatch(items: Array<{ product_id: string; qty: number }>, shared: { type: 'IN' | 'OUT' | 'ADJUSTMENT'; reason?: string | null; occurred_at?: string }) {
    try {
      for (const it of items) {
        await apiInventory.create({
          product_id: it.product_id,
          type: shared.type,
          qty: it.qty,
          reason: shared.reason ?? null,
          occurred_at: shared.occurred_at,
        })
      }
      toast.success(`${items.length} movimento(s) criado(s)`); setOpenForm(false); setEditing(null); fetchData()
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao salvar movimentos') }
  }

  const actions = useMemo(() => ({
    update: ((updatedData: Record<string, any>[]) => {
      const row = Array.isArray(updatedData) ? updatedData[0] : (updatedData as unknown as Record<string, any>)
      const r = row as InventoryRow
      setEditing({ ...r, product: r.product ?? undefined } as any); setEditKey((k) => k + 1); setOpenForm(true)
    }) as (updatedData: Record<string, any>[]) => void,
    delete: ((row: Record<string, any>) => { (async () => { try { await apiInventory.remove((row as InventoryRow).id); toast.success('Movimento removido'); fetchData() } catch (e: any) { toast.error(e?.message ?? 'Falha ao remover') } })() }) as (row: Record<string, any>) => void,
  }), [])

  const columns: IColumns<InventoryRow>[] = [
    { label: 'Produto', field: 'product', sortable: false, format: (_v, row) => `${row.product?.sku ?? '—'} · ${row.product?.name ?? ''}`.trim() },
    { label: 'Tipo', field: 'type', sortable: true, format: (v) => {
      const map: Record<string, { label: string; className: string }> = {
        IN: { label: 'Entrada', className: 'bg-emerald-600 text-white border-transparent' },
        OUT: { label: 'Saída', className: 'bg-rose-600 text-white border-transparent' },
        ADJUSTMENT: { label: 'Ajuste', className: 'bg-sky-600 text-white border-transparent' },
      }
      const meta = map[v as keyof typeof map] ?? { label: String(v), className: 'bg-muted text-foreground' }
      return <Badge className={`px-2 py-0.5 ${meta.className}`}>{meta.label}</Badge>
    } },
    { label: 'Quantidade', field: 'qty', sortable: true, format: (v) => String(v) },
    { label: 'Motivo', field: 'reason', sortable: true, format: (v) => v ?? '-' },
    { label: 'Origem', field: 'reference_id', sortable: false, component: ({ row }) => {
      if (!row.reference_id || !row.reference_type) return <span className="text-muted-foreground">-</span>
      if (row.reference_type === 'SERVICE_ORDER') {
        const ticket = orderTickets[row.reference_id] ?? 'OS'
        return (
          <Link to={`/app/orders/${row.reference_id}`} className="no-underline">
            <Badge className="px-2 py-0.5 gap-1.5 bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
              <Wrench className="size-3.5" /> {ticket}
            </Badge>
          </Link>
        )
      }
      if (row.reference_type === 'DIRECT_SALE') {
        const clean = String(row.reference_id).replace(/-/g, '')
        const last5 = clean.slice(-5).toUpperCase()
        return (
          <Link to={`/app/sales/${row.reference_id}`} className="no-underline">
            <Badge className="px-2 py-0.5 gap-1.5 bg-amber-100 text-amber-800 hover:bg-amber-200">
              <ShoppingCart className="size-3.5" /> {last5}
            </Badge>
          </Link>
        )
      }
      return <span className="text-muted-foreground">-</span>
    } },
    { label: 'Data', field: 'occurred_at', sortable: true, format: (v) => new Date(v).toLocaleString('pt-BR') },
  ]

  // Export movements (current filter) as CSV
  async function exportMovementsCSV() {
    try {
      const { data } = await apiInventory.listPaginated({
        page: 0,
        pageSize: Math.max(10000, pagination.itemsPerPage),
        query: pagination.search,
        sortBy: pagination.sortField,
        sortDir: pagination.sortOrder === 'ASC' ? 'asc' : 'desc',
      })
      const rowsExp = (data ?? []) as InventoryRow[]
      const header = ['ticket', 'sku', 'produto', 'tipo', 'quantidade', 'motivo', 'data']
      const lines = [header.join(',')]
      for (const r of rowsExp) {
        const sku = r.product?.sku ?? ''
        const name = r.product?.name ?? ''
        const tipo = r.type === 'IN' ? 'Entrada' : r.type === 'OUT' ? 'Saída' : 'Ajuste'
        const date = new Date(r.occurred_at).toISOString()
        const csvSafe = (s: string) => '"' + String(s).replace(/"/g, '""') + '"'
        lines.push(['', csvSafe(sku), csvSafe(name), csvSafe(tipo), r.qty, csvSafe(r.reason ?? ''), csvSafe(date)].join(','))
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `movimentos_estoque_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao exportar movimentos') }
  }

  // Export current stock snapshot as CSV
  async function exportStockCSV() {
    try {
      const list = await apiProducts.listAllWithStock()
      const header = ['sku', 'produto', 'categoria', 'estoque', 'minimo', 'custo', 'preco']
      const lines = [header.join(',')]
      const csvSafe = (s: string) => '"' + String(s).replace(/"/g, '""') + '"'
      for (const p of list) {
        lines.push([
          csvSafe((p as any).sku ?? ''),
          csvSafe((p as any).name ?? ''),
          csvSafe((p as any).category ?? ''),
          Number((p as any).stock_qty ?? 0),
          Number((p as any).reorder_level ?? 0),
          Number((p as any).unit_cost ?? 0),
          Number((p as any).unit_price ?? 0),
        ].join(','))
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `estoque_atual_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao exportar estoque') }
  }

  // Sample CSV for import
  function downloadSampleCSV() {
    const header = 'sku,qty,type,reason,occurred_at' // type: IN|OUT|ADJUSTMENT
    const example = [
      'ABC123,10,IN,Compra fornecedor,2025-10-02T10:00:00.000Z',
      'DEF456,2,OUT,Venda balcão,2025-10-02T11:30:00.000Z',
    ]
    const blob = new Blob([[header, ...example].join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modelo_importacao_estoque.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const toolbarExtras = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" title="Exportar movimentos (CSV)" onClick={exportMovementsCSV}><Download className="size-4" /></Button>
      <Button variant="outline" size="icon" title="Exportar estoque atual (CSV)" onClick={exportStockCSV}><FileSpreadsheet className="size-4" /></Button>
      <Button variant="outline" size="icon" title="Importar CSV" onClick={() => setShowImport(true)}><Upload className="size-4" /></Button>
    </div>
  )

  const [showImport, setShowImport] = useState(false)
  async function processImportedCSV(rows: ImportedRow[]) {
    try {
      if (!rows?.length) { toast.error('Arquivo sem linhas válidas'); return }
      // Map SKU -> product_id
      const skuSet = Array.from(new Set(rows.map(r => r.sku).filter(Boolean)))
      if (!skuSet.length) { toast.error('Nenhum SKU encontrado'); return }
      // Fetch products by SKU in batches
      const idBySku = new Map<string, string>()
      const batchSize = 100
      for (let i = 0; i < skuSet.length; i += batchSize) {
        const subset = skuSet.slice(i, i + batchSize)
        const { data, error } = await supabase
          .from('products')
          .select('id, sku')
          .in('sku', subset)
        if (error) throw error
        for (const p of data ?? []) idBySku.set((p as any).sku, (p as any).id)
      }
      let created = 0
      let notFound: string[] = []
      for (const r of rows) {
        const pid = idBySku.get(r.sku)
        if (!pid) { notFound.push(r.sku); continue }
        await apiInventory.create({ product_id: pid, type: r.type, qty: r.qty, reason: r.reason ?? null, occurred_at: r.occurred_at })
        created += 1
      }
      if (notFound.length) {
        toast.warning(`${notFound.length} SKU(s) não encontrados: ${Array.from(new Set(notFound)).slice(0, 5).join(', ')}${notFound.length > 5 ? '…' : ''}`)
      }
      toast.success(`${created} movimento(s) importado(s)`); setShowImport(false); fetchData()
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao importar') }
  }

  return (
    <Tabs defaultValue="stock" className="w-full">
      <TabsList>
        <TabsTrigger value="stock">Produtos</TabsTrigger>
        <TabsTrigger value="movements">Movimentações</TabsTrigger>
      </TabsList>

      <TabsContent value="stock" className="mt-2">
        <InventoryStockPage />
      </TabsContent>

      <TabsContent value="movements" className="mt-2">
        <CustomTable
          data={rows}
          columns={columns}
          pagination={pagination}
          selected={selected}
          loading={loading}
          actions={actions}
          extraActions={toolbarExtras}
          onRowSelectionChange={(rows: unknown[]) => setSelected(rows as InventoryRow[])}
          onRequest={onRequest}
          onAddItem={onAddItem}
          onRemoveItens={(rows: unknown[]) => { void onRemoveItens(rows as InventoryRow[]) }}
        />
        {showImport && (
          <ImportInventoryModal open={showImport} onOpenChange={setShowImport} onDownloadSample={downloadSampleCSV} onConfirm={(rows) => { void processImportedCSV(rows) }} />
        )}
        <InventoryForm
          key={`${editing?.id ?? 'new'}-${editKey}`}
          open={openForm}
          onOpenChange={setOpenForm}
          initial={editing ? { ...editing, product_label: editing.product ? `${editing.product.sku} · ${editing.product.name}` : '' } : undefined}
          onSubmit={onSave}
          onSubmitBatch={onSaveBatch}
        />
      </TabsContent>
    </Tabs>
  )
}
