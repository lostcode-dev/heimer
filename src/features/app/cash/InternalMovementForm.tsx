import { useEffect, useState } from 'react'
import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomSelect from '@/components/custom/Input/CustomSelect'

export type InternalMovementFormProps = {
  open: boolean
  onOpenChange?: (open: boolean) => void
  initial?: { kind?: 'REFORCO' | 'SANGRIA'; amount?: number; notes?: string | null }
  loading?: boolean
  onSubmit: (data: { kind: 'REFORCO' | 'SANGRIA'; amount: number; notes?: string | null }) => Promise<void>
}

export function InternalMovementForm({ open, onOpenChange, initial, loading, onSubmit }: InternalMovementFormProps) {
  const [form, setForm] = useState({
    kind: initial?.kind ?? 'REFORCO' as 'REFORCO' | 'SANGRIA',
    amount: initial?.amount ?? 0,
    notes: initial?.notes ?? '',
  })
  const [errors, setErrors] = useState<{ amount?: string }>({})

  useEffect(() => {
    setForm({ kind: initial?.kind ?? 'REFORCO', amount: initial?.amount ?? 0, notes: initial?.notes ?? '' })
  }, [initial?.kind, initial?.amount, initial?.notes])

  function change<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: val }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (Number(form.amount) <= 0) next.amount = 'Valor deve ser maior que 0'
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    await onSubmit({ kind: form.kind, amount: Number(form.amount) || 0, notes: form.notes || null })
  }

  return (
    <CustomForm open={open} onOpenChange={onOpenChange} title={'Reforço/Sangria'} onSubmit={submit}>
      <>
        <div className="grid md:grid-cols-3 gap-4">
          <CustomSelect name="kind" label="Tipo" value={form.kind} onChange={(v) => change('kind', v as any)} options={[{ value: 'REFORCO', label: 'Reforço' }, { value: 'SANGRIA', label: 'Sangria' }]} />
          <CustomInput name="amount" label="Valor" value={String(form.amount)} onChange={(v) => change('amount', Number(v.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0)} error={errors.amount} disabled={loading} />
        </div>
        <CustomInput name="notes" label="Observações" value={form.notes} onChange={(v) => change('notes', v)} disabled={loading} />
      </>
    </CustomForm>
  )
}
