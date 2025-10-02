import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import type { IColumns, IPagination } from '@/types'
import { apiTechnicians } from '@/lib/api'
import { TechnicianForm } from './TechnicianForm'
import { CheckCircle2, XCircle } from 'lucide-react'
import NameWithAvatar from '@/components/common/NameWithAvatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Technician = {
  id: string
  full_name: string
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

export default function TechniciansPage() {
  const [pagination, setPagination] = useState<IPagination>({
    sortField: 'created_at', sortOrder: 'DESC', search: '', currentPage: 1, itemsPerPage: 10,
    currentTotalItems: 0, totalItems: 0, totalPages: 1,
  })
  const [rows, setRows] = useState<Technician[]>([])
  const [selected, setSelected] = useState<Technician[]>([])
  const [loading, setLoading] = useState(false)
  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<Technician | null>(null)
  const [editKey, setEditKey] = useState(0)

  async function fetchData() {
    setLoading(true)
    try {
      const { data, count } = await apiTechnicians.listPaginated({
        page: pagination.currentPage - 1,
        pageSize: pagination.itemsPerPage,
        query: pagination.search,
        sortBy: pagination.sortField,
        sortDir: pagination.sortOrder === 'ASC' ? 'asc' : 'desc',
      })
      setRows((data ?? []) as Technician[])
      setPagination((p) => ({ ...p, currentTotalItems: data?.length ?? 0, totalItems: count ?? 0, totalPages: Math.max(1, Math.ceil((count ?? 0) / p.itemsPerPage)) }))
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao carregar técnicos')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [pagination.currentPage, pagination.itemsPerPage, pagination.search, pagination.sortField, pagination.sortOrder])

  const onRequest = (updated: IPagination) => setPagination(updated)

  const onAddItem = () => { setEditing(null); setEditKey((k) => k + 1); setOpenForm(true) }

  async function onRemoveItens(items: Technician[]) {
    try {
      const removed = await apiTechnicians.removeMany(items.map((i) => i.id))
      toast.success(`${removed} técnico(s) removido(s)`) ; setSelected([]); fetchData()
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao remover') }
  }

  async function onSave(data: { full_name: string; email?: string | null; phone?: string | null; is_active?: boolean; notes?: string | null }) {
    try {
      if (editing) { await apiTechnicians.update(editing.id, data); toast.success('Técnico atualizado') }
      else { await apiTechnicians.create(data); toast.success('Técnico criado') }
      setOpenForm(false); setEditing(null); fetchData()
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao salvar') }
  }

  const actions = useMemo(() => ({
    update: ((updatedData: Record<string, any>[]) => {
      const row = Array.isArray(updatedData) ? updatedData[0] : (updatedData as unknown as Record<string, any>)
      setEditing(row as Technician); setEditKey((k) => k + 1); setOpenForm(true)
    }) as (updatedData: Record<string, any>[]) => void,
    delete: ((row: Record<string, any>) => { (async () => { try { await apiTechnicians.remove((row as Technician).id); toast.success('Técnico removido'); fetchData() } catch (e: any) { toast.error(e?.message ?? 'Falha ao remover') } })() }) as (row: Record<string, any>) => void,
  }), [])

  const StatusCell: React.FC<{ row: Technician }> = ({ row }) => (
    <div className="flex items-center ml-4 gap-1">
      {row.is_active ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Ativo" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" aria-label="Inativo" />
      )}
      <span className="sr-only">{row.is_active ? 'Ativo' : 'Inativo'}</span>
    </div>
  )

  const NameCell: React.FC<{ row: Technician }> = ({ row }) => (
    <NameWithAvatar name={row.full_name} phone={row.phone} />
  )

  const AddressCell: React.FC<{ row: Technician }> = ({ row }) => {
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

  const columns: IColumns<Technician>[] = [
    { label: 'Nome', field: 'full_name', sortable: true, component: NameCell },
    { label: 'E-mail', field: 'email', sortable: true, format: (v) => v ?? '-' },
    { label: 'Endereço', field: 'street', sortable: false, component: AddressCell },
    { label: 'Status', field: 'is_active', sortable: true, component: StatusCell },
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
          onRowSelectionChange={(rows: unknown[]) => setSelected(rows as Technician[])}
          onRequest={onRequest}
          onAddItem={onAddItem}
          onRemoveItens={(rows: unknown[]) => { void onRemoveItens(rows as Technician[]) }}
        />
        <TechnicianForm
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
