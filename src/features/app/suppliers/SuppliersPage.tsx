import { useEffect, useMemo, useState } from 'react'
import { apiSuppliers } from '@/lib/api'
import { toast } from 'sonner'
import { SupplierForm } from './SupplierForm'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import type { IColumns, IPagination } from '@/types'

export type Supplier = {
  id: string
  name: string
  email: string | null
  phone: string | null
  is_active: boolean
  created_at: string
}

export default function SuppliersPage() {
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
  const [rows, setRows] = useState<Supplier[]>([])
  const [selected, setSelected] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [editKey, setEditKey] = useState(0)

  async function fetchData() {
    setLoading(true)
    try {
      const { data, count } = await apiSuppliers.listPaginated({
        page: pagination.currentPage - 1,
        pageSize: pagination.itemsPerPage,
        query: pagination.search,
        sortBy: pagination.sortField,
        sortDir: pagination.sortOrder === 'ASC' ? 'asc' : 'desc',
      })
      setRows((data ?? []) as Supplier[])
      setPagination((p) => ({
        ...p,
        currentTotalItems: data?.length ?? 0,
        totalItems: count ?? 0,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / p.itemsPerPage)),
      }))
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao carregar fornecedores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [pagination.currentPage, pagination.itemsPerPage, pagination.search, pagination.sortField, pagination.sortOrder])

  const onCreated = async (data: { name: string; email?: string | null; phone?: string | null; notes?: string | null; is_active?: boolean; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null }) => {
    try {
      if (editing) {
        await apiSuppliers.update(editing.id, data)
        toast.success('Fornecedor atualizado com sucesso')
      } else {
        await apiSuppliers.create(data)
        toast.success('Fornecedor criado com sucesso')
      }
      setOpenForm(false)
      setEditing(null)
      fetchData()
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao salvar fornecedor')
    }
  }

  const onRemoveItens = async (items: Supplier[]) => {
    try {
      const ids = items.map((c) => c.id)
      const removed = await apiSuppliers.removeMany(ids)
      toast.success(`${removed} fornecedor(es) removido(s)`) 
      setSelected([])
      fetchData()
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao remover fornecedores')
    }
  }

  const onRequest = (updated: IPagination) => { setPagination(updated) }

  const onAddItem = () => {
    setEditing(null)
    setEditKey((k) => k + 1)
    setOpenForm(true)
  }

  const actions = useMemo(() => ({
    update: ((updatedData: Record<string, any>[]) => {
      const row = Array.isArray(updatedData) ? updatedData[0] : (updatedData as unknown as Record<string, any>)
      setEditing(row as Supplier)
      setEditKey((k) => k + 1)
      setOpenForm(true)
    }) as (updatedData: Record<string, any>[]) => void,
    delete: ((row: Record<string, any>) => {
      (async () => {
        try {
          await apiSuppliers.remove((row as Supplier).id)
          toast.success('Fornecedor removido com sucesso')
          fetchData()
        } catch (err: any) {
          toast.error(err?.message ?? 'Falha ao remover fornecedor')
        }
      })()
    }) as (row: Record<string, any>) => void,
  }), [])

  const columns: IColumns<Supplier>[] = [
    { label: 'Nome', field: 'name', sortable: true },
    { label: 'E-mail', field: 'email', sortable: true, format: (v) => v ?? '-' },
    { label: 'Telefone', field: 'phone', sortable: true, format: (v) => v ?? '-' },
    { label: 'Ativo', field: 'is_active', sortable: true, format: (v) => (v ? 'Sim' : 'Não') },
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
          onRowSelectionChange={(rows: unknown[]) => setSelected(rows as Supplier[])}
          onRequest={onRequest}
          onAddItem={onAddItem}
          onRemoveItens={(rows: unknown[]) => { void onRemoveItens(rows as Supplier[]) }}
        />
        <SupplierForm
          key={`${editing?.id ?? 'new'}-${editKey}`}
          open={openForm}
          onOpenChange={setOpenForm}
          initial={editing ?? undefined}
          loading={loading}
          onSubmit={onCreated}
        />
      </div>
    </div>
  )
}
