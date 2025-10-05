import { Smartphone, ShoppingBag, Plus, Trash2, UserPlus, CheckCircle2, Circle, X, AlertTriangle, CheckCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiCustomerSearch, apiCustomers, apiOrders, apiTechnicianSearch, apiTechnicians, apiProducts } from '@/lib/api'
import { formatBRL, maskTimeHHmm, parseBRL } from '@/lib/format'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomSelect from '@/components/custom/Input/CustomSelect'
import CustomDatePicker from '@/components/custom/Input/CustomDatePicker'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CustomerForm } from '@/features/app/customers/CustomerForm'
import { TechnicianForm } from '@/features/app/technicians/TechnicianForm'
import ProductPickerModal from './ProductPickerModal'
import ServicePickerModal from './ServicePickerModal'

type FormState = {
    customer_id: string
    customer_label?: string
    technician?: string | null
    technician_label?: string
    entry_date: string // date-only YYYY-MM-DD
    entry_time: string // HH:mm (guardado junto no ISO via combine na submissão)
    expected_date?: string | null
    expected_time?: string | null
    devices: { device_id?: string | null; brand?: string; model?: string; imei?: string; color?: string; notes?: string }[]
    informed_problem: string
    diagnostics?: string
    executed_service?: string
    notes?: string | null
    status: 'OPEN' | 'IN_PROGRESS' | 'AWAITING_PARTS' | 'READY' | 'DELIVERED' | 'CANCELLED'
    payment_method?: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER' | 'FIADO' | ''
    labor_price: number
    parts_total?: number
    shipping_total?: number
    discount_amount?: number
    items: { kind: 'PRODUCT' | 'SERVICE'; product_id?: string | null; description: string; qty: number; unit_price: number; total?: number }[]
}

// Status options (editable on edit)
const statusOptions = [
    { value: 'OPEN', label: 'Aberta' },
    { value: 'IN_PROGRESS', label: 'Em andamento' },
    { value: 'AWAITING_PARTS', label: 'Aguardando peças' },
    { value: 'READY', label: 'Pronta' },
    { value: 'DELIVERED', label: 'Entregue' },
    { value: 'CANCELLED', label: 'Cancelada' },
]

const paymentOptions = [
    { value: 'CASH', label: 'Dinheiro' },
    { value: 'CARD', label: 'Cartão' },
    { value: 'PIX', label: 'PIX' },
    { value: 'TRANSFER', label: 'Transferência' },
    { value: 'FIADO', label: 'Fiado' },
]

export default function OrderNewEditPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [loading, setLoading] = useState(false)
    const [ticketNumber, setTicketNumber] = useState<string>('')
    const [form, setForm] = useState<FormState>({
        customer_id: '',
        customer_label: '',
        technician: '',
        technician_label: '',
    entry_date: new Date().toISOString().slice(0,10),
    entry_time: new Date().toTimeString().slice(0, 5),
    expected_date: '',
        expected_time: '',
        devices: [],
        informed_problem: '',
        diagnostics: '',
        executed_service: '',
        notes: '',
        status: 'OPEN',
        payment_method: undefined as any,
        labor_price: 0,
        parts_total: 0,
        shipping_total: 0,
        discount_amount: 0,
        items: [],
    })
    const [customerOptions, setCustomerOptions] = useState<{ value: string; label: string }[]>([])
    const [customerLoading, setCustomerLoading] = useState(false)
    const [customerFormOpen, setCustomerFormOpen] = useState(false)
    const [creatingCustomer, setCreatingCustomer] = useState(false)
    const [technicianOptions, setTechnicianOptions] = useState<{ value: string; label: string }[]>([])
    const [productPickerOpen, setProductPickerOpen] = useState(false)
    const [servicePickerOpen, setServicePickerOpen] = useState(false)
    const [productStocks, setProductStocks] = useState<Record<string, number>>({})

    useEffect(() => {
        if (!id) return
        setLoading(true)
            ; (async () => {
                try {
                    const data = await apiOrders.getById(id)
                    setForm((prev) => ({
                        ...prev,
                        customer_id: data.customer_id ?? '',
                        customer_label: data.customer?.full_name ?? '',
                        technician: (data.technician_id ?? data.assigned_to) ?? '',
                        technician_label: (data.technician?.full_name ?? data.technician_user?.full_name) ?? '',
                        entry_date: new Date(data.created_at).toISOString().slice(0,10),
                        entry_time: new Date(data.created_at).toTimeString().slice(0, 5),
                        expected_date: data.due_date ? new Date(data.due_date).toISOString().slice(0,10) : '',
                        expected_time: data.due_date ? new Date(data.due_date).toTimeString().slice(0, 5) : '',
                        devices: (data.devices ?? []).map((d: any) => ({ device_id: d.device?.id, brand: d.device?.brand, model: d.device?.model, imei: d.device?.imei, color: d.device?.color, notes: d.device?.notes })),
                        informed_problem: data.problem_description ?? '',
                        diagnostics: data.diagnostics ?? '',
                        executed_service: data.executed_service ?? '',
                        notes: (data as any).notes ?? '',
                        status: data.status,
                        payment_method: (data.payment_method as any) || '',
                        labor_price: data.labor_price ?? 0,
                        parts_total: 0,
                        shipping_total: 0,
                        discount_amount: data.discount_amount ?? 0,
                        items: (data.items ?? []).map((it: any) => ({
                            kind: (it.kind ?? (it.product_id ? 'PRODUCT' : 'SERVICE')) as 'PRODUCT' | 'SERVICE',
                            product_id: it.product_id ?? null,
                            description: it.description,
                            qty: it.qty,
                            unit_price: Number(it.unit_price || 0),
                            total: Number(it.total || (Number(it.qty || 0) * Number(it.unit_price || 0))),
                        })),
                    }))
                    // Hydrate current stock for product items so the Stock column shows values when editing
                    try {
                        const productIds = Array.from(new Set((data.items ?? [])
                          .map((it: any) => it.product_id)
                          .filter((v: any) => !!v))) as string[]
                        if (productIds.length) {
                            const stockMap = await apiProducts.getStockFor(productIds)
                            setProductStocks((prev) => ({ ...prev, ...stockMap }))
                        }
                    } catch { /* ignore stock preload errors */ }
                    setTicketNumber((data as any)?.ticket_number ?? '')
                } catch (e: any) {
                    toast.error(e?.message ?? 'Falha ao carregar ordem')
                } finally {
                    setLoading(false)
                }
            })()
    }, [id])

    useEffect(() => {
        if (id) return
            // Mostra o próximo número de ordem (preview) via RPC para refletir o servidor
            ; (async () => {
                try {
                    const preview = await apiOrders.previewTicket()
                    setTicketNumber(preview)
                } catch {
                    setTicketNumber('')
                }
                // default expected delivery = entry date + 7 days, same time
                const base = new Date()
                const expected = new Date(base)
                expected.setDate(base.getDate() + 7)
                change('expected_date', expected.toISOString().slice(0,10))
                change('expected_time', new Date(base).toTimeString().slice(0, 5))
                // default one device pre-filled when creating a new order
                setForm((p) => ({ ...p, devices: p.devices?.length ? p.devices : [{ brand: '', model: '', imei: '', color: '', notes: '' }] }))
            })()
    }, [id])
    const [technicianLoading, setTechnicianLoading] = useState(false)
    const [technicianFormOpen, setTechnicianFormOpen] = useState(false)
    const [creatingTechnician, setCreatingTechnician] = useState(false)

    const computedParts = useMemo(() => (form.items ?? [])
        .filter((i) => i.kind === 'PRODUCT')
        .reduce((acc, i) => acc + Number(i.total ?? ((i.qty * i.unit_price) || 0)), 0), [form.items])
    const computedServices = useMemo(() => (form.items ?? [])
        .filter((i) => i.kind === 'SERVICE')
        .reduce((acc, i) => acc + Number(i.total ?? ((i.qty * i.unit_price) || 0)), 0), [form.items])
    const total = useMemo(() => {
        const parts = Number(computedParts || 0)
        const services = Number(computedServices || 0)
        const shipping = Number(form.shipping_total || 0)
        const discount = Number(form.discount_amount || 0)
        return Math.max(0, parts + services + shipping - discount)
    }, [computedParts, computedServices, form.shipping_total, form.discount_amount])

    function change<K extends keyof FormState>(key: K, val: FormState[K]) {
        setForm((p) => ({ ...p, [key]: val }))
    }

    async function submit() {
        try {
            setLoading(true)
            if (id) {
                await apiOrders.update(id, {
                    problem_description: form.informed_problem,
                    diagnostics: form.diagnostics ?? '',
                    executed_service: form.executed_service ?? '',
                    labor_price: Number(computedServices || 0),
                    discount_amount: form.discount_amount,
                    tax_amount: form.shipping_total ?? 0,
                    status: form.status,
                    notes: form.notes ?? '',
                    // Build local timestamp without converting to UTC to avoid +3h drift
                    due_date: (form.expected_date && form.expected_time)
                        ? `${form.expected_date.slice(0,10)}T${form.expected_time}:00`
                        : (form.expected_date ? `${form.expected_date.slice(0,10)}T00:00:00` : null),
                    delivered_at: form.status === 'DELIVERED' ? new Date().toISOString() : null,
                    devices: form.devices,
                    payment_method: (form.payment_method as any) || undefined,
                    technician_id: form.technician || null,
                    items: form.items.map((i) => ({ kind: i.kind, product_id: i.product_id ?? null, description: i.description, qty: i.qty, unit_price: i.unit_price, total: i.total })),
                })
                toast.success('Ordem atualizada')
                navigate(`/app/orders/${id}`)
            } else {
                const created = await apiOrders.create({
                    customer_id: form.customer_id,
                    problem_description: form.informed_problem,
                    diagnostics: form.diagnostics ?? '',
                    executed_service: form.executed_service ?? '',
                    labor_price: Number(computedServices || 0),
                    tax_amount: form.shipping_total ?? 0,
                    discount_amount: form.discount_amount ?? 0,
                    status: form.status,
                    notes: form.notes ?? '',
                    due_date: (form.expected_date && form.expected_time)
                        ? `${form.expected_date.slice(0,10)}T${form.expected_time}:00`
                        : (form.expected_date ? `${form.expected_date.slice(0,10)}T00:00:00` : null),
                    devices: form.devices,
                    technician_id: form.technician || null,
                    items: form.items.map((i) => ({ kind: i.kind, product_id: i.product_id ?? null, description: i.description, qty: i.qty, unit_price: i.unit_price, total: i.total })),
                    payment_method: (form.payment_method as any) || undefined,
                })
                toast.success('Ordem criada')
                navigate(`/app/orders/${created.id}`)
            }
        } catch (e: any) {
            toast.error(e?.message ?? 'Falha ao salvar')
        } finally {
            setLoading(false)
        }
    }

    let customerSearchTimer: number | undefined
    let techSearchTimer: number | undefined
    async function searchCustomers(q: string) {
        if (customerSearchTimer) window.clearTimeout(customerSearchTimer)
        setCustomerLoading(true)
        customerSearchTimer = window.setTimeout(async () => {
            try {
                const rows = await apiCustomerSearch.search(q)
                setCustomerOptions(rows.map((r: any) => ({ value: r.id, label: `${r.full_name}${r.phone ? ` · ${r.phone}` : ''}` })))
            } finally {
                setCustomerLoading(false)
            }
        }, 300)
    }

    // Precarrega sugestões iniciais (sem filtro) no mount
    useEffect(() => {
        (async () => {
            try {
                setCustomerLoading(true)
                const rows = await apiCustomerSearch.search('')
                setCustomerOptions(rows.map((r: any) => ({ value: r.id, label: `${r.full_name}${r.phone ? ` · ${r.phone}` : ''}` })))
            } finally {
                setCustomerLoading(false)
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function createCustomerInline(data: Parameters<typeof apiCustomers.create>[0]) {
        try {
            setCreatingCustomer(true)
            const created = await apiCustomers.create(data)
            // Update form with new customer
            const label = `${created.full_name}${created.phone ? ` · ${created.phone}` : ''}`
            change('customer_id', created.id)
            change('customer_label', label)
            // Prepend to options for Select to know about the value
            setCustomerOptions((prev) => [{ value: created.id, label }, ...prev.filter((o) => o.value !== created.id)])
            setCustomerFormOpen(false)
            toast.success('Cliente criado')
        } catch (e: any) {
            toast.error(e?.message ?? 'Falha ao criar cliente')
        } finally {
            setCreatingCustomer(false)
        }
    }

    async function searchTechnicians(q: string) {
        if (techSearchTimer) window.clearTimeout(techSearchTimer)
        setTechnicianLoading(true)
        techSearchTimer = window.setTimeout(async () => {
            try {
                const rows = await apiTechnicianSearch.search(q)
                setTechnicianOptions(rows.map((r: any) => ({ value: r.id, label: `${r.full_name}${r.phone ? ` · ${r.phone}` : ''}` })))
            } finally {
                setTechnicianLoading(false)
            }
        }, 300)
    }

    // Preload technicians on mount
    useEffect(() => {
        (async () => {
            try {
                setTechnicianLoading(true)
                const rows = await apiTechnicianSearch.search('')
                setTechnicianOptions(rows.map((r: any) => ({ value: r.id, label: `${r.full_name}${r.phone ? ` · ${r.phone}` : ''}` })))
            } finally {
                setTechnicianLoading(false)
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function createTechnicianInline(data: { full_name: string; email?: string | null; phone?: string | null; is_active?: boolean; notes?: string | null }) {
        try {
            setCreatingTechnician(true)
            const created = await apiTechnicians.create(data)
            const label = `${created.full_name}${created.phone ? ` · ${created.phone}` : ''}`
            change('technician', created.id)
            change('technician_label', label)
            setTechnicianOptions((prev) => [{ value: created.id, label }, ...prev.filter((o) => o.value !== created.id)])
            setTechnicianFormOpen(false)
            toast.success('Técnico criado')
        } catch (e: any) {
            toast.error(e?.message ?? 'Falha ao criar técnico')
        } finally {
            setCreatingTechnician(false)
        }
    }
    function addProductsFromPicker(rows: Array<{ id: string; sku: string; name: string; unit_price: number; stock_qty?: number }>) {
        const next = [...form.items]
        const nextStocks: Record<string, number> = { ...productStocks }
        for (const r of rows) {
            const existsIdx = next.findIndex((i) => i.kind === 'PRODUCT' && i.product_id === r.id)
            if (existsIdx >= 0) {
                // já existe: não adicionar duplicado
                continue
            } else {
                const price = Number(r.unit_price || 0)
                next.push({ kind: 'PRODUCT', product_id: r.id, description: `${r.sku} · ${r.name}`, qty: 1, unit_price: price, total: price })
                if (typeof r.stock_qty === 'number') { nextStocks[r.id] = Number(r.stock_qty) }
            }
        }
        setProductStocks(nextStocks)
        change('items', next)
    }
    function addServicesFromPicker(rows: Array<{ id: string; sku?: string | null; name: string; unit_price: number }>) {
        const next = [...form.items]
        for (const r of rows) {
            const price = Number(r.unit_price || 0)
            const desc = `${r.sku ? `${r.sku} · ` : ''}${r.name}`
            const exists = next.some((i) => i.kind === 'SERVICE' && i.description === desc)
            if (exists) continue
            next.push({ kind: 'SERVICE', product_id: null, description: desc , qty: 1, unit_price: price, total: price })
        }
        change('items', next)
    }
    function updateItem(idx: number, patch: Partial<FormState['items'][number]>) {
        const next = [...form.items]
        const it = { ...next[idx], ...patch }
        it.total = Number(it.qty || 0) * Number(it.unit_price || 0)
        next[idx] = it
        change('items', next)
    }
    function removeItem(idx: number) {
        change('items', form.items.filter((_, i) => i !== idx))
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Cabeçalho e contato */}
            <Card className="p-4 space-y-2">
                <div className="grid md:grid-cols-4 gap-4">
                    <CustomInput name="ticket" label="Nº da Ordem" value={ticketNumber || '—'} disabled onChange={() => { }} />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex gap-2 items-end w-full">
                        <CustomSelect
                            name="technician"
                            label="Técnico"
                            placeholder="Busque por nome"
                            value={form.technician || ''}
                            options={technicianOptions}
                            onChange={(v) => { change('technician', v); const opt = technicianOptions.find(o => o.value === v); change('technician_label', opt?.label ?? ''); }}
                            searchable
                            onSearch={(q) => void searchTechnicians(q)}
                            loading={technicianLoading}
                            emptyMessage="Nenhum técnico encontrado"
                            className="w-full"
                            onOpenChange={(open) => { if (open && technicianOptions.length === 0) void searchTechnicians('') }}
                        />
                        <Button size="sm" variant="outline" onClick={() => setTechnicianFormOpen(true)}><UserPlus className="h-3 w-3" /></Button>
                    </div>

                    <div className="flex gap-2 items-end w-full">
                        <CustomSelect
                            name="customer_id"
                            label="Cliente"
                            placeholder="Busque por nome ou telefone"
                            value={form.customer_id}
                            options={customerOptions}
                            onChange={(v) => { change('customer_id', v); const opt = customerOptions.find(o => o.value === v); change('customer_label', opt?.label ?? ''); }}
                            searchable
                            onSearch={(q) => void searchCustomers(q)}
                            loading={customerLoading}
                            emptyMessage="Nenhum cliente encontrado"
                            className="w-full"
                            onOpenChange={(open) => { if (open && customerOptions.length === 0) void searchCustomers('') }}
                        />
                        <Button size="sm" variant="outline" onClick={() => setCustomerFormOpen(true)}><UserPlus className="h-3 w-3" /></Button>
                    </div>
                </div>
                <div className="grid md:grid-cols-4 gap-4">
                    <CustomDatePicker label="Data de Entrada" value={form.entry_date} onChange={(v) => change('entry_date', v)} />
                    <CustomInput name="entry_time" label="Hora" value={form.entry_time} onChange={(v) => change('entry_time', maskTimeHHmm(v))} placeholder="HH:mm" />
                    <CustomDatePicker label="Previsão de Entrega" value={form.expected_date ?? ''} onChange={(v) => change('expected_date', v)} />
                    <CustomInput name="expected_time" label="Hora" value={form.expected_time ?? ''} onChange={(v) => change('expected_time', v)} placeholder="HH:mm" />

                </div>
                <div className="grid md:grid-cols-4 gap-4">
                    {id ? (
                        <CustomSelect
                            name="status"
                            label="Status"
                            placeholder="Selecione"
                            value={form.status}
                            options={statusOptions}
                            onChange={(v) => change('status', v as any)}
                        />
                    ) : null}
                    <CustomSelect name="payment_method" label="Forma de Pagamento" placeholder="Selecione" value={form.payment_method as any} options={paymentOptions} onChange={(v) => change('payment_method', v as any)} />
                </div>
            </Card>

            {/* Equipamentos (múltiplos) */}
            <Card className=" p-4 ">
                <div className="flex items-center justify-between">
                    <div className="font-medium flex items-center gap-2"><Smartphone className="h-4 w-4" /> Equipamentos</div>
                    <Button size="sm" variant="outline" onClick={() => change('devices', [...form.devices, { brand: '', model: '', imei: '', color: '', notes: '' }])}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
                </div>
                {/* Always at least one device on new; keep hint only if editing and zero */}
                {form.devices.length === 0 && id && (
                    <div className="text-sm text-muted-foreground">Nenhum equipamento adicionado.</div>
                )}
                {form.devices.map((d, idx) => (
                    <Card key={idx} className="relative px-3 py-4">
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="absolute right-2 top-2 size-7"
                            onClick={() => change('devices', form.devices.filter((_, i) => i !== idx))}
                            aria-label="Remover equipamento"
                            title="Remover equipamento"
                            disabled={form.devices.length <= 1}
                        >
                            <X className="h-4 w-4 " />
                        </Button>
                        <div className="grid md:grid-cols-12 gap-3">
                            <div className="md:col-span-3">
                                <CustomInput name={`brand_${idx}`} label="Marca" value={d.brand ?? ''} onChange={(v) => { const next = [...form.devices]; next[idx] = { ...next[idx], brand: v }; change('devices', next) }} />
                            </div>
                            <div className="md:col-span-4">
                                <CustomInput name={`model_${idx}`} label="Modelo" value={d.model ?? ''} onChange={(v) => { const next = [...form.devices]; next[idx] = { ...next[idx], model: v }; change('devices', next) }} />
                            </div>
                            <div className="md:col-span-3">
                                <CustomInput name={`imei_${idx}`} label="IMEI/Série" value={d.imei ?? ''} onChange={(v) => { const next = [...form.devices]; next[idx] = { ...next[idx], imei: v }; change('devices', next) }} />
                            </div>
                            <div className="md:col-span-2">
                                <CustomInput name={`color_${idx}`} label="Cor" value={d.color ?? ''} onChange={(v) => { const next = [...form.devices]; next[idx] = { ...next[idx], color: v }; change('devices', next) }} />
                            </div>
                            <div className="md:col-span-12">
                                <CustomInput name={`notes_${idx}`} label="Notas" value={d.notes ?? ''} onChange={(v) => { const next = [...form.devices]; next[idx] = { ...next[idx], notes: v }; change('devices', next) }} />
                            </div>
                        </div>
                    </Card>
                ))}
            </Card>

            {/* Problemas e observações (Tabs em 4 seções) */}
            <Card className=" p-4">
                <Tabs defaultValue="informado" className="w-full">
                    <TabsList className="grid grid-cols-3">
                        {([
                            { key: 'informado', label: 'Problema Informado', done: !!form.informed_problem?.trim() },
                            { key: 'constatado', label: 'Problema Constatado', done: !!form.diagnostics?.trim() },
                            { key: 'executado', label: 'Serviço Executado', done: !!form.executed_service?.trim() },
                        ] as const).map(t => (
                            <TabsTrigger key={t.key} value={t.key} className={t.done ? 'text-emerald-700 data-[state=active]:text-emerald-900' : ''}>
                                <span className="inline-flex items-center gap-2">
                                    {t.done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}
                                    {t.label}
                                </span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="informado" className="space-y-4">
                        <div className="grid gap-2">
                            <Textarea value={form.informed_problem} onChange={(e) => change('informed_problem', e.target.value)} placeholder="Ex.: não liga, sem sinal, etc." />
                        </div>
                    </TabsContent>

                    <TabsContent value="constatado" className="space-y-4">
                        <div className="grid gap-2">
                            <Textarea value={form.diagnostics ?? ''} onChange={(e) => change('diagnostics', e.target.value)} placeholder="Ex.: placa danificada, oxidação, etc." />
                        </div>
                    </TabsContent>

                    <TabsContent value="executado" className="space-y-4">
                        <div className="grid gap-2">
                            <Textarea value={form.executed_service ?? ''} onChange={(e) => change('executed_service', e.target.value)} placeholder="Descreva o que foi realizado" />
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="grid gap-2">
                    <label className="text-sm font-medium">Observações</label>
                    <Textarea value={form.notes ?? ''} onChange={(e) => change('notes', e.target.value)} placeholder="Informações adicionais do cliente/serviço" />
                </div>
            </Card>

            {/* Itens (Produtos/Serviços) - placeholder scaffolding (optional next: full grid component) */}
            <Card className="p-4">
                <div>
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Itens</div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setProductPickerOpen(true)}><Plus className="h-4 w-4 mr-1" /> Produtos</Button>
                            <Button size="sm" variant="outline" onClick={() => setServicePickerOpen(true)}><Plus className="h-4 w-4 mr-1" /> Serviços</Button>
                        </div>
                    </div>

                    <div className="mt-2 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground">
                                    <th className="px-2 py-1">Tipo</th>
                                    <th className="px-2 py-1">Descrição</th>
                                    <th className="px-2 py-1 w-24">Qtde</th>
                                    <th className="px-2 py-1 w-32">Preço (R$)</th>
                                    <th className="px-2 py-1 w-24 text-right">Estoque</th>
                                    <th className="px-2 py-1 w-32">Total (R$)</th>
                                    <th className="px-2 py-1 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {form.items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-2 py-4 text-center text-muted-foreground">Nenhum item adicionado.</td>
                                    </tr>
                                ) : (
                                    form.items.map((it, idx) => (
                                        <tr key={idx} className="border-t">
                                            <td className="px-2 py-1 align-middle">{it.kind === 'PRODUCT' ? 'Produto' : 'Serviço'}</td>
                                            <td className="px-2 py-1 align-middle">{it.description}</td>
                                            <td className="px-2 py-1 align-middle">
                                                <CustomInput name={`qty_${idx}`} label="" value={String(it.qty)} onChange={(v) => updateItem(idx, { qty: Number(v.replace(/[^0-9-]/g, '')) || 0 })} />
                                            </td>
                                            <td className="px-2 py-1 align-middle">
                                                <CustomInput name={`price_${idx}`} label="" value={formatBRL(Number(it.unit_price || 0))} onChange={() => { }} disabled />
                                            </td>
                                            <td className="px-2 py-1 align-middle text-right">
                                                {it.kind === 'PRODUCT' && it.product_id ? (
                                                    (() => {
                                                        const qty = productStocks[String(it.product_id)]
                                                        if (typeof qty !== 'number') return <span className="text-muted-foreground">-</span>
                                                        const critical = qty <= 0
                                                        const cls = critical ? 'bg-rose-600 text-white border-transparent' : 'bg-emerald-600 text-white border-transparent'
                                                        const Icon = critical ? AlertTriangle : CheckCircle
                                                        return (
                                                            <Badge className={`px-2 py-0.5 gap-1.5 ${cls}`}>
                                                                <Icon className="size-3.5" />
                                                                {qty}
                                                            </Badge>
                                                        )
                                                    })()
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="px-2 py-1 align-middle">{Number(it.total || (it.qty * it.unit_price)).toFixed(2)}</td>
                                            <td className="px-2 py-1 align-middle text-right">
                                                <button type="button" className="inline-flex items-center rounded px-2 py-1 hover:bg-accent" onClick={() => removeItem(idx)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </Card>

            {/* Totais */}
            <Card className="p-4 space-y-4">
                <div className="grid md:grid-cols-5 gap-4">
                    <CustomInput name="labor_price" label="Serviço" value={formatBRL(computedServices)} onChange={() => { }} disabled />
                    <CustomInput name="parts_total" label="Peças" value={formatBRL(computedParts)} onChange={() => { }} disabled />
                    <CustomInput name="shipping_total" label="Deslocamento" value={formatBRL(form.shipping_total ?? 0)} onChange={(v) => change('shipping_total', parseBRL(v))} />
                    <CustomInput name="discount_amount" label="Desconto" value={formatBRL(form.discount_amount ?? 0)} onChange={(v) => change('discount_amount', parseBRL(v))} />
                    <div>
                        <div className="text-sm font-medium flex items-center gap-1">Total</div>
                        <div className="text-2xl font-semibold">{formatBRL(total)}</div>
                    </div>
                </div>
            </Card>

            <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
                <Button onClick={submit} disabled={loading}>Salvar</Button>
            </div>
            <CustomerForm
                open={customerFormOpen}
                onOpenChange={setCustomerFormOpen}
                loading={creatingCustomer}
                onSubmit={createCustomerInline}
            />
            <TechnicianForm
                open={technicianFormOpen}
                onOpenChange={setTechnicianFormOpen}
                loading={creatingTechnician}
                onSubmit={createTechnicianInline}
            />
            <ProductPickerModal open={productPickerOpen} onOpenChange={setProductPickerOpen} onConfirm={addProductsFromPicker} />
            <ServicePickerModal open={servicePickerOpen} onOpenChange={setServicePickerOpen} onConfirm={addServicesFromPicker} />
        </div>
    )
}

// Inline Customer Form modal
// Render at the bottom to avoid layout shifts
; (() => { })
