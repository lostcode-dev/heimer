import { useEffect, useState } from 'react'
import CustomForm from '@/components/custom/Input/CustomForm'
import CustomInput from '@/components/custom/Input/CustomInput'
import { apiCompanies } from '@/lib/api'
import { toast } from 'sonner'

export default function AdminCompanyPage() {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(true)
  const [initial, setInitial] = useState<{ id?: string; name?: string } | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const data = await apiCompanies.getMyCompany()
        setInitial(data)
      } catch (e: any) {
        toast.error(e?.message ?? 'Falha ao carregar empresa')
      }
    })()
  }, [])

  async function onSubmit(data: { name: string }) {
    setLoading(true)
    try {
      await apiCompanies.upsertMyCompany({ name: data.name })
      toast.success('Empresa atualizada')
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao salvar empresa')
    } finally { setLoading(false) }
  }

  return (
    <CustomForm open={open} onOpenChange={setOpen} title="Empresa" onSubmit={(e) => { e.preventDefault() }}>
      <CompanyForm initial={initial ?? undefined} loading={loading} onSubmit={onSubmit} />
    </CustomForm>
  )
}

function CompanyForm({ initial, loading, onSubmit }: { initial?: { id?: string; name?: string }, loading?: boolean, onSubmit: (data: { name: string }) => Promise<void> }) {
  const [form, setForm] = useState({ name: initial?.name ?? '' })
  useEffect(() => { setForm({ name: initial?.name ?? '' }) }, [initial?.name])
  return (
    <div className="grid gap-4">
      <CustomInput name="name" label="Nome da empresa" value={form.name} onChange={(v) => setForm({ name: v })} disabled={loading} />
      <div>
        <button type="button" onClick={() => void onSubmit({ name: form.name })} className="inline-flex h-9 items-center rounded-md bg-foreground px-3 text-background">Salvar</button>
      </div>
    </div>
  )
}
