import { useEffect, useState } from 'react'
import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import { Separator } from '@/components/ui/separator'
import { formatBRL, parseBRL } from '@/lib/format'
import CustomListInput from '@/components/custom/Input/CustomListInput'
import SupplierListInput, { type SupplierItem } from './SupplierListInput'
import { apiProductSuppliers } from '@/lib/api'
import CustomInputGroup from '@/components/custom/Input/CustomInputGroup'

export type ProductFormProps = {
  open: boolean
  onOpenChange?: (open: boolean) => void
  initial?: { id?: string; sku?: string; name?: string; category?: string | null; unit_cost?: number; unit_price?: number; reorder_level?: number; categories?: string[] | null; tags?: string[] | null }
  loading?: boolean
  onSubmit: (data: { sku: string; name: string; category?: string | null; unit_cost?: number; unit_price: number; reorder_level?: number; categories?: string[]; tags?: string[] }) => Promise<void>
}

export function ProductForm({ open, onOpenChange, initial, loading, onSubmit }: ProductFormProps) {
  const [form, setForm] = useState({
    sku: initial?.sku ?? '',
    name: initial?.name ?? '',
    category: initial?.category ?? '',
    unit_cost: initial?.unit_cost ?? 0,
    unit_price: initial?.unit_price ?? 0,
    reorder_level: initial?.reorder_level ?? 0,
    categories: '' as string, // comma-separated (legacy internal state)
    tags: '' as string, // comma-separated (legacy internal state)
  })
  const [errors, setErrors] = useState<{ name?: string; sku?: string; unit_price?: string; unit_cost?: string; reorder_level?: string }>({})
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([])

  useEffect(() => {
    setForm({
      sku: initial?.sku ?? '',
      name: initial?.name ?? '',
      category: initial?.category ?? '',
      unit_cost: initial?.unit_cost ?? 0,
      unit_price: initial?.unit_price ?? 0,
      reorder_level: initial?.reorder_level ?? 0,
      categories: Array.isArray(initial?.categories) ? (initial!.categories as string[]).join(', ') : '',
      tags: Array.isArray(initial?.tags) ? (initial!.tags as string[]).join(', ') : '',
    })
  }, [initial?.sku, initial?.name, initial?.category, initial?.unit_cost, initial?.unit_price, initial?.reorder_level, Array.isArray(initial?.categories) ? initial?.categories?.join('|') : '', Array.isArray(initial?.tags) ? initial?.tags?.join('|') : ''])

  // Load suppliers on edit
  useEffect(() => {
    let active = true
    async function run() {
      if (!initial?.id) { setSuppliers([{ supplier_id: '' }]); return }
      try {
        const data = await apiProductSuppliers.listByProduct(initial.id)
        if (!active) return
        setSuppliers((data?.length ? data : [{ supplier_id: '' }]) as SupplierItem[])
      } catch {
        if (active) setSuppliers([{ supplier_id: '' }])
      }
    }
    run()
    return () => { active = false }
  }, [initial?.id])

  // Auto-generate a random SKU when creating a new product (only if empty)
  useEffect(() => {
    if (!initial?.id) {
      setForm((p) => {
        if (p.sku && p.sku.trim()) return p
        // Simple SKU: PROD-<6 uppercase alnum>
        const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
        return { ...p, sku: `P-${rand}` }
      })
    }
  }, [initial?.id])

  function change<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: val }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    // validations
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Nome é obrigatório'
    if (!form.sku.trim()) next.sku = 'SKU é obrigatório'
    if (Number(form.unit_price) <= 0) next.unit_price = 'Preço deve ser maior que 0'
    if (Number(form.unit_cost) < 0) next.unit_cost = 'Custo não pode ser negativo'
    if (Number(form.reorder_level) < 0) next.reorder_level = 'Nível de reposição não pode ser negativo'
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    // Share supplier list temporarily so parent page can persist after product save
    ;(window as any).__productSuppliersBuffer = suppliers.filter((s) => s.supplier_id)

    await onSubmit({
      sku: form.sku,
      name: form.name,
      // category removed from UI per request; keep sending null for now
      category: null,
      unit_cost: Number(form.unit_cost) || 0,
      unit_price: Number(form.unit_price) || 0,
      reorder_level: Number(form.reorder_level) || 0,
      categories: form.categories.split(',').map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
    })
    // Return suppliers alongside via a custom event? We'll rely on parent page to call apiProductSuppliers.replaceAll after create/update.
  }

  const isEditing = !!initial?.id

  return (
    <CustomForm open={open} onOpenChange={onOpenChange} title={isEditing ? 'Editar Produto' : 'Novo Produto'} onSubmit={submit}>
      <>
        {/* Identificação */}
        <div className="flex flex-col gap-4">
          <div className="grid gap-4">
            <CustomInput
              name="sku"
              label="SKU"
              instruction="Identificador único do produto (código interno)."
              value={form.sku}
              onChange={(v) => change('sku', v)}
              required
              disabled={loading}
              error={errors.sku}
            />
            <CustomInput name="name" label="Nome" value={form.name} onChange={(v) => change('name', v)} required disabled={loading} error={errors.name} />
          </div>
          {/* Categoria removida conforme solicitado */}
          <CustomListInput
            name="categories"
            label="Categorias"
            instruction="Use para agrupar produtos por temas (ex.: Acessórios, Eletrônicos)."
            values={form.categories ? form.categories.split(',').map((s) => s.trim()) : ['']}
            onChange={(arr) => change('categories', arr.join(', '))}
            placeholder="Adicionar categoria"
            disabled={loading}
          />
          <CustomListInput
            name="tags"
            label="Tags"
            instruction="Palavras-chave para facilitar a busca (ex.: gamer, oferta, premium)."
            values={form.tags ? form.tags.split(',').map((s) => s.trim()) : ['']}
            onChange={(arr) => change('tags', arr.join(', '))}
            placeholder="Adicionar tag"
            disabled={loading}
          />
        </div>

        <Separator className="my-2" />

        {/* Preços e Estoque (com label de seção) */}
        <CustomInputGroup label="Preços e Estoque">
          <div className="grid md:grid-cols-2 gap-4">
            <CustomInput
              name="unit_cost"
              label="Custo"
              instruction="Custo unitário do produto (sem impostos ou margem)."
              value={formatBRL(Number(form.unit_cost) || 0)}
              onChange={(v) => change('unit_cost', parseBRL(v))}
              error={errors.unit_cost}
            />
            <CustomInput
              name="unit_price"
              label="Preço"
              instruction="Preço de venda unitário ao cliente."
              value={formatBRL(Number(form.unit_price) || 0)}
              onChange={(v) => change('unit_price', parseBRL(v))}
              error={errors.unit_price}
            />
          </div>
          <div className="grid gap-4">
            <CustomInput
              name="reorder_level"
              label="Nível de Reposição"
              instruction="Quantidade mínima em estoque para disparar reposição."
              value={String(form.reorder_level)}
              onChange={(v) => change('reorder_level', Number(v.replace(/[^0-9]/g, '')) || 0)}
              error={errors.reorder_level}
            />
          </div>
        </CustomInputGroup>

        <Separator className="my-2" />

        {/* Fornecedores */}
        <SupplierListInput
          value={suppliers}
          onChange={setSuppliers}
        />
      </>
    </CustomForm>
  )
}
