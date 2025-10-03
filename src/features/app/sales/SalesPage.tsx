import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import CustomSelect from '@/components/custom/Input/CustomSelect'
import { apiProductSearch, apiInventory, apiCash } from '@/lib/api'
import { formatBRL, parseBRL } from '@/lib/format'


export default function SalesPage() {
  const [open, setOpen] = useState(true)
  const [options, setOptions] = useState<{ value: string; label: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<{ product_id: string; qty: number; unit_price: number; customer_id?: string | null; method: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER' }>({ product_id: '', qty: 1, unit_price: 0, method: 'CASH' })

  useEffect(() => {
    // preload products
    (async () => {
      const data = await apiProductSearch.search('')
      setOptions(data.map((p: any) => ({ value: p.id, label: `${p.sku ?? ''} · ${p.name}` })))
    })()
  }, [])

  function change<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: val }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.product_id) return toast.error('Selecione um produto')
    if (Number(form.qty) <= 0) return toast.error('Quantidade inválida')
    if (Number(form.unit_price) <= 0) return toast.error('Preço inválido')
    setLoading(true)
    try {
      // 1) baixa no estoque
      await apiInventory.create({ product_id: form.product_id, type: 'OUT', qty: Number(form.qty), reason: 'Venda direta' })
      // 2) caixa (entrada)
      // tenta detectar sessão aberta
      const session = await (async () => {
        try { const s = await (await import('@/lib/api')).apiCash.getOpenSession(); return s } catch { return null } 
      })()
      if (!session?.id) toast.message('Sem caixa aberto', { description: 'A venda foi registrada no estoque, mas não há caixa aberto para lançar a entrada.' })
      else await apiCash.addIncome({ cash_session_id: session.id, amount: Number(form.qty) * Number(form.unit_price), method: form.method, notes: 'Venda direta' })
      toast.success('Venda registrada')
      setOpen(false)
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao registrar venda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="max-w-2xl">
      <CustomForm open={open} onOpenChange={setOpen} title="Nova venda" onSubmit={submit} submitLabel={loading ? 'Salvando...' : 'Registrar venda'} submitDisabled={loading}>
        <>
          <CustomSelect name="product" label="Produto" value={form.product_id} onChange={(v) => change('product_id', v)} options={options} searchable onSearch={async (q) => {
            const data = await apiProductSearch.search(q)
            setOptions(data.map((p: any) => ({ value: p.id, label: `${p.sku ?? ''} · ${p.name}` })))
          }} />
          <div className="grid md:grid-cols-3 gap-4">
            <CustomInput name="qty" label="Quantidade" value={String(form.qty)} onChange={(v) => change('qty', Number(v.replace(/\D/g, '')) || 0)} />
            <CustomInput name="price" label="Preço unitário" value={formatBRL(form.unit_price)} onChange={(v) => change('unit_price', parseBRL(v))} />
            <CustomSelect name="method" label="Forma de pagamento" value={form.method} onChange={(v) => change('method', v as any)} options={[{ value: 'CASH', label: 'Dinheiro' }, { value: 'CARD', label: 'Cartão' }, { value: 'PIX', label: 'PIX' }, { value: 'TRANSFER', label: 'Transferência' }]} />
          </div>
          {/* Cliente opcional pode ser adicionado depois via busca; guardamos o id quando estiver disponível */}
        </>
      </CustomForm>
    </section>
  )
}
