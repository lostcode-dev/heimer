import { useEffect, useState } from 'react'
import { z } from '../../../lib/validation'
import { apiOrders } from '../../../lib/api'
import { useNavigate } from 'react-router-dom'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'

const draftKey = 'new-order-draft'

const schema = z.object({
    customer_id: z.string().min(1, { message: 'Selecione um cliente' }),
    problem_description: z.string().min(1, { message: 'Descrição obrigatória' }),
    labor_price: z.coerce.number().min(0).default(0),
})

type FormState = z.infer<typeof schema>

export default function NewOrderPage() {
    const navigate = useNavigate()
    const [form, setForm] = useState<FormState>({ customer_id: '', problem_description: '', labor_price: 0 })
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const s = localStorage.getItem(draftKey)
        if (s) setForm({ ...form, ...JSON.parse(s) })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        localStorage.setItem(draftKey, JSON.stringify(form))
    }, [form])

    async function submit() {
        setError(null)
        const parsed = schema.safeParse(form)
        if (!parsed.success) {
            const flat = parsed.error.flatten()
            const first = flat.formErrors[0] || Object.values(flat.fieldErrors)[0]?.[0]
            setError(first || 'Erro de validação')
            return
        }
        setSaving(true)
        try {
            const order = await apiOrders.create(parsed.data)
            localStorage.removeItem(draftKey)
            navigate(`/orders/${order.id}`)
        } catch (e: any) {
            setError(e?.message ?? 'Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-semibold">Nova Ordem</h2>
            <Card className="p-4 space-y-3">
                <div>
                    <Label htmlFor="customer">Cliente</Label>
                    <Input
                        id="customer"
                        placeholder="ID do cliente (exemplo)"
                        value={form.customer_id}
                        onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                    />
                </div>
                <div>
                    <Label htmlFor="problem">Descrição do problema</Label>
                    <Textarea
                        id="problem"
                        placeholder="Ex.: Tela quebrada"
                        value={form.problem_description}
                        onChange={(e) => setForm({ ...form, problem_description: e.target.value })}
                    />
                </div>
                <div>
                    <Label htmlFor="labor">Mão de obra (R$)</Label>
                    <Input
                        id="labor"
                        type="number"
                        value={form.labor_price}
                        onChange={(e) => setForm({ ...form, labor_price: Number(e.target.value) })}
                    />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                    <Button onClick={submit} disabled={saving}>Salvar</Button>
                    <Button variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
                </div>
                <p className="text-xs text-slate-500">Rascunho salvo automaticamente para uso offline.</p>
            </Card>
        </section>
    )
}
