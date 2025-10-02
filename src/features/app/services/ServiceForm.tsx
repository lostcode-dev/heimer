import { useEffect, useState } from 'react'
import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import { formatBRL, parseBRL } from '@/lib/format'
import CustomListInput from '@/components/custom/Input/CustomListInput'
import TechnicianListInput, { type TechnicianItem } from './TechnicianListInput'
import { apiServiceTechnicians } from '@/lib/api'
import { Separator } from '@/components/ui/separator'

export type ServiceFormProps = {
  open: boolean
  onOpenChange?: (open: boolean) => void
  initial?: { id?: string; sku?: string; name?: string; category?: string | null; unit_price?: number }
  loading?: boolean
  onSubmit: (data: { sku?: string; name: string; category?: string | null; unit_price: number; categories?: string[]; tags?: string[] }) => Promise<void>
}

export function ServiceForm({ open, onOpenChange, initial, loading, onSubmit }: ServiceFormProps) {
  const [form, setForm] = useState({
    sku: initial?.sku ?? '',
    name: initial?.name ?? '',
    unit_price: initial?.unit_price ?? 0,
    categories: '' as string,
    tags: '' as string,
  })
  const [errors, setErrors] = useState<{ name?: string; unit_price?: string }>({})
  const [technicians, setTechnicians] = useState<TechnicianItem[]>([])

  useEffect(() => {
    setForm({
      sku: initial?.sku ?? '',
      name: initial?.name ?? '',
      unit_price: initial?.unit_price ?? 0,
      categories: '',
      tags: '',
    })
    // reset technicians list when switching
    setTechnicians([{ technician_id: '' }])
  }, [initial?.sku, initial?.name, initial?.category, initial?.unit_price])

  // Load technicians on edit
  useEffect(() => {
    let active = true
    async function run() {
      if (!initial?.id) { setTechnicians([{ technician_id: '' }]); return }
      try {
        const data = await apiServiceTechnicians.list(initial.id)
        if (!active) return
        const list = (data ?? []).map((t: any) => ({ technician_id: t.technician_id as string }))
        setTechnicians(list.length ? list : [{ technician_id: '' }])
      } catch {
        if (active) setTechnicians([{ technician_id: '' }])
      }
    }
    run()
    return () => { active = false }
  }, [initial?.id])

  // Auto-generate a random SKU when creating a new service if empty
  useEffect(() => {
    if (!initial?.id) {
      setForm((p) => {
        if (p.sku && p.sku.trim()) return p
        const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
        return { ...p, sku: `SERV-${rand}` }
      })
    }
  }, [initial?.id])

  function change<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: val }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Nome é obrigatório'
    if (Number(form.unit_price) <= 0) next.unit_price = 'Preço deve ser maior que 0'
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    // Share technicians list temporarily so parent page can persist after service save
    ;(window as any).__serviceTechniciansBuffer = technicians.filter((t) => t.technician_id)

    await onSubmit({
      sku: form.sku || undefined,
      name: form.name,
      category: null,
      unit_price: Number(form.unit_price) || 0,
      categories: form.categories.split(',').map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
    })
  }

  const isEditing = !!initial?.id

  return (
    <CustomForm open={open} onOpenChange={onOpenChange} title={isEditing ? 'Editar Serviço' : 'Novo Serviço'} onSubmit={submit}>
      <>
        <div className="grid gap-4">
          <CustomInput
            name="sku"
            label="SKU"
            instruction="Identificador único do serviço (código interno)."
            value={form.sku}
            onChange={(v) => change('sku', v)}
            disabled={loading}
          />
          <CustomInput name="name" label="Nome" value={form.name} onChange={(v) => change('name', v)} required disabled={loading} error={errors.name} />
        </div>
        <div className="grid md:grid-cols-1 gap-4">
          <CustomInput
            name="unit_price"
            label="Preço"
            instruction="Preço de venda do serviço."
            value={formatBRL(Number(form.unit_price) || 0)}
            onChange={(v) => change('unit_price', parseBRL(v))}
            error={errors.unit_price}
          />
        </div>
        <CustomListInput
          name="categories"
          label="Categorias"
          instruction="Use para agrupar serviços por tipos (ex.: Mão de obra, Diagnóstico)."
          values={form.categories ? form.categories.split(',').map((s) => s.trim()) : ['']}
          onChange={(arr) => change('categories', arr.join(', '))}
          placeholder="Adicionar categoria"
          disabled={loading}
        />
        <CustomListInput
          name="tags"
          label="Tags"
          instruction="Palavras-chave para facilitar a busca (ex.: urgente, garantia)."
          values={form.tags ? form.tags.split(',').map((s) => s.trim()) : ['']}
          onChange={(arr) => change('tags', arr.join(', '))}
          placeholder="Adicionar tag"
          disabled={loading}
        />
        <Separator className="my-2" />
        <TechnicianListInput
          value={technicians}
          onChange={setTechnicians}
          disabled={loading}
        />
      </>
    </CustomForm>
  )
}
