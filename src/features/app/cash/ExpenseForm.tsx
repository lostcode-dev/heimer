import { useEffect, useState } from 'react'
import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomSelect from '@/components/custom/Input/CustomSelect'

export type ExpenseFormProps = {
  open: boolean
  onOpenChange?: (open: boolean) => void
  initial?: { amount?: number; category?: 'FORNECEDOR' | 'OPERACIONAL' | 'OUTROS'; method?: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER'; notes?: string | null }
  loading?: boolean
  onSubmit: (data: { amount: number; category: 'FORNECEDOR' | 'OPERACIONAL' | 'OUTROS'; method?: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER'; notes?: string | null }) => Promise<void>
}

export function ExpenseForm({ open, onOpenChange, initial, loading, onSubmit }: ExpenseFormProps) {
  const [form, setForm] = useState({
    amount: initial?.amount ?? 0,
    category: initial?.category ?? 'OPERACIONAL' as 'FORNECEDOR' | 'OPERACIONAL' | 'OUTROS',
    method: initial?.method ?? 'CASH' as 'CASH' | 'CARD' | 'PIX' | 'TRANSFER',
    notes: initial?.notes ?? '',
  })
  const [errors, setErrors] = useState<{ amount?: string }>({})

  useEffect(() => {
    setForm({
      amount: initial?.amount ?? 0,
      category: initial?.category ?? 'OPERACIONAL',
      method: initial?.method ?? 'CASH',
      notes: initial?.notes ?? '',
    })
  }, [initial?.amount, initial?.category, initial?.method, initial?.notes])

  function change<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: val }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (Number(form.amount) <= 0) next.amount = 'Valor deve ser maior que 0'
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    await onSubmit({ amount: Number(form.amount) || 0, category: form.category, method: form.method, notes: form.notes || null })
  }

  return (
    <CustomForm open={open} onOpenChange={onOpenChange} title={'Registrar despesa'} onSubmit={submit}>
      <>
        <div className="grid md:grid-cols-3 gap-4">
          <CustomInput name="amount" label="Valor" value={String(form.amount)} onChange={(v) => change('amount', Number(v.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0)} error={errors.amount} disabled={loading} />
          <CustomSelect name="category" label="Categoria" value={form.category} onChange={(v) => change('category', v as any)} options={[
            { value: 'FORNECEDOR', label: 'Fornecedor' },
            { value: 'OPERACIONAL', label: 'Despesa operacional' },
            { value: 'OUTROS', label: 'Outros' },
          ]} />
          <CustomSelect name="method" label="Forma de pagamento" value={form.method} onChange={(v) => change('method', v as any)} options={[
            { value: 'CASH', label: 'Dinheiro' },
            { value: 'CARD', label: 'Cartão' },
            { value: 'PIX', label: 'PIX' },
            { value: 'TRANSFER', label: 'Transferência' },
          ]} />
        </div>
        <CustomInput name="notes" label="Observações" value={form.notes} onChange={(v) => change('notes', v)} disabled={loading} />
      </>
    </CustomForm>
  )
}
