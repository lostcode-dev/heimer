import { useEffect, useMemo, useRef, useState } from 'react'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomSelect from '@/components/custom/Input/CustomSelect'
import { apiCustomerSearch, apiProductSearch, apiCustomers, apiSales } from '@/lib/api'
import { formatBRL, parseBRL } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { UserPlus, Plus, X } from 'lucide-react'
import { CustomerForm } from '@/features/app/customers/CustomerForm'
//
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import CustomModalForm from '@/components/custom/Input/CustomModalForm'
import { Skeleton } from '@/components/ui/skeleton'

export type SaleItem = { id: string; product_id: string; label: string; qty: number; unit_price: number; sku?: string }
export type SalePayment = { id: string; method: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER'; amount: number; notes?: string | null }

type SaleFormProps = {
    open: boolean
    onOpenChange?: (open: boolean) => void
    initial?: { id?: string } | undefined
    onSubmit: (payload: { customer_id?: string | null; items: Array<{ product_id: string; qty: number; unit_price: number }>; payments: Array<{ method: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER'; amount: number; notes?: string | null }> }) => Promise<void>
}

export function SaleForm({ open, onOpenChange, initial, onSubmit }: SaleFormProps) {
    const isEditing = !!initial?.id
    const [hydrating, setHydrating] = useState(false)
    const [customerId, setCustomerId] = useState<string | null>(null)
    const [customerOptions, setCustomerOptions] = useState<{ value: string; label: string }[]>([])
    const [customerLoading, setCustomerLoading] = useState(false)
    const [customerFormOpen, setCustomerFormOpen] = useState(false)
    const customerSearchTimer = useRef<number | undefined>(undefined)
    const [productOptions, setProductOptions] = useState<{ value: string; label: string; price?: number; stock?: number; disabled?: boolean }[]>([])
    const [productSelectValue, setProductSelectValue] = useState<string>('')
    const [productLoading, setProductLoading] = useState(false)
    const [items, setItems] = useState<SaleItem[]>([])
    const [payments, setPayments] = useState<SalePayment[]>([{ id: crypto.randomUUID(), method: 'CASH', amount: 0 }])
    const [creatingCustomer, setCreatingCustomer] = useState(false)
    const [discount, setDiscount] = useState<number>(0)

    function addItem(sel: { value: string; label: string }, priceGuess?: number) {
        // Parse SKU and Name from label generated in select (format: "SKU · Name — R$ xx,xx")
        let sku: string | undefined
        let nameLabel = sel.label
        try {
            const left = sel.label.split('—')[0]?.trim() ?? sel.label
            const parts = left.split('·').map(s => s.trim())
            if (parts.length >= 2) {
                sku = parts[0]
                nameLabel = parts.slice(1).join(' · ')
            } else {
                nameLabel = left
            }
        } catch { /* noop */ }
        setItems((arr) => [
            ...arr,
            { id: crypto.randomUUID(), product_id: sel.value, label: nameLabel, qty: 1, unit_price: Number(priceGuess || 0), sku },
        ])
    }
    function updateItem(id: string, patch: Partial<{ qty: number; unit_price: number }>) {
        setItems((arr) => arr.map(it => it.id === id ? { ...it, ...patch } : it))
    }
    function removeItem(id: string) { setItems((arr) => arr.filter(it => it.id !== id)) }
    function addPayment() { setPayments((arr) => [...arr, { id: crypto.randomUUID(), method: 'CASH', amount: 0 }]) }
    function updatePayment(id: string, patch: Partial<SalePayment>) { setPayments((arr) => arr.map(p => p.id === id ? { ...p, ...patch } : p)) }
    function removePayment(id: string) { setPayments((arr) => arr.filter(p => p.id !== id)) }

    const totals = useMemo(() => {
        const itemsTotal = items.reduce((acc, it) => acc + Number(it.qty) * Number(it.unit_price), 0)
        const gross = itemsTotal
        const d = Math.max(Number(discount) || 0, 0)
        const netTotal = Math.max(gross - d, 0)
        const paymentsTotal = payments.reduce((acc, p) => acc + Number(p.amount), 0)
        return { itemsTotal: gross, discount: d, netTotal, paymentsTotal, diff: netTotal - paymentsTotal }
    }, [items, payments, discount])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        await onSubmit({
            customer_id: customerId,
            items: items.map(it => ({ product_id: it.product_id, qty: Number(it.qty), unit_price: Number(it.unit_price) })),
            payments: payments.map(p => ({ method: p.method, amount: Number(p.amount), notes: p.notes ?? null })),
        })
        setItems([]); setPayments([]); setCustomerId(null)
    }

    // customer search with debounce + preload on open
    async function searchCustomers(q: string) {
        if (customerSearchTimer.current) window.clearTimeout(customerSearchTimer.current)
        setCustomerLoading(true)
        customerSearchTimer.current = window.setTimeout(async () => {
            try {
                const rows = await apiCustomerSearch.search(q)
                setCustomerOptions(rows.map((r: any) => ({ value: r.id, label: `${r.full_name}${r.phone ? ` · ${r.phone}` : ''}` })))
            } finally {
                setCustomerLoading(false)
            }
        }, 300) as unknown as number
    }

    async function createCustomerInline(data: Parameters<typeof apiCustomers.create>[0]) {
        try {
            setCreatingCustomer(true)
            const created = await apiCustomers.create(data)
            const label = `${created.full_name}${created.phone ? ` · ${created.phone}` : ''}`
            setCustomerId(created.id)
            setCustomerOptions((prev) => [{ value: created.id, label }, ...prev.filter((o) => o.value !== created.id)])
            setCustomerFormOpen(false)
        } finally { setCreatingCustomer(false) }
    }

    // product search with loading indicator
    async function searchProducts(q: string) {
        try {
            setProductLoading(true)
            const data = await apiProductSearch.search(q)
            setProductOptions(data.map((p: any) => ({
                 disabled: typeof p.stock_qty === 'number' ? Number(p.stock_qty) <= 0 : false,
                value: p.id,
                label: `${p.sku ?? ''} · ${p.name} — ${formatBRL(Number(p.unit_price ?? 0))} ${typeof p.stock_qty === 'number' ? `· Estoque: ${p.stock_qty}` : ''}`.trim(),
                price: Number(p.unit_price ?? 0),
                stock: typeof p.stock_qty === 'number' ? Number(p.stock_qty) : undefined,
            })))
        } finally {
            setProductLoading(false)
        }
    }

    useEffect(() => { void searchProducts('') }, [])

    // Hydrate form on edit: load sale, seed selects and states
    useEffect(() => {
        if (!initial?.id) return
        (async () => {
            try {
                setHydrating(true)
                const sale = await apiSales.getPosSale(initial.id!)
                // customer
                if (sale.customer) {
                    const label = `${sale.customer.full_name}${sale.customer.phone ? ` · ${sale.customer.phone}` : ''}`
                    setCustomerOptions((prev) => [{ value: sale.customer.id, label }, ...prev.filter((o) => o.value !== sale.customer.id)])
                    setCustomerId(sale.customer.id)
                } else {
                    setCustomerId(null)
                }
                // items -> seed productOptions with current products so select knows them
                const seededProducts = (sale.items ?? []).map((it: any) => ({
                    value: it.product_id,
                    label: `${it.product?.sku ?? ''} · ${it.product?.name ?? ''} — ${formatBRL(Number(it.unit_price ?? it.product?.unit_price ?? 0))}`,
                    price: Number(it.unit_price ?? it.product?.unit_price ?? 0),
                }))
                setProductOptions((prev) => {
                    const map = new Map(prev.map(o => [o.value, o] as const))
                    for (const p of seededProducts) map.set(p.value, p)
                    return Array.from(map.values())
                })
                setItems((sale.items ?? []).map((it: any) => ({
                    id: crypto.randomUUID(),
                    product_id: it.product_id,
                    label: it.product?.name ?? it.product_id,
                    qty: Number(it.qty),
                    unit_price: Number(it.unit_price),
                    sku: it.product?.sku ?? undefined,
                })))
                // payments
                setPayments((sale.payments ?? []).map((p: any) => ({ id: crypto.randomUUID(), method: p.method, amount: Number(p.amount), notes: p.notes ?? null })))
            } catch { /* ignore */ }
            finally { setHydrating(false) }
        })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initial?.id])

    // filter out products already added to the cart
    const productOptionsAvailable = useMemo(() => {
        const added = new Set(items.map(i => i.product_id))
        return productOptions.filter(o => !added.has(o.value))
    }, [productOptions, items])

    // if current selection was added/filtered, clear it
    useEffect(() => {
        if (!productSelectValue) return
        const stillAvailable = productOptionsAvailable.some(o => o.value === productSelectValue)
        if (!stillAvailable) setProductSelectValue('')
    }, [productOptionsAvailable, productSelectValue])

    return (
        <CustomModalForm
            open={open}
            onOpenChange={onOpenChange}
            title={isEditing ? 'Editar Venda' : 'Nova Venda'}
            onSubmit={handleSubmit}
            submitDisabled={hydrating}
        >
            {hydrating ? (
                <div className="grid gap-4">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Card className="p-4 space-y-2">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-2/3" />
                    </Card>
                    <Card className="p-4 space-y-2">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-2/3" />
                    </Card>
                    <Skeleton className="h-6 w-40 ml-auto" />
                </div>
            ) : (
            <div className="grid gap-4">
                <div className="flex gap-2 items-end w-full">
                    <CustomSelect
                        name="customer"
                        label="Cliente"
                        placeholder="Busque por nome ou telefone"
                        value={customerId ?? ''}
                        options={customerOptions}
                        onChange={(v) => setCustomerId(v || null)}
                        searchable
                        onSearch={(q) => void searchCustomers(q)}
                        loading={customerLoading}
                        emptyMessage="Nenhum cliente encontrado"
                        className="w-full"
                        onOpenChange={(open) => { if (open && customerOptions.length === 0) void searchCustomers('') }}
                    />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button className='h-9' variant="outline" type="button" onClick={() => setCustomerFormOpen(true)} aria-label="Novo cliente"><UserPlus className="h-3 w-3" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Novo cliente</TooltipContent>
                    </Tooltip>
                </div>

            <div className="space-y-2">
                <div className="grid gap-3">
                    <div className="flex gap-2 items-end w-full">
                        <CustomSelect
                            name="product"
                            label="Produto"
                            placeholder="Busque por SKU ou nome"
                            value={productSelectValue}
                            options={productOptionsAvailable}
                            onChange={(v) => { setProductSelectValue(v) }}
                            searchable
                            onSearch={(q) => void searchProducts(q)}
                            loading={productLoading}
                            emptyMessage="Nenhum produto encontrado"
                            className="w-full"
                            onOpenChange={(open) => { if (open && productOptions.length === 0) void searchProducts('') }}
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    className='h-9'
                                    variant="outline"
                                    type="button"
                                    disabled={
                                        !productSelectValue
                                        || !productOptionsAvailable.some(o => o.value === productSelectValue)
                                        || !!productOptionsAvailable.find(o => o.value === productSelectValue)?.disabled
                                    }
                                    onClick={() => {
                                        const sel = productOptions.find(o => o.value === productSelectValue)
                                        if (!sel) return
                                        addItem({ value: sel.value, label: sel.label }, sel.price)
                                        setProductSelectValue('')
                                    }}
                                    aria-label="Adicionar item"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Adicionar item</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {items.map((it) => (
                    <Card className="px-3 py-2 relative" key={it.id}>
                        <div className="absolute right-2 top-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button className='h-5 w-5 -mr-1' variant="ghost" type="button" onClick={() => removeItem(it.id)} aria-label="Remover item">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remover item</TooltipContent>
                            </Tooltip>
                        </div>
                        <div className='grid gap-2'>
                            <p className='text-sm font-medium flex items-center gap-2'>
                                {it.sku ? <Badge variant="outline">{it.sku}</Badge> : null}
                                <span>{it.label}</span>
                                {(() => { const opt = productOptions.find(o => o.value === it.product_id); const s = opt?.stock; if (typeof s === 'number') return <Badge variant={s>0?"secondary":"destructive"} className="ml-2">{s>0?`Em estoque: ${s}`:"Sem estoque"}</Badge>; return null })()}
                            </p>
                            <div key={it.id} className="grid md:grid-cols-2 gap-4 items-end">
                                <CustomInput name={`qty-${it.id}`} label={`Quantidade`} value={String(it.qty)} onChange={(v) => updateItem(it.id, { qty: Number(v.replace(/\D/g, '')) || 0 })} />
                                <div className="flex items-end gap-2">
                                    <CustomInput name={`price-${it.id}`} label="Preço unitário" value={formatBRL(it.unit_price)} onChange={(v) => updateItem(it.id, { unit_price: parseBRL(v) })} disabled />
                                </div>
                                    <div className="flex justify-between items-center -mt-2 text-sm text-muted-foreground">
                                        <div>Item: {formatBRL(Number(it.qty) * Number(it.unit_price))}</div>
                                        {(() => {
                                            const opt = productOptions.find(o => o.value === it.product_id)
                                            const stock = typeof opt?.stock === 'number' ? opt.stock : undefined
                                            if (typeof stock === 'number') {
                                                const projected = stock - Number(it.qty)
                                                return <div className={projected < 0 ? 'text-rose-600' : ''}>Estoque após venda: {projected}</div>
                                            }
                                            return null
                                        })()}
                                    </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Pagamentos</div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button type="button" size="sm" variant="outline" onClick={addPayment}><Plus className="h-4 w-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Dividir pagamento por método</TooltipContent>
                    </Tooltip>
                </div>
                {payments.map((p) => (
                    <Card key={p.id} className="grid gap-4 px-2 py-3 relative">
                        <div className="flex items-end justify-end absolute right-2 top-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button type="button" className='h-5 w-5' variant="ghost" onClick={() => removePayment(p.id)} aria-label="Remover pagamento"><X className="h-4 w-4" /></Button>
                                </TooltipTrigger>
                                <TooltipContent>Remover pagamento</TooltipContent>
                            </Tooltip>
                        </div>
                        <div className='grid md:grid-cols-2 gap-4'>
                        <CustomSelect name={`method-${p.id}`} label="Forma" value={p.method} onChange={(v) => updatePayment(p.id, { method: v as any })} options={[{ value: 'CASH', label: 'Dinheiro' }, { value: 'CARD', label: 'Cartão' }, { value: 'PIX', label: 'PIX' }, { value: 'TRANSFER', label: 'Transferência' }, { value: 'FIADO', label: 'Fiado' }]} />
                        <CustomInput name={`amount-${p.id}`} label="Valor" value={formatBRL(p.amount)} onChange={(v) => updatePayment(p.id, { amount: parseBRL(v) })} />
                       </div>
                        {p.method === 'CARD' ? (
                            <CustomSelect
                                name={`installments-${p.id}`}
                                label="Parcelas"
                                value={String((p as any).installments ?? '1')}
                                onChange={(v) => updatePayment(p.id, { ...(p as any), installments: Number(v || '1') } as any)}
                                options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}x` }))}
                            />
                        ) : null}
                        {p.method === 'CARD' ? (
                            <div className="flex items-end justify-between text-sm text-muted-foreground w-full">
                                <div className="ml-4 whitespace-nowrap">Simulação: {String((p as any).installments ?? 1)}x de {formatBRL((Number(p.amount) || 0) / Math.max(Number((p as any).installments ?? 1), 1))}</div>
                            </div>
                        ) : null}
                    </Card>
                ))}

                <div className="grid md:grid-cols-2 gap-4">
                    <CustomInput name={`discount`} label="Desconto" value={formatBRL(discount)} onChange={(v) => setDiscount(parseBRL(v))} />
                </div>

                <div className="text-right text-sm">
                    <div className="text-right text-sm">Total itens: {formatBRL(totals.itemsTotal)}</div>
                    {totals.discount > 0 ? (
                        <div className="text-right text-sm">Desconto: -{formatBRL(totals.discount)}</div>
                    ) : null}
                    <div className="text-right font-medium">Total a pagar: {formatBRL(totals.netTotal)}</div>

                    <p>Pagamentos: {formatBRL(totals.paymentsTotal)}</p>
                    <p>Diferença: <span className={Math.abs(totals.diff) < 0.01 ? 'text-emerald-600' : 'text-rose-600'}>{formatBRL(totals.diff)}</span></p>
                </div>
            </div>

            <CustomerForm open={customerFormOpen} onOpenChange={setCustomerFormOpen} loading={creatingCustomer} onSubmit={async (data) => { await createCustomerInline(data) }} />
            </div>
            )}
        </CustomModalForm>
    )
}
