import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { apiCompanies } from '@/lib/api'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomInputGroup from '@/components/custom/Input/CustomInputGroup'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

export default function CompanySettingsPage() {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [taxId, setTaxId] = useState('')
    const [website, setWebsite] = useState('')
    const [notes, setNotes] = useState('')
    const [cep, setCep] = useState('')
    const [street, setStreet] = useState('')
    const [number, setNumber] = useState('')
    const [complement, setComplement] = useState('')
    const [neighborhood, setNeighborhood] = useState('')
    const [city, setCity] = useState('')
    const [stateUf, setStateUf] = useState('')

    useEffect(() => {
        setLoading(true)
            ; (async () => {
                try {
                    const data = await apiCompanies.getMyCompany()
                    if (data) {
                        const d = data as any
                        setName(d.name ?? '')
                        setEmail(d.email ?? '')
                        setPhone(d.phone ?? '')
                        setTaxId(d.tax_id ?? '')
                        setWebsite(d.website ?? '')
                        setNotes(d.notes ?? '')
                        setCep(d.cep ?? '')
                        setStreet(d.street ?? '')
                        setNumber(d.number ?? '')
                        setComplement(d.complement ?? '')
                        setNeighborhood(d.neighborhood ?? '')
                        setCity(d.city ?? '')
                        setStateUf(d.state ?? '')
                    }
                } catch (e: any) {
                    toast.error(e?.message ?? 'Falha ao carregar empresa')
                } finally {
                    setLoading(false)
                }
            })()
    }, [])

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        // validations
        // CEP: if filled, must be 8 digits
        const cepDigits = (cep || '').replace(/\D/g, '')
        if (cep && cepDigits.length !== 8) {
            toast.error('CEP inválido. Use 8 dígitos (ex.: 01001-000).')
            return
        }
        // CPF/CNPJ validation if provided
        const taxDigits = (taxId || '').replace(/\D/g, '')
        if (taxId && !isValidCpfCnpj(taxDigits)) {
            toast.error('CPF/CNPJ inválido.')
            return
        }
        setLoading(true)
        try {
            await apiCompanies.upsertMyCompany({
                name,
                email,
                phone,
                tax_id: taxId,
                website,
                notes,
                cep,
                street,
                number,
                complement,
                neighborhood,
                city,
                state: stateUf,
            } as any)
            toast.success('Empresa atualizada')
        } catch (e: any) {
            toast.error(e?.message ?? 'Falha ao atualizar empresa')
        } finally {
            setLoading(false)
        }
    }

    // Helpers: masks/validation
    function maskCEP(raw: string) {
        return raw.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d{0,3})/, (_m, p1, p2) => (p2 ? `${p1}-${p2}` : p1))
    }

    function maskPhone(raw: string) {
        const d = raw.replace(/\D/g, '').slice(0, 11)
        if (d.length <= 10) return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_m, a, b, c) => `${a ? `(${a}${a.length === 2 ? ')' : ''}` : ''}${b ? ` ${b}` : ''}${c ? `-${c}` : ''}`)
        return d.replace(/(\d{0,2})(\d{0,5})(\d{0,4}).*/, (_m, a, b, c) => `${a ? `(${a}${a.length === 2 ? ')' : ''}` : ''}${b ? ` ${b}` : ''}${c ? `-${c}` : ''}`)
    }

    function maskTax(raw: string) {
        const d = raw.replace(/\D/g, '').slice(0, 14)
        if (d.length <= 11) {
            // CPF: 000.000.000-00
            return d
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        }

        // CNPJ: 00.000.000/0000-00
        return d
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    }

    function isValidCpfCnpj(digits: string) {
        if (digits.length === 11) return isValidCPF(digits)
        if (digits.length === 14) return isValidCNPJ(digits)
        return false
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

    function isValidCNPJ(cnpj: string) {
        if (!cnpj || cnpj.length !== 14 || /^([0-9])\1+$/.test(cnpj)) return false
        const calc = (base: string, factors: number[]) => {
            const sum = base.split('').reduce((acc, n, i) => acc + parseInt(n) * factors[i], 0)
            const mod = sum % 11
            return mod < 2 ? 0 : 11 - mod
        }
        const d1 = calc(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
        const d2 = calc(cnpj.slice(0, 12) + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
        return cnpj.endsWith(`${d1}${d2}`)
    }

    async function lookupCep() {
        const cepDigits = (cep || '').replace(/\D/g, '')
        if (cepDigits.length !== 8) {
            toast.error('CEP inválido. Use 8 dígitos.')
            return
        }
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`)
            if (!res.ok) throw new Error('Falha ao buscar CEP')
            const data = await res.json()
            if (data?.erro) { toast.error('CEP não encontrado'); return }
            setStreet(data.logradouro ?? street)
            setNeighborhood(data.bairro ?? neighborhood)
            setCity(data.localidade ?? city)
            setStateUf((data.uf ?? stateUf)?.toUpperCase()?.slice(0, 2))
            setComplement(data.complemento ?? complement)
            toast.success('Endereço preenchido pelo CEP')
        } catch (e: any) {
            toast.error(e?.message ?? 'Não foi possível buscar o CEP')
        }
    }

    return (
        <section className="flex flex-1 flex-col gap-4 my-4 md:gap-6 mx-4 md:mx-6">
            <Card className="max-w-3xl">
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-6">
                        <CustomInputGroup label="Dados da empresa">
                            <div className="grid gap-4">
                                <CustomInput name="name" label="Nome" value={name} onChange={setName} required />
                                <div className="grid md:grid-cols-2 gap-4">
                                    <CustomInput name="email" label="Email" value={email} onChange={setEmail} type="email" placeholder="contato@empresa.com" />
                                    <CustomInput name="phone" label="Telefone" value={phone} onChange={(v) => setPhone(v)} mask={maskPhone} placeholder="+55 11 99999-9999" />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <CustomInput name="tax_id" label="CPF/CNPJ" value={taxId} onChange={(v) => setTaxId(v)} mask={maskTax} placeholder="00.000.000/0000-00" />
                                    <CustomInput name="website" label="Website" value={website} onChange={setWebsite} placeholder="https://empresa.com" />
                                </div>
                            </div>
                        </CustomInputGroup>

                        <Separator />

                        <CustomInputGroup label="Endereço">
                            <div className="grid md:grid-cols-2 gap-4">
                                <CustomInput
                                    name="cep"
                                    label="CEP"
                                    value={cep}
                                    onChange={(v) => setCep(v)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void lookupCep() } }}
                                    mask={maskCEP}
                                    instruction="Digite o CEP e pressione Enter para buscar"
                                />
                                <CustomInput name="number" label="Número" value={number} onChange={setNumber} />
                            </div>
                            <div className="grid gap-4">
                                <CustomInput name="street" label="Endereço" value={street} onChange={setStreet} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <CustomInput name="neighborhood" label="Bairro" value={neighborhood} onChange={setNeighborhood} />
                                <CustomInput name="city" label="Cidade" value={city} onChange={setCity} />
                            </div>
                            <div className="grid md:grid-cols-[1fr_auto] gap-4">
                                <CustomInput name="state" label="UF" value={stateUf} onChange={(v) => setStateUf(v.toUpperCase().slice(0, 2))} />
                                <CustomInput name="complement" label="Complemento" value={complement} onChange={setComplement} />
                            </div>
                        </CustomInputGroup>

                        <Separator />

                        <CustomInputGroup label="Observações">
                            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas internas" />
                        </CustomInputGroup>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={loading}>{loading ? 'Salvando…' : 'Salvar alterações'}</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </section>
    )
}


