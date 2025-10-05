import { useEffect, useMemo, useState } from 'react'
import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomSelect from '@/components/custom/Input/CustomSelect'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { formatBRL, parseBRL } from '@/lib/format'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { apiReceivables, apiCash } from '@/lib/api'
import { toast } from 'sonner'
import { normalizeAndTruncate } from '@/lib/utils'

type Row = { id: string; description: string; due_date?: string | null; amount: number; received_total?: number; remaining: number }

type Props = {
    open: boolean
    onOpenChange: (v: boolean) => void
    customerId: string
    onDone?: () => void
}

export function MultiReceiveModal({ open, onOpenChange, customerId, onDone }: Props) {
    const [loading, setLoading] = useState(false)
    const [rows, setRows] = useState<Row[]>([])
    const [method, setMethod] = useState<'CASH' | 'CARD' | 'PIX' | 'TRANSFER'>('CASH')
    const [amount, setAmount] = useState<number>(0)
    const [notes, setNotes] = useState('')
    const [addToCash, setAddToCash] = useState(true)
    const [selected, setSelected] = useState<Record<string, boolean>>({})

    useEffect(() => { if (open) { void load() } }, [open, customerId])

    async function load() {
        try {
            setLoading(true)
            const data = await apiReceivables.listByCustomerOpen(customerId)
            setRows(data as any)
            setSelected({})
            setAmount(0)
            setNotes('')
            setAddToCash(true)
        } catch (e: any) { toast.error(e?.message ?? 'Falha ao carregar títulos abertos') } finally { setLoading(false) }
    }

    const selectedIds = useMemo(() => Object.keys(selected).filter(k => selected[k]), [selected])
    const selectedTotal = useMemo(() => rows.filter(r => selected[r.id]).reduce((acc, r) => acc + Number(r.remaining || 0), 0), [rows, selected])
    const amountNum = Number(amount) || 0
    const pct = useMemo(() => amountNum > 0 ? Math.min(100, Math.round((selectedTotal / amountNum) * 100)) : 0, [selectedTotal, amountNum])

    function toggle(id: string) {
        const row = rows.find(r => r.id === id)
        if (!row) return
        const willSelect = !selected[id]
        if (willSelect) {
            if ((selectedTotal + Number(row.remaining || 0)) > amountNum) return // cap selection by amount
        }
        setSelected((s) => ({ ...s, [id]: willSelect }))
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        if (amountNum <= 0) return toast.error('Informe um valor válido')
        if (selectedIds.length === 0) return toast.error('Selecione ao menos um título')
        setLoading(true)
        try {
            const session = addToCash ? await (async () => { try { return await apiCash.getOpenSession() } catch { return null } })() : null
            let remainingToAllocate = amountNum
            for (const id of selectedIds) {
                if (remainingToAllocate <= 0) break
                const row = rows.find(r => r.id === id)
                if (!row) continue
                const pay = Math.min(Number(row.remaining || 0), remainingToAllocate)
                if (pay <= 0) continue
                await apiReceivables.addReceipt({ receivable_id: id, amount: pay, method, notes: notes?.trim() || null, cash_session_id: session?.id ?? null })
                remainingToAllocate -= pay
            }
            if (remainingToAllocate > 0) {
                toast.message('Aviso', { description: `Sobrou ${formatBRL(remainingToAllocate)} não alocado por falta de títulos selecionados.` })
            }
            toast.success('Recebimento registrado')
            onOpenChange(false)
            onDone?.()
        } catch (e: any) {
            toast.error(e?.message ?? 'Falha ao registrar recebimento')
        } finally { setLoading(false) }
    }

    return (
        <CustomForm open={open} onOpenChange={onOpenChange} title="Receber pagamento" onSubmit={submit} submitLabel={loading ? 'Salvando...' : 'Confirmar'} submitDisabled={loading} variant="dialog">
            <>
                <div className="grid  gap-4 items-start">
                    <CustomSelect name="method" label="Forma de Pagamento" value={method} onChange={(v) => setMethod(v as any)} options={[{ value: 'CASH', label: 'Dinheiro' }, { value: 'CARD', label: 'Cartão' }, { value: 'PIX', label: 'PIX' }, { value: 'TRANSFER', label: 'Transferência' }]} />
                    <CustomInput name="amount" label="Valor" value={formatBRL(amount)} onChange={(v) => setAmount(parseBRL(v))} />
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-muted-foreground">Observações</label>
                        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Observações sobre o recebimento" />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                    <Checkbox id="addToCashMulti" checked={addToCash} onCheckedChange={(v: boolean) => setAddToCash(!!v)} />
                    <label htmlFor="addToCashMulti" className="text-sm text-muted-foreground select-none cursor-pointer">Adicionar ao caixa</label>
                </div>

                <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="text-muted-foreground cursor-help select-none">Dívidas em aberto</div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <div className="max-w-sm text-center">
                                    Selecione os títulos (boletos/lançamentos) que deseja quitar com este pagamento.
                                    A seleção é limitada ao valor informado acima; ao atingir o limite, os demais
                                    itens ficarão indisponíveis para seleção.
                                </div>
                            </TooltipContent>
                        </Tooltip>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-emerald-700">{formatBRL(selectedTotal)}</span>
                            <span className="text-muted-foreground">de</span>
                            <span className="font-semibold">{formatBRL(amountNum)}</span>
                        </div>
                    </div>
                    <div className="h-1.5 w-full rounded bg-muted mb-2 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="overflow-x-auto rounded border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground">
                                    <th className="px-2 py-1"></th>
                                    <th className="px-2 py-1">Descrição</th>
                                    <th className="px-2 py-1">Restante</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => {
                                    const disabled = (selectedTotal + Number(r.remaining || 0)) > amountNum && !selected[r.id]
                                    return (
                                        <tr key={r.id} className="border-t">
                                            <td className="px-2 py-1">
                                                <Checkbox checked={!!selected[r.id]} onCheckedChange={() => toggle(r.id)} disabled={disabled || amountNum <= 0} />
                                            </td>
                                            <td className="px-2 py-1 max-w-[28rem]">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="block truncate whitespace-nowrap overflow-hidden text-ellipsis align-middle cursor-help">{normalizeAndTruncate(r.description, 20)}</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">{r.description}</TooltipContent>
                                                </Tooltip>
                                            </td>
                                            <td className="px-2 py-1">{formatBRL(Number(r.remaining) || 0)}</td>
                                        </tr>
                                    )
                                })}
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-2 py-4 text-center text-muted-foreground">Sem títulos em aberto.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                </div>


            </>
        </CustomForm>
    )
}
