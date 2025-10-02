import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import type { IColumns, IPagination } from '@/types'
import { apiInventory } from '@/lib/api'
import { InventoryForm } from './InventoryForm'

export type InventoryRow = {
  id: string
  product_id: string
  product?: { id: string; sku: string; name: string } | null
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  qty: number
  reason?: string | null
  occurred_at: string
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

  const onRequest = (updated: IPagination) => setPagination(updated)

  const onAddItem = () => { setEditing(null); setEditKey((k) => k + 1); setOpenForm(true) }

  async function onRemoveItens(items: InventoryRow[]) {
    try {
      const removed = await apiInventory.removeMany(items.map((i) => i.id))
      toast.success(`${removed} movimento(s) removido(s)`) ; setSelected([]); fetchData()
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao remover') }
  }

  async function onSave(data: { product_id: string; type: 'IN' | 'OUT' | 'ADJUSTMENT'; qty: number; reason?: string | null; occurred_at?: string }) {
    try {
      if (editing) { await apiInventory.update(editing.id, data); toast.success('Movimento atualizado') }
      else { await apiInventory.create(data); toast.success('Movimento criado') }
      setOpenForm(false); setEditing(null); fetchData()
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao salvar') }
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
    { label: 'Produto', field: 'product', sortable: false, format: (_, row) => `${row.product?.sku ?? '—'} · ${row.product?.name ?? ''}`.trim() },
    { label: 'Tipo', field: 'type', sortable: true, format: (v) => v === 'IN' ? 'Entrada' : v === 'OUT' ? 'Saída' : 'Ajuste' },
    { label: 'Qtd', field: 'qty', sortable: true, format: (v) => String(v) },
    { label: 'Motivo', field: 'reason', sortable: true, format: (v) => v ?? '-' },
    { label: 'Data', field: 'occurred_at', sortable: true, format: (v) => new Date(v).toLocaleString('pt-BR') },
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
        onRowSelectionChange={(rows: unknown[]) => setSelected(rows as InventoryRow[])}
        onRequest={onRequest}
        onAddItem={onAddItem}
        onRemoveItens={(rows: unknown[]) => { void onRemoveItens(rows as InventoryRow[]) }}
      />
      <InventoryForm
        key={`${editing?.id ?? 'new'}-${editKey}`}
        open={openForm}
        onOpenChange={setOpenForm}
        initial={editing ? { ...editing, product_label: editing.product ? `${editing.product.sku} · ${editing.product.name}` : '' } : undefined}
        onSubmit={onSave}
      />
    </>
  )
}
