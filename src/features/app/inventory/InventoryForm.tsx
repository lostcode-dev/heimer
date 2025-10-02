import { useEffect, useState } from 'react'
import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomSelect from '@/components/custom/Input/CustomSelect'
import CustomDatePicker from '@/components/custom/Input/CustomDatePicker'
import { Textarea } from '@/components/ui/textarea'
import { apiProductSearch } from '@/lib/api'

export type InventoryFormProps = {
  open: boolean
  onOpenChange?: (open: boolean) => void
  initial?: { id?: string; product_id?: string; product_label?: string; type?: 'IN' | 'OUT' | 'ADJUSTMENT'; qty?: number; reason?: string | null; occurred_at?: string }
  onSubmit: (data: { product_id: string; type: 'IN' | 'OUT' | 'ADJUSTMENT'; qty: number; reason?: string | null; occurred_at?: string }) => Promise<void>
}

export function InventoryForm({ open, onOpenChange, initial, onSubmit }: InventoryFormProps) {
  const [form, setForm] = useState({
    product_id: initial?.product_id ?? '',
    product_label: initial?.product_label ?? '',
    type: initial?.type ?? 'IN',
    qty: initial?.qty ?? 1,
    reason: initial?.reason ?? '',
    occurred_at: initial?.occurred_at ?? new Date().toISOString(),
  })
  const [errors, setErrors] = useState<{ product_id?: string; qty?: string }>({})
  const [options, setOptions] = useState<{ value: string; label: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setForm({
      product_id: initial?.product_id ?? '',
      product_label: initial?.product_label ?? '',
      type: initial?.type ?? 'IN',
      qty: initial?.qty ?? 1,
      reason: initial?.reason ?? '',
      occurred_at: initial?.occurred_at ?? new Date().toISOString(),
    })
  }, [initial?.product_id, initial?.product_label, initial?.type, initial?.qty, initial?.reason, initial?.occurred_at])

  function change<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: val }))
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function searchProducts(q: string) {
    setLoading(true)
    try {
      const rows = await apiProductSearch.search(q)
      setOptions(rows.map((r: any) => ({ value: r.id, label: `${r.sku} · ${r.name}` })))
    } finally { setLoading(false) }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!form.product_id) next.product_id = 'Produto é obrigatório'
    if (!form.qty || Number.isNaN(Number(form.qty))) next.qty = 'Quantidade inválida'
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    await onSubmit({
      product_id: form.product_id,
      type: form.type,
      qty: Number(form.qty),
      reason: form.reason || null,
      occurred_at: form.occurred_at,
    })
  }

  return (
    <CustomForm open={open} onOpenChange={onOpenChange} title={initial?.id ? 'Editar Movimento' : 'Novo Movimento'} onSubmit={submit}>
      <>
        <CustomSelect
          name="type"
          label="Tipo"
          value={form.type}
          onChange={(v) => change('type', v as any)}
          options={[{ value: 'IN', label: 'Entrada' }, { value: 'OUT', label: 'Saída' }, { value: 'ADJUSTMENT', label: 'Ajuste' }]}
        />
        <CustomSelect
          name="product_id"
          label="Produto"
          placeholder="Busque por SKU ou nome"
          value={form.product_id}
          options={options}
          onChange={(v) => { change('product_id', v); const opt = options.find(o => o.value === v); change('product_label', opt?.label ?? ''); }}
          searchable
          onSearch={(q) => void searchProducts(q)}
          loading={loading}
          emptyMessage="Nenhum produto encontrado"
          className="w-full"
          onOpenChange={(open) => { if (open && options.length === 0) void searchProducts('') }}
        />
        <CustomInput name="qty" label="Quantidade" value={String(form.qty)} onChange={(v) => change('qty', Number(v.replace(/[^0-9-]/g, '')) || 0)} />
        <div className="grid gap-1">
          <label className="text-sm font-medium" htmlFor="reason">Motivo</label>
          <Textarea id="reason" value={form.reason} onChange={(e) => change('reason', e.target.value)} placeholder="Descreva o motivo desta movimentação" />
        </div>
        <CustomDatePicker label="Data" value={form.occurred_at} onChange={(v) => change('occurred_at', v)} />
      </>
    </CustomForm>
  )
}
