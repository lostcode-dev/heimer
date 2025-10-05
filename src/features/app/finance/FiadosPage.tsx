import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock3, CircleDot, Ban, HandCoins, Eye } from 'lucide-react'
import type { IColumns, IPagination } from '@/types'
import { apiReceivables } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import { formatBRL } from '@/lib/format'
import NameWithAvatar from '@/components/common/NameWithAvatar'
import { MultiReceiveModal } from './MultiReceiveModal'

export default function FiadosPage() {
    const navigate = useNavigate()
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState<IPagination>({ sortField: 'customer_name', sortOrder: 'ASC', search: '', currentPage: 1, itemsPerPage: 10, currentTotalItems: 0, totalItems: 0, totalPages: 1 })

    const columns: IColumns<any>[] = [
        { label: 'Cliente', field: 'customer_name', sortable: true, component: ({ row }) => <NameWithAvatar name={row.customer_name} phone={row.customer_phone ?? undefined} /> },
        { label: 'Valor', field: 'amount', sortable: true, format: (v) => formatBRL(Number(v) || 0) },
        { label: 'Recebido', field: 'received_total', sortable: true, format: (v) => formatBRL(Number(v) || 0) },
        { label: 'Restante', field: 'remaining', sortable: true, format: (v) => formatBRL(Number(v) || 0) },
        {
            label: 'Status', field: 'status', sortable: true, component: ({ row }) => {
                const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; Icon: any }> = {
                    OPEN: { label: 'Aberto', variant: 'destructive', Icon: Clock3 },
                    PARTIAL: { label: 'Parcial', variant: 'secondary', Icon: CircleDot },
                    PAID: { label: 'Pago', variant: 'default', Icon: CheckCircle2 },
                    CANCELLED: { label: 'Cancelado', variant: 'outline', Icon: Ban },
                }
                const s = map[row.status] ?? map.OPEN
                return <Badge variant={s.variant} className="flex items-center gap-1"><s.Icon className="h-3 w-3" /> {s.label}</Badge>
            }
        },
    ]

    useEffect(() => { void fetchRows() }, [pagination.currentPage, pagination.itemsPerPage, pagination.sortField, pagination.sortOrder, pagination.search])

    async function fetchRows() {
        try {
            setLoading(true)
            const { data, count } = await apiReceivables.listFiadosByCustomerPaginated({ page: pagination.currentPage - 1, pageSize: pagination.itemsPerPage, sortBy: pagination.sortField as any, sortDir: pagination.sortOrder === 'ASC' ? 'asc' : 'desc', query: pagination.search })
            const rows = data ?? []
            setRows(rows)
            setPagination((p) => ({ ...p, currentTotalItems: rows.length, totalItems: count ?? 0, totalPages: Math.max(1, Math.ceil((count ?? 0) / p.itemsPerPage)) }))
        } catch (e: any) { toast.error(e?.message ?? 'Falha ao carregar fiados') } finally { setLoading(false) }
    }

    const [multiOpen, setMultiOpen] = useState(false)
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

    const actions = useMemo(() => ({
        view: (row: any) => navigate(`/app/finance/fiados/${row.customer_id ?? ''}`),
        update: (row: any) => { setSelectedCustomerId(String(row.customer_id)); setMultiOpen(true) },
    }), [navigate])

    return (
        <section className="space-y-6">
            <CustomTable
                data={rows}
                columns={columns}
                pagination={pagination}
                selected={[]}
                loading={loading}
                onRequest={setPagination as any}
                actions={actions as any}
                actionsLabels={{ view: 'Ver detalhes', update: 'Receber pagamento' }}
                actionsIcons={{ view: <Eye size={16} />, update: <HandCoins size={16} /> }}
            />
            {selectedCustomerId && (
                <MultiReceiveModal
                    open={multiOpen}
                    onOpenChange={(v) => { setMultiOpen(v); if (!v) setSelectedCustomerId(null) }}
                    customerId={selectedCustomerId}
                    onDone={() => { void fetchRows(); setMultiOpen(false); setSelectedCustomerId(null) }}
                />
            )}
        </section>
    )
}
