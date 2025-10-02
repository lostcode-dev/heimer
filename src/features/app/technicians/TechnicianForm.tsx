import { useEffect, useState } from 'react'
import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomCheckbox from '@/components/custom/Input/CustomCheckbox'
import { Textarea } from '@/components/ui/textarea'
import CustomInputGroup from '@/components/custom/Input/CustomInputGroup'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export type TechnicianFormProps = {
  open: boolean
  onOpenChange?: (open: boolean) => void
  initial?: { id?: string; full_name?: string; email?: string | null; phone?: string | null; is_active?: boolean; notes?: string | null; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null }
  loading?: boolean
  onSubmit: (data: { full_name: string; email?: string | null; phone?: string | null; is_active?: boolean; notes?: string | null; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null }) => Promise<void>
}

export function TechnicianForm({ open, onOpenChange, initial, loading, onSubmit }: TechnicianFormProps) {
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    is_active: initial?.is_active ?? true,
    notes: initial?.notes ?? '',
    cep: initial?.cep ?? '',
    street: initial?.street ?? '',
    number: initial?.number ?? '',
    complement: initial?.complement ?? '',
    neighborhood: initial?.neighborhood ?? '',
    city: initial?.city ?? '',
    state: initial?.state ?? '',
  })
  const [errors, setErrors] = useState<{ full_name?: string }>({})

  useEffect(() => {
    setForm({
      full_name: initial?.full_name ?? '',
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
      is_active: initial?.is_active ?? true,
      notes: initial?.notes ?? '',
      cep: initial?.cep ?? '',
      street: initial?.street ?? '',
      number: initial?.number ?? '',
      complement: initial?.complement ?? '',
      neighborhood: initial?.neighborhood ?? '',
      city: initial?.city ?? '',
      state: initial?.state ?? '',
    })
  }, [initial?.full_name, initial?.email, initial?.phone, initial?.is_active, initial?.notes, initial?.cep, initial?.street, initial?.number, initial?.complement, initial?.neighborhood, initial?.city, initial?.state])

  function change<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: val }))
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!form.full_name.trim()) next.full_name = 'Nome é obrigatório'
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    await onSubmit({
      full_name: form.full_name,
      email: form.email || null,
      phone: form.phone || null,
      is_active: !!form.is_active,
      notes: form.notes || null,
      cep: form.cep || null,
      street: form.street || null,
      number: form.number || null,
      complement: form.complement || null,
      neighborhood: form.neighborhood || null,
      city: form.city || null,
      state: form.state || null,
    })
  }
  const maskCEP = (raw: string) => raw.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d{0,3})/, (_, p1, p2) => (p2 ? `${p1}-${p2}` : p1))
  const maskPhone = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 10) {
      // (00) 0000-0000
      return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_m, a, b, c) => {
        let out = ''
        if (a) out += `(${a}` + (a.length === 2 ? ')' : '')
        if (b) out += (a ? ' ' : '') + b
        if (c) out += (b.length ? '-' : '') + c
        return out
      })
    }
    // (00) 00000-0000
    return d.replace(/(\d{0,2})(\d{0,5})(\d{0,4}).*/, (_m, a, b, c) => {
      let out = ''
      if (a) out += `(${a}` + (a.length === 2 ? ')' : '')
      if (b) out += (a ? ' ' : '') + b
      if (c) out += (b.length ? '-' : '') + c
      return out
    })
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

  const isEditing = !!initial?.id

  return (
    <CustomForm open={open} onOpenChange={onOpenChange} title={isEditing ? 'Editar Técnico' : 'Novo Técnico'} onSubmit={submit}>
      <>
        <CustomInput name="full_name" label="Nome" value={form.full_name} onChange={(v) => change('full_name', v)} required disabled={loading} error={errors.full_name} />
        <div className="grid md:grid-cols-2 gap-4">
          <CustomInput name="email" label="E-mail" value={form.email} onChange={(v) => change('email', v)} disabled={loading} placeholder="contato@empresa.com" />
          <CustomInput name="phone" label="Telefone" value={form.phone} onChange={(v) => change('phone', v)} required disabled={loading} mask={maskPhone} placeholder="(00) 00000-0000"  />
        </div>
        <CustomCheckbox name="is_active" value={!!form.is_active} label="Ativo" disabled={loading} onChange={(v) => change('is_active', v)} />

        {/* Observações acima do Endereço */}
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="notes">Observações</label>
          <Textarea id="notes" value={form.notes} onChange={(e) => change('notes', e.target.value)} placeholder="Notas" />
        </div>

        <Separator className="my-2" />
        <CustomInputGroup label="Endereço">
          <div className="grid md:grid-cols-2 gap-4">
            <CustomInput
              name="cep"
              label="CEP"
              value={form.cep}
              onChange={(v) => change('cep', v)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void lookupCep() } }}
              mask={maskCEP}
              instruction="Digite o CEP e pressione Enter para buscar"
            />
            <CustomInput name="number" label="Número" value={form.number} onChange={(v) => change('number', v)} />
          </div>
          <div className="grid gap-4">
            <CustomInput name="street" label="Endereço" value={form.street} onChange={(v) => change('street', v)} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <CustomInput name="neighborhood" label="Bairro" value={form.neighborhood} onChange={(v) => change('neighborhood', v)} />
            <CustomInput name="city" label="Cidade" value={form.city} onChange={(v) => change('city', v)} />
          </div>
          <div className="grid md:grid-cols-[1fr_auto] gap-4">
            <CustomInput name="state" label="UF" value={form.state} onChange={(v) => change('state', v.toUpperCase().slice(0, 2))}  />
            <CustomInput name="complement" label="Complemento" value={form.complement} onChange={(v) => change('complement', v)} />
          </div>
        </CustomInputGroup>

        {/* Observações já movido acima */}
      </>
    </CustomForm>
  )
}
