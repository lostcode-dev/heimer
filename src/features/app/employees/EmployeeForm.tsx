import { useEffect, useState } from 'react'
import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomInputGroup from '@/components/custom/Input/CustomInputGroup'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

type Initial = {
    id: string
    full_name?: string | null
    email: string
    phone?: string | null
    is_active?: boolean
    job_title?: string | null
    cpf?: string | null
    cep?: string | null
    street?: string | null
    number?: string | null
    complement?: string | null
    neighborhood?: string | null
    city?: string | null
    state?: string | null
    birth_date?: string | null
    hire_date?: string | null
    notes?: string | null
}

export function EmployeeForm({ open, onOpenChange, initial, onSubmit }: { open: boolean; onOpenChange?: (o: boolean) => void; initial?: Initial; onSubmit: (data: Omit<Initial, 'id'> & { password?: string }) => Promise<void> }) {
    const isEdit = Boolean(initial?.id)
    const [form, setForm] = useState({
        full_name: initial?.full_name ?? '',
        email: initial?.email ?? '',
        password: '',
        phone: initial?.phone ?? '',
        is_active: initial?.is_active ?? true,
        job_title: initial?.job_title ?? '',
        cpf: initial?.cpf ?? '',
        cep: initial?.cep ?? '',
        street: initial?.street ?? '',
        number: initial?.number ?? '',
        complement: initial?.complement ?? '',
        neighborhood: initial?.neighborhood ?? '',
        city: initial?.city ?? '',
        state: initial?.state ?? '',
        birth_date: initial?.birth_date?.slice(0, 10) ?? '',
        hire_date: initial?.hire_date?.slice(0, 10) ?? '',
        notes: initial?.notes ?? '',
    })
    const [errors, setErrors] = useState<{ full_name?: string; email?: string; password?: string }>({})

    useEffect(() => {
        setForm((f) => ({
            ...f,
            full_name: initial?.full_name ?? '',
            email: initial?.email ?? '',
            phone: initial?.phone ?? '',
            is_active: initial?.is_active ?? true,
            job_title: initial?.job_title ?? '',
            cpf: initial?.cpf ?? '',
            cep: initial?.cep ?? '',
            street: initial?.street ?? '',
            number: initial?.number ?? '',
            complement: initial?.complement ?? '',
            neighborhood: initial?.neighborhood ?? '',
            city: initial?.city ?? '',
            state: initial?.state ?? '',
            birth_date: initial?.birth_date?.slice(0, 10) ?? '',
            hire_date: initial?.hire_date?.slice(0, 10) ?? '',
            notes: initial?.notes ?? '',
            password: '',
        }))
    }, [initial?.full_name, initial?.email])

    function change<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm((p) => ({ ...p, [k]: v })); if (errors[k as keyof typeof errors]) setErrors((e) => ({ ...e, [k as keyof typeof errors]: undefined })) }

    function maskPhone(raw: string) {
        const d = raw.replace(/\D/g, '').slice(0, 11)
        if (d.length <= 10) return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_m, a, b, c) => `${a ? `(${a}${a.length === 2 ? ')' : ''}` : ''}${b ? ` ${b}` : ''}${c ? `-${c}` : ''}`)
        return d.replace(/(\d{0,2})(\d{0,5})(\d{0,4}).*/, (_m, a, b, c) => `${a ? `(${a}${a.length === 2 ? ')' : ''}` : ''}${b ? ` ${b}` : ''}${c ? `-${c}` : ''}`)
    }
    function maskCPF(raw: string) {
        const d = raw.replace(/\D/g, '').slice(0, 11)
        return d
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    function maskCEP(raw: string) {
        return raw.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d{0,3})/, (_m, p1, p2) => (p2 ? `${p1}-${p2}` : p1))
    }
    function isValidCPF(cpf: string) {
        if (!cpf || cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false
        let sum = 0
        for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i)
        let rev = 11 - (sum % 11)
        if (rev === 10 || rev === 11) rev = 0
        if (rev !== parseInt(cpf.charAt(9))) return false
        sum = 0
        for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i)
        rev = 11 - (sum % 11)
        if (rev === 10 || rev === 11) rev = 0
        return rev === parseInt(cpf.charAt(10))
    }
    async function lookupCep() {
        const digits = (form.cep || '').replace(/\D/g, '')
        if (digits.length !== 8) { toast.error('CEP inválido. Use 8 dígitos.'); return }
        try {
            const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
            if (!res.ok) throw new Error('Falha ao buscar CEP')
            const data = await res.json()
            if (data?.erro) { toast.error('CEP não encontrado'); return }
            setForm((f) => ({
                ...f,
                street: data.logradouro ?? f.street,
                neighborhood: data.bairro ?? f.neighborhood,
                city: data.localidade ?? f.city,
                state: (data.uf ?? f.state)?.toUpperCase()?.slice(0, 2),
                complement: data.complemento ?? f.complement,
            }))
            toast.success('Endereço preenchido pelo CEP')
        } catch (e: any) { toast.error(e?.message ?? 'Não foi possível buscar o CEP') }
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        const next: typeof errors = {}
        if (!form.email) next.email = 'Email é obrigatório'
        if (!isEdit && !form.password) next.password = 'Senha é obrigatória'
        // Validar CPF se informado
        const cpfDigits = (form.cpf || '').replace(/\D/g, '')
        if (form.cpf && cpfDigits.length > 0 && !isValidCPF(cpfDigits)) {
            next.full_name = next.full_name // no-op to keep type
            toast.error('CPF inválido')
            setErrors(next)
            return
        }
        setErrors(next)
        if (Object.values(next).some(Boolean)) return
        await onSubmit({
            full_name: form.full_name,
            email: form.email,
            password: isEdit ? undefined : form.password,
            phone: form.phone,
            is_active: form.is_active,
            job_title: form.job_title,
            cpf: form.cpf,
            cep: form.cep,
            street: form.street,
            number: form.number,
            complement: form.complement,
            neighborhood: form.neighborhood,
            city: form.city,
            state: form.state,
            birth_date: form.birth_date,
            hire_date: form.hire_date,
            notes: form.notes,
        })
    }

    return (
        <CustomForm open={open} onOpenChange={onOpenChange} title={isEdit ? 'Editar Funcionário' : 'Novo Funcionário'} onSubmit={submit}>
            <>
                <div className="grid gap-4">
                    <CustomInput name="full_name" label="Nome" value={form.full_name} onChange={(v) => change('full_name', v)} />
                    <div className="grid md:grid-cols-2 gap-4">
                        <CustomInput name="email" label="Email" value={form.email} onChange={(v) => change('email', v)} />
                        {!isEdit && (
                            <CustomInput name="password" label="Senha" type="password" value={form.password} onChange={(v) => change('password', v)} />
                        )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <CustomInput name="phone" label="Telefone" value={form.phone} onChange={(v) => change('phone', v)} mask={maskPhone} />
                        <CustomInput name="job_title" label="Cargo" value={form.job_title} onChange={(v) => change('job_title', v)} />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-3">
                            <Switch checked={form.is_active} onCheckedChange={(v) => change('is_active', v)} id="is_active" />
                            <label htmlFor="is_active" className="text-sm">Ativo</label>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <CustomInput name="cpf" label="CPF" value={form.cpf} onChange={(v) => change('cpf', v)} mask={maskCPF} />
                        <CustomInput name="birth_date" label="Nascimento" type="date" value={form.birth_date} onChange={(v) => change('birth_date', v)} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <CustomInput name="hire_date" label="Admissão" type="date" value={form.hire_date} onChange={(v) => change('hire_date', v)} />
                    </div>
                </div>

                <CustomInputGroup label="Endereço">
                    <div className="grid md:grid-cols-2 gap-4">
                        <CustomInput
                            name="cep"
                            label="CEP"
                            value={form.cep}
                            onChange={(v) => change('cep', v)}
                            mask={maskCEP}
                            onKeyDown={(e) => { if ((e as any).key === 'Enter') { e.preventDefault(); void lookupCep() } }}
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
                        <CustomInput name="state" label="UF" value={form.state} onChange={(v) => change('state', v.toUpperCase().slice(0, 2))} />
                        <CustomInput name="complement" label="Complemento" value={form.complement} onChange={(v) => change('complement', v)} />
                    </div>
                </CustomInputGroup>

                <CustomInputGroup label="Observações">
                    <Textarea id="notes" value={form.notes} onChange={(e) => change('notes', e.target.value)} placeholder="Notas internas" />
                </CustomInputGroup>
            </>
        </CustomForm>
    )
}

export default EmployeeForm
