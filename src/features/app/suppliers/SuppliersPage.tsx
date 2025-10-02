import { useEffect, useMemo, useState } from 'react'
import { apiSuppliers } from '@/lib/api'
import { toast } from 'sonner'
import { SupplierForm } from './SupplierForm'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import type { IColumns, IPagination } from '@/types'
import { CheckCircle2, XCircle } from 'lucide-react'
import NameWithAvatar from '@/components/common/NameWithAvatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type Supplier = {
  id: string
  name: string
  email: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  // address fields
  cep?: string | null
  street?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
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

  const StatusCell: React.FC<{ row: Supplier }> = ({ row }) => (
    <div className="flex items-center ml-4 gap-1">
      {row.is_active ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Ativo" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" aria-label="Inativo" />
      )}
      <span className="sr-only">{row.is_active ? 'Ativo' : 'Inativo'}</span>
    </div>
  )

  const NameCell: React.FC<{ row: Supplier }> = ({ row }) => (
    <NameWithAvatar name={row.name} phone={row.phone} />
  )

  const AddressCell: React.FC<{ row: Supplier }> = ({ row }) => {
    const street = row.street?.trim()
    const number = row.number?.trim()
    const cep = row.cep?.trim()
    const neighborhood = row.neighborhood?.trim()
    const city = row.city?.trim()
    const state = row.state?.trim()
    if (!cep) return <span>-</span>
    const compactTop = street || '-'
    const compactBottom = [number, cep].filter(Boolean).join(' • ')
    const full = [
      street && [street, number].filter(Boolean).join(', '),
      neighborhood,
      city && state ? `${city} - ${state}` : (city || state),
      cep,
    ].filter(Boolean).join(' • ')
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col leading-tight cursor-help max-w-[260px]">
            <span className="truncate">{compactTop}</span>
            <span className="text-xs text-muted-foreground truncate">{compactBottom}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>{full}</TooltipContent>
      </Tooltip>
    )
  }

  const columns: IColumns<Supplier>[] = [
    { label: 'Nome', field: 'name', sortable: true, component: NameCell },
    { label: 'E-mail', field: 'email', sortable: true, format: (v) => v ?? '-' },
    { label: 'Endereço', field: 'street', sortable: false, component: AddressCell },
    { label: 'Status', field: 'is_active', sortable: true, component: StatusCell },
    { label: 'Criado em', field: 'created_at', sortable: true, format: (v) => new Date(v).toLocaleString('pt-BR') },
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
    </>
  )
}
