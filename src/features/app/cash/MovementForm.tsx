import { useEffect, useState } from 'react'
import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomSelect from '@/components/custom/Input/CustomSelect'

export type MovementFormProps = {
  open: boolean
  onOpenChange?: (open: boolean) => void
  initial?: { id?: string; type?: 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT'; amount?: number; notes?: string | null }
  loading?: boolean
  onSubmit: (data: { type: 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT'; amount: number; notes?: string | null }) => Promise<void>
}

export function MovementForm({ open, onOpenChange, initial, loading, onSubmit }: MovementFormProps) {
  const [form, setForm] = useState({
    type: initial?.type ?? 'DEPOSIT',
    amount: initial?.amount ?? 0,
    notes: initial?.notes ?? '',
  })
  const [errors, setErrors] = useState<{ amount?: string }>({})

  useEffect(() => {
    setForm({
      type: initial?.type ?? 'DEPOSIT',
      amount: initial?.amount ?? 0,
      notes: initial?.notes ?? '',
    })
  }, [initial?.type, initial?.amount, initial?.notes])

  function change<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: val }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (Number(form.amount) <= 0) next.amount = 'Valor deve ser maior que 0'
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    await onSubmit({ type: form.type, amount: Number(form.amount) || 0, notes: form.notes || null })
  }

  return (
    <CustomForm open={open} onOpenChange={onOpenChange} title={initial?.id ? 'Editar movimento' : 'Movimentação manual'} onSubmit={submit}>
      <>
        <CustomSelect name="type" label="Tipo" value={form.type} onChange={(v) => change('type', v as any)} options={[{ value: 'DEPOSIT', label: 'Depósito' }, { value: 'WITHDRAWAL', label: 'Retirada' }, { value: 'ADJUSTMENT', label: 'Ajuste' }]} />
        <div className="grid md:grid-cols-2 gap-4">
          <CustomInput name="amount" label="Valor" value={String(form.amount)} onChange={(v) => change('amount', Number(v.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0)} error={errors.amount} disabled={loading} />
          <CustomInput name="notes" label="Observações" value={form.notes} onChange={(v) => change('notes', v)} disabled={loading} />
        </div>
      </>
    </CustomForm>
  )
}
