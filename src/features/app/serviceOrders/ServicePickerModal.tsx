import { useEffect, useMemo, useState } from 'react'
import { apiServices } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import CustomForm from '@/components/custom/Input/CustomForm'
import { toast } from 'sonner'
import { ServiceForm } from '@/features/app/services/ServiceForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import { formatBRL } from '@/lib/format'
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

type ServiceRow = {
  id: string
  sku?: string | null
  name: string
  unit_price: number
}

export default function ServicePickerModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (rows: ServiceRow[]) => void
}) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<ServiceRow[]>([])
  const [count, setCount] = useState(0)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [selectedData, setSelectedData] = useState<Record<string, ServiceRow>>({})

  const [openServiceForm, setOpenServiceForm] = useState(false)
  const [savingService, setSavingService] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize])

  useEffect(() => {
    let timer: number | undefined
    setLoading(true)
    timer = window.setTimeout(async () => {
      try {
        const { data, count } = await apiServices.listPaginated({ page, pageSize, query, sortBy: 'name', sortDir: 'asc' })
        setRows(
          (data as any[]).map((r) => ({
            id: r.id,
            sku: r.sku,
            name: r.name,
            unit_price: Number(r.unit_price || 0),
          }))
        )
        setCount(count)
      } catch (e: any) {
        toast.error(e?.message ?? 'Falha ao carregar serviços')
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

  async function handleCreateServiceViaSidebar(data: { sku?: string; name: string; unit_price: number; unit_cost?: number; categories?: string[]; tags?: string[] }) {
    setSavingService(true)
    try {
      const created = await apiServices.create({
        sku: data.sku,
        name: data.name,
        unit_price: Number(data.unit_price ?? 0),
        unit_cost: Number(data.unit_cost ?? 0),
        categories: data.categories,
        tags: data.tags,
      })
      toast.success('Serviço criado')
      setOpenServiceForm(false)
      setReloadKey((k) => k + 1)
      setSelected((prev) => ({ ...prev, [created.id]: true }))
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao criar serviço')
    } finally {
      setSavingService(false)
    }
  }

  function handleConfirm() {
    const list = Object.values(selectedData)
    if (!list.length) {
      toast.message('Selecione ao menos um serviço')
      return
    }
    onConfirm(list)
    onOpenChange(false)
  }

  return (
    <CustomForm
      open={open}
      onOpenChange={onOpenChange}
      title="Selecionar serviços"
      description="Busque e selecione serviços para adicionar à ordem"
      submitLabel="Adicionar"
      submitDisabled={loading}
      onSubmit={(e) => { e.preventDefault(); handleConfirm() }}
      variant="dialog"
      footer={
        <div className="w-full flex items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">{count} resultados</div>
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
          <Button type='button' variant="outline" onClick={() => setOpenServiceForm(true)}>+ Novo</Button>
        </div>

        {/* Sidebar service form */}
        <ServiceForm
          open={openServiceForm}
          onOpenChange={setOpenServiceForm}
          loading={savingService}
          onSubmit={handleCreateServiceViaSidebar}
        />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead className="text-right">Preço</TableHead>
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
                  </TableRow>
                ))
              )}
              {!loading && rows.map((r) => (
                <TableRow key={r.id} data-state={selected[r.id] && 'selected'}>
                  <TableCell className="w-10">
                    <Checkbox checked={!!selected[r.id]} onCheckedChange={(v) => toggleRow(r.id, !!v)} />
                  </TableCell>
                  <TableCell>{r.sku ?? '-'}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell className="text-right">{formatBRL(Number(r.unit_price || 0))}</TableCell>
                </TableRow>
              ))}
              {!loading && !rows.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">{loading ? 'Carregando...' : 'Sem resultados'}</TableCell>
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
                <span key={it.id} className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
                  {it.sku ?? '-'} · {it.name}
                  <button type="button" className="ml-1 inline-flex items-center" onClick={() => toggleRow(it.id, false)} aria-label="Remover seleção">
                    <X className="size-3" />
                  </button>
                </span>
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
