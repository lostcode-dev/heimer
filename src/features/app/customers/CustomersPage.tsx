import { useEffect, useMemo, useState } from 'react'
import { apiCustomers } from '@/lib/api'
import { toast } from 'sonner'
import { CustomerForm } from './CustomerForm'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import type { IColumns, IPagination } from '@/types'

type Customer = {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  birth_date?: string | null
  created_at: string
}

export default function CustomersPage() {
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
  const [rows, setRows] = useState<Customer[]>([])
  const [selected, setSelected] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [editKey, setEditKey] = useState(0)

  async function fetchData() {
    setLoading(true)
    try {
      const { data, count } = await apiCustomers.listPaginated({
        page: pagination.currentPage - 1,
        pageSize: pagination.itemsPerPage,
        query: pagination.search,
        sortBy: pagination.sortField,
        sortDir: pagination.sortOrder === 'ASC' ? 'asc' : 'desc',
      })
      setRows((data ?? []) as Customer[])
      setPagination((p) => ({
        ...p,
        currentTotalItems: data?.length ?? 0,
        totalItems: count ?? 0,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / p.itemsPerPage)),
      }))
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [pagination.currentPage, pagination.itemsPerPage, pagination.search, pagination.sortField, pagination.sortOrder])

  const onCreated = async (data: { full_name: string; email?: string | null; phone?: string | null }) => {
    try {
      if (editing) {
        await apiCustomers.update(editing.id, data)
        toast.success('Cliente atualizado com sucesso')
      } else {
        await apiCustomers.create(data)
        toast.success('Cliente criado com sucesso')
      }
      setOpenForm(false)
      setEditing(null)
      fetchData()
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao salvar cliente')
    }
  }

  const onRemoveItens = async (items: Customer[]) => {
    try {
      const ids = items.map((c) => c.id)
      const removed = await apiCustomers.removeMany(ids)
      toast.success(`${removed} cliente(s) removido(s)`)
      setSelected([])
      fetchData()
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao remover clientes')
    }
  }

  const onRequest = (updated: IPagination) => {
    setPagination(updated)
  }

  const onAddItem = () => {
    setEditing(null)
    setEditKey((k) => k + 1)
    setOpenForm(true)
  }

  const actions = useMemo(() => ({
    update: ((updatedData: Record<string, any>[]) => {
      const row = Array.isArray(updatedData) ? updatedData[0] : (updatedData as unknown as Record<string, any>)
      setEditing(row as Customer)
      setEditKey((k) => k + 1)
      setOpenForm(true)
    }) as (updatedData: Record<string, any>[]) => void,
    delete: ((row: Record<string, any>) => {
      (async () => {
        try {
          await apiCustomers.remove((row as Customer).id)
          toast.success('Cliente removido com sucesso')
          fetchData()
        } catch (err: any) {
          toast.error(err?.message ?? 'Falha                                                                                                                                                                                                                                            ao remover cliente')
        }
      })()
    }) as (row: Record<string, any>) => void,
  }), [])

  const columns: IColumns<Customer>[] = [
    { label: 'Nome', field: 'full_name', sortable: true },
    { label: 'E-mail', field: 'email', sortable: true, format: (v) => v ?? '-' },
    { label: 'Telefone', field: 'phone', sortable: true, format: (v) => v ?? '-' },
    { label: 'Nascimento', field: 'birth_date', sortable: true, format: (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '-' },
    { label: 'Criado em', field: 'created_at', sortable: true, format: (v) => new Date(v).toLocaleString() },
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
          onRowSelectionChange={(rows: unknown[]) => setSelected(rows as Customer[])}
          onRequest={onRequest}
          onAddItem={onAddItem}
          onRemoveItens={(rows: unknown[]) => { void onRemoveItens(rows as Customer[]) }}
        />
        <CustomerForm
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
