import { useEffect, useState } from 'react'
import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomCheckbox from '@/components/custom/Input/CustomCheckbox'
import { Textarea } from '@/components/ui/textarea'
import CustomInputGroup from '@/components/custom/Input/CustomInputGroup'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export type SupplierFormProps = {
  open: boolean
  onOpenChange?: (open: boolean) => void
  initial?: { id?: string; name?: string; email?: string | null; phone?: string | null; notes?: string | null; is_active?: boolean; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null }
  loading?: boolean
  onSubmit: (data: { name: string; email?: string | null; phone?: string | null; notes?: string | null; is_active?: boolean; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null }) => Promise<void>
}

export function SupplierForm({ open, onOpenChange, initial, loading, onSubmit }: SupplierFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    notes: initial?.notes ?? '',
    is_active: initial?.is_active ?? true,
    cep: initial?.cep ?? '',
    street: initial?.street ?? '',
    number: initial?.number ?? '',
    complement: initial?.complement ?? '',
    neighborhood: initial?.neighborhood ?? '',
    city: initial?.city ?? '',
    state: initial?.state ?? '',
  })
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({})

  useEffect(() => {
    setForm({
      name: initial?.name ?? '',
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
      notes: initial?.notes ?? '',
      is_active: initial?.is_active ?? true,
      cep: initial?.cep ?? '',
      street: initial?.street ?? '',
      number: initial?.number ?? '',
      complement: initial?.complement ?? '',
      neighborhood: initial?.neighborhood ?? '',
      city: initial?.city ?? '',
      state: initial?.state ?? '',
    })
  }, [initial?.name, initial?.email, initial?.phone, initial?.notes, initial?.is_active, initial?.cep, initial?.street, initial?.number, initial?.complement, initial?.neighborhood, initial?.city, initial?.state])

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field in errors) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { name?: string; email?: string; phone?: string } = {}
    if (!form.name || !form.name.trim()) newErrors.name = 'Nome é obrigatório'
    if (!form.email || !form.email.trim()) {
      newErrors.email = 'E-mail é obrigatório'
    } else {
      const emailOk = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(form.email)
      if (!emailOk) newErrors.email = 'E-mail inválido'
    }
    if (!form.phone || !form.phone.trim()) newErrors.phone = 'Telefone é obrigatório'

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors)
      return
    }

    await onSubmit({
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      notes: form.notes || null,
      is_active: !!form.is_active,
      cep: form.cep || null,
      street: form.street || null,
      number: form.number || null,
      complement: form.complement || null,
      neighborhood: form.neighborhood || null,
      city: form.city || null,
      state: form.state || null,
    })
  }

  const isEditing = !!initial?.id

  // masks
  const maskCEP = (raw: string) => raw.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d{0,3})/, (_, p1, p2) => (p2 ? `${p1}-${p2}` : p1))
  const maskPhone = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 10) return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_m, a, b, c) => `${a ? `(${a}${a.length === 2 ? ')' : ''}` : ''}${b ? ` ${b}` : ''}${c ? `-${c}` : ''}`)
    return d.replace(/(\d{0,2})(\d{0,5})(\d{0,4}).*/, (_m, a, b, c) => `${a ? `(${a}${a.length === 2 ? ')' : ''}` : ''}${b ? ` ${b}` : ''}${c ? `-${c}` : ''}`)
  }

  async function lookupCep() {
    const cepDigits = (form.cep || '').replace(/\D/g, '')
    if (cepDigits.length !== 8) {
      toast.error('CEP inválido. Use 8 dígitos.')
      return
    }
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`)
      if (!res.ok) throw new Error('Falha ao buscar CEP')
      const data = await res.json()
      if (data?.erro) { toast.error('CEP não encontrado'); return }
      setForm((prev) => ({
        ...prev,
        street: data.logradouro ?? prev.street,
        neighborhood: data.bairro ?? prev.neighborhood,
        city: data.localidade ?? prev.city,
        state: (data.uf ?? prev.state)?.toUpperCase()?.slice(0, 2),
        complement: data.complemento ?? prev.complement,
      }))
      toast.success('Endereço preenchido pelo CEP')
    } catch (e: any) {
      toast.error(e?.message ?? 'Não foi possível buscar o CEP')
    }
  }

  return (
    <CustomForm open={open} onOpenChange={onOpenChange} title={isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'} onSubmit={handleSubmit}>
      <>
        <CustomInputGroup>
          <div className="grid gap-4">
            <CustomInput name="name" label="Nome" value={form.name} onChange={(v) => handleChange('name', v)} disabled={loading} required error={errors.name} />
            <div className="grid md:grid-cols-2 gap-4">
              <CustomInput name="email" label="E-mail" value={form.email} onChange={(v) => handleChange('email', v)} disabled={loading} required error={errors.email} />
              <CustomInput name="phone" label="Telefone" value={form.phone} onChange={(v) => handleChange('phone', v)} disabled={loading} required error={errors.phone} mask={maskPhone} />
            </div>
            <CustomCheckbox name="is_active" value={!!form.is_active} label="Ativo" onChange={(v) => handleChange('is_active', v)} />
          </div>
        </CustomInputGroup>

        <Separator className="my-2" />

        {/* Observações acima do Endereço */}
        <CustomInputGroup label="Observações">
          <Textarea id="notes" value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Notas do fornecedor" />
        </CustomInputGroup>

        <Separator className="my-2" />

        <CustomInputGroup label="Endereço">
          {/* Row 1: CEP + Número (máximo 2 por linha) */}
          <div className="grid md:grid-cols-2 gap-4">
            <CustomInput
              name="cep"
              label="CEP"
              value={form.cep}
              onChange={(v) => handleChange('cep', v)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void lookupCep() } }}
              mask={maskCEP}
            />
            <CustomInput name="number" label="Número" value={form.number} onChange={(v) => handleChange('number', v)} />
          </div>
          {/* Row 2: Street full width */}
          <div className="grid gap-4">
            <CustomInput name="street" label="Endereço" value={form.street} onChange={(v) => handleChange('street', v)} />
          </div>
          {/* Row 3: Bairro + Cidade */}
          <div className="grid md:grid-cols-2 gap-4">
            <CustomInput name="neighborhood" label="Bairro" value={form.neighborhood} onChange={(v) => handleChange('neighborhood', v)} />
            <CustomInput name="city" label="Cidade" value={form.city} onChange={(v) => handleChange('city', v)} />
          </div>
          {/* Row 4: UF + Complemento */}
          <div className="grid md:grid-cols-[1fr_auto] gap-4">
            <CustomInput name="state" label="UF" value={form.state} onChange={(v) => handleChange('state', v.toUpperCase().slice(0, 2))} />
            <CustomInput name="complement" label="Complemento" value={form.complement} onChange={(v) => handleChange('complement', v)} />
          </div>
        </CustomInputGroup>

        {/* Observações já movido acima */}
      </>
    </CustomForm>
  )
}
