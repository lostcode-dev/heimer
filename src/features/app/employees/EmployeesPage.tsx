import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import type { IColumns, IPagination } from '@/types'
import { apiEmployees } from '@/lib/api'
import EmployeeForm from './EmployeeForm.tsx'

type Employee = { id: string; full_name?: string | null; email: string; phone?: string | null; is_active?: boolean; job_title?: string | null; created_at: string }

export default function EmployeesPage() {
  const [pagination, setPagination] = useState<IPagination>({
    sortField: 'created_at', sortOrder: 'DESC', search: '', currentPage: 1, itemsPerPage: 10,
    currentTotalItems: 0, totalItems: 0, totalPages: 1,
  })
  const [rows, setRows] = useState<Employee[]>([])
  const [selected, setSelected] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [editKey, setEditKey] = useState(0)

  async function fetchData() {
    setLoading(true)
    try {
      const { data, count } = await apiEmployees.listPaginated({
        page: pagination.currentPage - 1,
        pageSize: pagination.itemsPerPage,
        query: pagination.search,
        sortBy: pagination.sortField,
        sortDir: pagination.sortOrder === 'ASC' ? 'asc' : 'desc',
      })
      setRows((data ?? []) as Employee[])
      setPagination((p) => ({ ...p, currentTotalItems: data?.length ?? 0, totalItems: count ?? 0, totalPages: Math.max(1, Math.ceil((count ?? 0) / p.itemsPerPage)) }))
    } catch (err: any) { toast.error(err?.message ?? 'Falha ao carregar funcionários') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [pagination.currentPage, pagination.itemsPerPage, pagination.search, pagination.sortField, pagination.sortOrder])

  const onRequest = (updated: IPagination) => setPagination(updated)
  const onAddItem = () => { setEditing(null); setEditKey((k) => k + 1); setOpenForm(true) }

  const actions = useMemo(() => ({
    update: ((updatedData: Record<string, any>[]) => {
      const row = Array.isArray(updatedData) ? updatedData[0] : (updatedData as unknown as Record<string, any>)
      setEditing(row as Employee); setEditKey((k) => k + 1); setOpenForm(true)
    }) as (updatedData: Record<string, any>[]) => void,
    delete: ((row: Record<string, any>) => { (async () => { try { await apiEmployees.remove((row as Employee).id); toast.success('Funcionário removido'); fetchData() } catch (e: any) { toast.error(e?.message ?? 'Falha ao remover') } })() }) as (row: Record<string, any>) => void,
  }), [])

  const columns: IColumns<Employee>[] = [
    { label: 'Nome', field: 'full_name', sortable: true, format: (v) => v ?? '-' },
    { label: 'Email', field: 'email', sortable: true },
    { label: 'Telefone', field: 'phone', sortable: false, format: (v) => v ?? '-' },
    { label: 'Cargo', field: 'job_title', sortable: false, format: (v) => v ?? '-' },
    { label: 'Status', field: 'is_active', sortable: true, format: (v) => (v ? 'Ativo' : 'Inativo') },
    { label: 'Criado em', field: 'created_at', sortable: true, format: (v) => new Date(v).toLocaleString('pt-BR') },
  ]

  async function onSave(data: { id?: string; full_name?: string | null; email: string; password?: string; phone?: string | null; is_active?: boolean; job_title?: string | null; cpf?: string | null; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null; birth_date?: string | null; hire_date?: string | null; notes?: string | null }) {
    try {
      if (editing) {
        await apiEmployees.update(editing.id, {
          full_name: data.full_name ?? undefined,
          phone: data.phone ?? null,
          is_active: data.is_active,
          job_title: data.job_title ?? null,
          cpf: data.cpf ?? null,
          cep: data.cep ?? null,
          street: data.street ?? null,
          number: data.number ?? null,
          complement: data.complement ?? null,
          neighborhood: data.neighborhood ?? null,
          city: data.city ?? null,
          state: data.state ?? null,
          birth_date: data.birth_date ? data.birth_date.slice(0, 10) : null,
          hire_date: data.hire_date ? data.hire_date.slice(0, 10) : null,
          notes: data.notes ?? null,
        })
        toast.success('Funcionário atualizado')
      } else {
        if (!data.password) {
          toast.error('Senha é obrigatória para criar um funcionário')
          return
        }
        await apiEmployees.create({
          email: data.email,
          full_name: data.full_name ?? undefined,
          password: data.password,
          phone: data.phone ?? null,
          is_active: data.is_active ?? true,
          job_title: data.job_title ?? null,
          cpf: data.cpf ?? null,
          cep: data.cep ?? null,
          street: data.street ?? null,
          number: data.number ?? null,
          complement: data.complement ?? null,
          neighborhood: data.neighborhood ?? null,
          city: data.city ?? null,
          state: data.state ?? null,
          birth_date: data.birth_date ? data.birth_date.slice(0, 10) : null,
          hire_date: data.hire_date ? data.hire_date.slice(0, 10) : null,
          notes: data.notes ?? null,
        })
        toast.success('Funcionário criado')
      }
      setOpenForm(false); setEditing(null); fetchData()
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao salvar') }
  }

  return (
    <section className="flex flex-1 flex-col gap-4 my-4 md:gap-6">
      <CustomTable
        data={rows}
        columns={columns}
        pagination={pagination}
        selected={selected}
        loading={loading}
        actions={actions}
        onRowSelectionChange={(rows: unknown[]) => setSelected(rows as Employee[])}
        onRequest={onRequest}
        onAddItem={onAddItem}
        onRemoveItens={(rows: unknown[]) => { const ids = (rows as Employee[]).map(r => r.id); (async () => { try { await apiEmployees.removeMany(ids); toast.success('Funcionário(s) removido(s)'); fetchData() } catch (e: any) { toast.error(e?.message ?? 'Falha ao remover') } })() }}
      />
      <EmployeeForm
        key={`${editing?.id ?? 'new'}-${editKey}`}
        open={openForm}
        onOpenChange={setOpenForm}
        initial={editing ?? undefined}
        onSubmit={onSave}
      />
    </section>
  )
}
