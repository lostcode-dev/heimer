import { useEffect, useState } from 'react'
import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomCheckbox from '@/components/custom/Input/CustomCheckbox'
import CustomDatePicker from '@/components/custom/Input/CustomDatePicker'
import { Textarea } from '@/components/ui/textarea'

export type CustomerFormProps = {
  open: boolean
  onOpenChange?: (open: boolean) => void
  initial?: { id?: string; full_name?: string; email?: string | null; phone?: string | null; notes?: string | null; is_active?: boolean; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null; birth_date?: string | null }
  loading?: boolean
  onSubmit: (data: { full_name: string; email?: string | null; phone?: string | null; notes?: string | null; is_active?: boolean; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null; birth_date?: string | null }) => Promise<void>
}

export function CustomerForm({ open, onOpenChange, initial, loading, onSubmit }: CustomerFormProps) {
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? '',
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
    birth_date: initial?.birth_date ?? '',
  })
  const [errors, setErrors] = useState<{ full_name?: string; email?: string; phone?: string }>({})

  useEffect(() => {
    setForm({
      full_name: initial?.full_name ?? '',
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
      birth_date: initial?.birth_date ?? '',
    })
  }, [
    initial?.full_name, initial?.email, initial?.phone, initial?.notes, initial?.is_active,
    initial?.cep, initial?.street, initial?.number, initial?.complement,
    initial?.neighborhood, initial?.city, initial?.state, initial?.birth_date,
  ])

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear field error on change
    if (field in errors) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Basic validations
    const newErrors: { full_name?: string; email?: string; phone?: string } = {}
    if (!form.full_name || !form.full_name.trim()) newErrors.full_name = 'Nome é obrigatório'
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
      full_name: form.full_name,
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
      birth_date: form.birth_date ? new Date(form.birth_date).toISOString() : null,
    })
  }

  const isEditing = !!initial?.id

  // Masks
  const maskCEP = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    return digits.replace(/(\d{5})(\d{0,3})/, (_, p1, p2) => (p2 ? `${p1}-${p2}` : p1))
  }
  const maskPhone = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 10) {
      // (00) 0000-0000
      return d
        .replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_match, a, b, c) => {
          let out = ''
          if (a) out += `(${a}` + (a.length === 2 ? ')' : '')
          if (b) out += (a ? ' ' : '') + b
          if (c) out += (b.length ? '-' : '') + c
          return out
        })
    }
    // (00) 00000-0000
    return d
      .replace(/(\d{0,2})(\d{0,5})(\d{0,4}).*/, (_match, a, b, c) => {
        let out = ''
        if (a) out += `(${a}` + (a.length === 2 ? ')' : '')
        if (b) out += (a ? ' ' : '') + b
        if (c) out += (b.length ? '-' : '') + c
        return out
      })
  }

  return (
    <CustomForm
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Cliente' : 'Novo Cliente'}
      onSubmit={handleSubmit}
    >
      <>
        <CustomInput
          name="full_name"
          label="Nome"
          value={form.full_name}
          onChange={(v) => handleChange('full_name', v)}
          disabled={loading}
          required
          error={errors.full_name}
        />
        <CustomInput
          name="email"
          label="E-mail"
          value={form.email}
          onChange={(v) => handleChange('email', v)}
          disabled={loading}
          required
          error={errors.email}
        />
        <CustomInput
          name="phone"
          label="Telefone"
          value={form.phone}
          onChange={(v) => handleChange('phone', v)}
          disabled={loading}
          required
          error={errors.phone}
          mask={maskPhone}
        />

        <CustomDatePicker
          name="birth_date"
          label="Data de nascimento"
          value={form.birth_date}
          onChange={(v) => handleChange('birth_date', v)}
          disabled={loading}
        />

        <CustomInput
          name="cep"
          label="CEP"
          value={form.cep}
            onChange={(v) => handleChange('cep', v)}
            mask={maskCEP}
          instruction="Digite o CEP e pressione Enter para buscar"
          onKeyDown={async (e) => {
              const onlyDigits = form.cep.replace(/\D/g, '')
              if (e.key === 'Enter' && onlyDigits && onlyDigits.length === 8) {
              try {
                  const res = await fetch(`https://viacep.com.br/ws/${onlyDigits}/json/`)
                const data = await res.json()
                if (!data.erro) {
                  setForm((prev) => ({
                    ...prev,
                    street: data.logradouro || prev.street,
                    neighborhood: data.bairro || prev.neighborhood,
                    city: data.localidade || prev.city,
                    state: data.uf || prev.state,
                  }))
                }
              } catch { }
            }
          }}
          disabled={loading}
        />

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <CustomInput
              name="street"
              label="Endereço"
              value={form.street}
              onChange={(v) => handleChange('street', v)}
              disabled={loading}
            />
          </div>

          <CustomInput
            name="number"
            label="Número"
            value={form.number}
            onChange={(v) => handleChange('number', v)}
            disabled={loading}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <CustomInput
            name="neighborhood"
            label="Bairro"
            value={form.neighborhood}
            onChange={(v) => handleChange('neighborhood', v)}
            disabled={loading}
          />
          <CustomInput
            name="city"
            label="Cidade"
            value={form.city}
            onChange={(v) => handleChange('city', v)}
            disabled={loading}
          />
        </div>

        <CustomInput
          name="complement"
          label="Complemento"
          value={form.complement}
          onChange={(v) => handleChange('complement', v)}
          disabled={loading}
        />

        <div className="grid md:grid-cols-3 gap-4">
          <CustomInput
            name="state"
            label="UF"
            value={form.state}
            onChange={(v) => handleChange('state', v.toUpperCase().slice(0, 2))}
            disabled={loading}
          />

        </div>

        

        <CustomCheckbox
          name="is_active"
          value={!!form.is_active}
          label="Ativo"
          disabled={loading}
          onChange={(v) => handleChange('is_active', v)}
        />

        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="notes">Observações</label>
          <Textarea id="notes" value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Notas sobre o cliente" />
        </div>
      </>
    </CustomForm>
  )
}
