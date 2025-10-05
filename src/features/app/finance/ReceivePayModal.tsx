import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomSelect from '@/components/custom/Input/CustomSelect'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { formatBRL, parseBRL } from '@/lib/format'
import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  defaultAmount?: number
  onSubmit: (data: { amount: number; method: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER'; notes?: string | null; addToCash?: boolean }) => Promise<void> | void
}

export function ReceivePayModal({ open, onOpenChange, title, defaultAmount = 0, onSubmit }: Props) {
  const [amount, setAmount] = useState(defaultAmount)
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'PIX' | 'TRANSFER'>('CASH')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [addToCash, setAddToCash] = useState(true)

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount)
      setAddToCash(true)
    }
  }, [defaultAmount, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (Number(amount) <= 0) return
    setLoading(true)
    try {
      await onSubmit({ amount: Number(amount), method, notes: notes?.trim() || null, addToCash })
      onOpenChange(false)
    } finally { setLoading(false) }
  }

  return (
    <CustomForm open={open} onOpenChange={onOpenChange} title={title} onSubmit={handleSubmit} submitLabel={loading ? 'Salvando...' : 'Confirmar'} submitDisabled={loading} variant="dialog">
      <>
        <div className="grid gap-4 items-start">
          <CustomSelect name="method" label="Forma de Pagamento" value={method} onChange={(v) => setMethod(v as any)} options={[{ value: 'CASH', label: 'Dinheiro' }, { value: 'CARD', label: 'Cartão' }, { value: 'PIX', label: 'PIX' }, { value: 'TRANSFER', label: 'Transferência' }]} />
          <CustomInput name="amount" label="Valor" value={formatBRL(amount)} onChange={(v) => setAmount(parseBRL(v))} />
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">Observações</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Observações sobre o recebimento" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Checkbox id="addToCash" checked={addToCash} onCheckedChange={(v: boolean) => setAddToCash(!!v)} />
          <label htmlFor="addToCash" className="text-sm text-muted-foreground select-none cursor-pointer">Adicionar ao caixa</label>
        </div>
      </>
    </CustomForm>
  )
}
