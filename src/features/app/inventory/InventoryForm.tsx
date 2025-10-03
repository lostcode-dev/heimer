import { useEffect, useState } from 'react'
import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomSelect from '@/components/custom/Input/CustomSelect'
import CustomDatePicker from '@/components/custom/Input/CustomDatePicker'
import { Textarea } from '@/components/ui/textarea'
import { apiProductSearch } from '@/lib/api'
import { Plus, Trash2 } from 'lucide-react'

export type InventoryFormProps = {
  open: boolean
  onOpenChange?: (open: boolean) => void
  initial?: { id?: string; product_id?: string; product_label?: string; type?: 'IN' | 'OUT' | 'ADJUSTMENT'; qty?: number; reason?: string | null; occurred_at?: string }
  onSubmit: (data: { product_id: string; type: 'IN' | 'OUT' | 'ADJUSTMENT'; qty: number; reason?: string | null; occurred_at?: string }) => Promise<void>
  onSubmitBatch?: (
    items: Array<{ product_id: string; qty: number }>,
    shared: { type: 'IN' | 'OUT' | 'ADJUSTMENT'; reason?: string | null; occurred_at?: string }
  ) => Promise<void>
}

export function InventoryForm({ open, onOpenChange, initial, onSubmit, onSubmitBatch }: InventoryFormProps) {
  const isEdit = Boolean(initial?.id)
  // Shared (applies to all items in multi-add mode)
  const [shared, setShared] = useState({
    type: initial?.type ?? 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT',
    reason: initial?.reason ?? '',
    occurred_at: initial?.occurred_at ?? new Date().toISOString(),
  })
  // Single item mode (edit)
  const [single, setSingle] = useState({
    product_id: initial?.product_id ?? '',
    product_label: initial?.product_label ?? '',
    qty: initial?.qty ?? 1,
  })
  // Multi-add mode: list of items to create
  const [items, setItems] = useState<Array<{ product_id: string; product_label: string; qty: number }>>([
    { product_id: '', product_label: '', qty: 1 },
  ])

  const [errors, setErrors] = useState<{ product_id?: string; qty?: string; rows?: Array<{ product_id?: string; qty?: string }> }>({})
  const [options, setOptions] = useState<{ value: string; label: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setShared({
      type: initial?.type ?? 'IN',
      reason: initial?.reason ?? '',
      occurred_at: initial?.occurred_at ?? new Date().toISOString(),
    })
    setSingle({
      product_id: initial?.product_id ?? '',
      product_label: initial?.product_label ?? '',
      qty: initial?.qty ?? 1,
    })
    setItems([{ product_id: '', product_label: '', qty: 1 }])
    // When editing and we have an initial selection, preload options with the current label
    if (initial?.product_id && initial?.product_label) {
      setOptions((opts) => {
        const exists = opts.some((o) => o.value === initial.product_id)
        return exists ? opts : [{ value: initial.product_id!, label: initial.product_label! }, ...opts]
      })
    }
  }, [initial?.product_id, initial?.product_label, initial?.type, initial?.qty, initial?.reason, initial?.occurred_at])

  function changeShared<K extends keyof typeof shared>(key: K, val: (typeof shared)[K]) {
    setShared((p) => ({ ...p, [key]: val }))
  }
  function changeSingle<K extends keyof typeof single>(key: K, val: (typeof single)[K]) {
    setSingle((p) => ({ ...p, [key]: val }))
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
    if (isEdit) {
      const next: typeof errors = {}
      if (!single.product_id) next.product_id = 'Produto é obrigatório'
      if (!single.qty || Number.isNaN(Number(single.qty))) next.qty = 'Quantidade inválida'
      setErrors(next)
      if (Object.values(next).some(Boolean)) return
      await onSubmit({
        product_id: single.product_id,
        type: shared.type,
        qty: Number(single.qty),
        reason: shared.reason || null,
        occurred_at: shared.occurred_at,
      })
      return
    }

    // Multi-add mode
    const rowErrors: Array<{ product_id?: string; qty?: string }> = items.map((row) => ({
      product_id: row.product_id ? undefined : 'Obrigatório',
      qty: !row.qty || Number.isNaN(Number(row.qty)) ? 'Inválida' : undefined,
    }))
    const hasAnyError = rowErrors.some((r) => r.product_id || r.qty)
    if (items.length === 0) {
      setErrors({ rows: [{ product_id: 'Obrigatório', qty: 'Inválida' }] })
      return
    }
    if (hasAnyError) {
      setErrors({ rows: rowErrors })
      return
    }
    if (onSubmitBatch) {
      await onSubmitBatch(
        items.map((r) => ({ product_id: r.product_id, qty: Number(r.qty) })),
        { type: shared.type, reason: shared.reason || null, occurred_at: shared.occurred_at }
      )
    } else {
      // Fallback: sequential calls
      for (const row of items) {
        await onSubmit({
          product_id: row.product_id,
          type: shared.type,
          qty: Number(row.qty),
          reason: shared.reason || null,
          occurred_at: shared.occurred_at,
        })
      }
    }
  }

  return (
    <CustomForm open={open} onOpenChange={onOpenChange} title={isEdit ? 'Editar Movimento' : 'Nova movimentação'} onSubmit={submit}>
      <>
        <CustomSelect
          name="type"
          label="Tipo"
          value={shared.type}
          onChange={(v) => changeShared('type', v as any)}
          options={[{ value: 'IN', label: 'Entrada' }, { value: 'OUT', label: 'Saída' }, { value: 'ADJUSTMENT', label: 'Ajuste' }]}
        />
        {!isEdit ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Itens</label>
              <button type="button" className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm hover:bg-accent" onClick={() => setItems((arr) => [...arr, { product_id: '', product_label: '', qty: 1 }])}>
                <Plus className="size-4" /> Adicionar
              </button>
            </div>
            <div className="grid gap-2">
              {items.map((row, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_96px_36px] items-end gap-2">
                  <CustomSelect
                    name={`product_${idx}`}
                    label={idx === 0 ? 'Produto' : undefined}
                    placeholder="Busque por SKU ou nome"
                    value={row.product_id}
                    options={row.product_id && row.product_label && !options.some(o => o.value === row.product_id)
                      ? [{ value: row.product_id, label: row.product_label }, ...options]
                      : options}
                    onChange={(v) => {
                      const opt = options.find(o => o.value === v)
                      setItems((arr) => arr.map((r, i) => i === idx ? { ...r, product_id: v, product_label: opt?.label ?? '' } : r))
                    }}
                    searchable
                    onSearch={(q) => void searchProducts(q)}
                    loading={loading}
                    emptyMessage="Nenhum produto encontrado"
                    className="w-full"
                    onOpenChange={(open) => { if (open && options.length === 0) void searchProducts('') }}
                  />
                  <CustomInput
                    name={`qty_${idx}`}
                    label={idx === 0 ? 'Quantidade' : undefined}
                    value={String(row.qty)}
                    onChange={(v) => setItems((arr) => arr.map((r, i) => i === idx ? { ...r, qty: Number(v.replace(/[^0-9-]/g, '')) || 0 } : r))}
                  />
                  <button type="button" className="mb-[2px] inline-flex items-center justify-center rounded-md border p-2 text-muted-foreground hover:bg-accent" onClick={() => setItems((arr) => arr.filter((_, i) => i !== idx))} aria-label="Remover linha">
                    <Trash2 className="size-4" />
                  </button>
                  {errors.rows?.[idx] && (
                    <div className="col-span-3 -mt-1 text-xs text-destructive">
                      {(errors.rows[idx].product_id || errors.rows[idx].qty) ? 'Preencha produto e quantidade válidos' : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <CustomSelect
              name="product_id"
              label="Produto"
              placeholder="Busque por SKU ou nome"
              value={single.product_id}
              options={options}
              onChange={(v) => { changeSingle('product_id', v); const opt = options.find(o => o.value === v); changeSingle('product_label', opt?.label ?? ''); }}
              searchable
              onSearch={(q) => void searchProducts(q)}
              loading={loading}
              emptyMessage="Nenhum produto encontrado"
              className="w-full"
              onOpenChange={(open) => { if (open && options.length === 0) void searchProducts('') }}
            />
            <CustomInput name="qty" label="Quantidade" value={String(single.qty)} onChange={(v) => changeSingle('qty', Number(v.replace(/[^0-9-]/g, '')) || 0)} />
          </>
        )}
        <div className="grid gap-1">
          <label className="text-sm font-medium" htmlFor="reason">Motivo</label>
          <Textarea id="reason" value={shared.reason} onChange={(e) => changeShared('reason', e.target.value)} placeholder="Descreva o motivo desta movimentação" />
        </div>
        <CustomDatePicker label="Data" value={shared.occurred_at} onChange={(v) => changeShared('occurred_at', v)} />
      </>
    </CustomForm>
  )
}
