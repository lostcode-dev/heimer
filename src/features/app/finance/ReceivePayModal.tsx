import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomSelect from '@/components/custom/Input/CustomSelect'
import { formatBRL, parseBRL } from '@/lib/format'
import { useState } from 'react'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  defaultAmount?: number
  onSubmit: (data: { amount: number; method: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER'; notes?: string | null }) => Promise<void> | void
}

export function ReceivePayModal({ open, onOpenChange, title, defaultAmount = 0, onSubmit }: Props) {
  const [amount, setAmount] = useState(defaultAmount)
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'PIX' | 'TRANSFER'>('CASH')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (Number(amount) <= 0) return
    setLoading(true)
    try {
      await onSubmit({ amount: Number(amount), method, notes: notes?.trim() || null })
      onOpenChange(false)
    } finally { setLoading(false) }
  }

  return (
    <CustomForm open={open} onOpenChange={onOpenChange} title={title} onSubmit={handleSubmit} submitLabel={loading ? 'Salvando...' : 'Confirmar'} submitDisabled={loading}>
      <>
        <div className="grid md:grid-cols-3 gap-4">
          <CustomInput name="amount" label="Valor" value={formatBRL(amount)} onChange={(v) => setAmount(parseBRL(v))} />
          <CustomSelect name="method" label="Forma" value={method} onChange={(v) => setMethod(v as any)} options={[{ value: 'CASH', label: 'Dinheiro' }, { value: 'CARD', label: 'Cartão' }, { value: 'PIX', label: 'PIX' }, { value: 'TRANSFER', label: 'Transferência' }]} />
          <CustomInput name="notes" label="Observações" value={notes} onChange={setNotes} />
        </div>
      </>
    </CustomForm>
  )
}
