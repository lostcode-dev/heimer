import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiOrders } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import NameWithAvatar from '@/components/common/NameWithAvatar'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, Circle, PackageCheck, Truck, XCircle, Smartphone, Wrench, NotebookPen, ArrowLeft, Image, FileText, PlusCircle, Pencil, Trash2 } from 'lucide-react'
import { formatBRL, formatDateTimeBR } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import * as htmlToImage from 'html-to-image';

// We'll import export libs dynamically to avoid type resolution errors if not installed yet

export default function OrderDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    (async () => {
      try {
        if (!id) return
        const data = await apiOrders.getById(id)
        setOrder(data)
        const ls = await apiOrders.listAuditLogs(id)
        setLogs(ls)
      } catch (e: any) {
        toast.error(e?.message ?? 'Falha ao carregar')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  async function exportPNG() {
    if (!printRef.current) return
    const dataUrl = await htmlToImage.toPng(printRef.current, { cacheBust: true })
    const link = document.createElement('a')
    link.download = `${order?.ticket_number || 'ordem'}.png`
    link.href = dataUrl
    link.click()
  }

  async function exportPDF() {
    if (!printRef.current) return
    const htmlToImage = await import('html-to-image')
    const { jsPDF } = await import('jspdf')
    const dataUrl = await htmlToImage.toPng(printRef.current, { cacheBust: true })
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgProps = pdf.getImageProperties(dataUrl)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`${order?.ticket_number || 'ordem'}.pdf`)
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="rounded-[14px] border bg-white p-4 text-sm text-slate-800 space-y-4">
          {/* Header skeleton */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="size-9 rounded-md" />
              <Skeleton className="size-9 rounded-md" />
              <Skeleton className="size-9 rounded-md" />
            </div>
          </div>

          {/* Customer/technician/due skeleton */}
          <div className="grid md:grid-cols-3 gap-4">
            {[0,1,2].map((i) => (
              <Card className="p-3" key={i}>
                <Skeleton className="h-3 w-24 mb-2" />
                <div className="flex items-center gap-2">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Devices skeleton */}
          <Card className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="mt-1 grid md:grid-cols-2 gap-2">
              {[0,1].map((i) => (
                <div key={i} className="rounded border p-2 space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-3 w-52" />
                </div>
              ))}
            </div>
          </Card>

          {/* Problem/diagnostics/executed skeleton */}
          <Card className="p-3 space-y-3">
            {[0,1,2,3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </Card>

          {/* Items table skeleton */}
          <Card className="p-3">
            <Skeleton className="h-4 w-24 mb-2" />
            <div className="space-y-2">
              {[0,1,2,3,4].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </Card>

          {/* Totals skeleton */}
          <Card className="p-3">
            <Skeleton className="h-4 w-24 mb-2" />
            <div className="grid md:grid-cols-4 gap-2">
              {[0,1,2,3].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          </Card>
        </div>

        {/* History skeleton */}
        <Card className="p-4">
          <Skeleton className="h-4 w-24 mb-3" />
          <div className="space-y-2">
            {[0,1,2,3].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </Card>
      </section>
    )
  }
  if (!order) return <div>Não encontrado</div>

  return (
    <section className="space-y-4">

      <div ref={printRef} className="rounded-[14px] border bg-white p-4 text-sm text-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Ticket {order.ticket_number}</div>
            <div className="text-xs text-muted-foreground">Criada em {formatDateTimeBR(order.created_at)}</div>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const s = order.status as string
              let cls = 'bg-gray-200 text-gray-800'
              let Icon: any = Circle
              const map: Record<string, string> = { OPEN: 'Aberta', IN_PROGRESS: 'Em andamento', AWAITING_PARTS: 'Aguardando peças', READY: 'Pronta', DELIVERED: 'Entregue', CANCELLED: 'Cancelada' }
              if (s === 'OPEN') { cls = 'bg-blue-100 text-blue-800'; Icon = Circle }
              else if (s === 'IN_PROGRESS') { cls = 'bg-amber-100 text-amber-800'; Icon = PackageCheck }
              else if (s === 'AWAITING_PARTS') { cls = 'bg-purple-100 text-purple-800'; Icon = AlertTriangle }
              else if (s === 'READY') { cls = 'bg-emerald-100 text-emerald-800'; Icon = CheckCircle2 }
              else if (s === 'DELIVERED') { cls = 'bg-sky-100 text-sky-800'; Icon = Truck }
              else if (s === 'CANCELLED') { cls = 'bg-rose-100 text-rose-800'; Icon = XCircle }
              return (
                <Badge variant="outline" className={`gap-1.5 border-transparent ${cls}`}>
                  <Icon className="size-3.5" /> {map[s] ?? s}
                </Badge>
              )
            })()}

            <Button variant="outline" size="icon" onClick={() => navigate(-1)} title="Voltar" aria-label="Voltar">
              <ArrowLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={exportPNG} title="Exportar PNG" aria-label="Exportar PNG">
              <Image className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={exportPDF} title="Exportar PDF" aria-label="Exportar PDF">
              <FileText className="size-4" />
            </Button>
          </div>
        </div>

        {/* Customer and technician */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-3">
            <div>
              <div className="text-xs text-muted-foreground mb-2">Cliente</div>
              <NameWithAvatar name={order.customer?.full_name ?? '-'} phone={order.customer?.phone ?? undefined} />
              {order.customer?.email && <div className="text-xs text-muted-foreground mt-1">{order.customer.email}</div>}
            </div>
          </Card>
          <Card className="p-3">
            <div>
              <div className="text-xs text-muted-foreground">Técnico</div>
              <div className="flex items-center gap-2 mt-2"><Wrench className="size-3.5 text-muted-foreground" /> {(order.technician?.full_name ?? order.technician_user?.full_name) || '—'}</div>
              {order.technician?.phone && <div className="text-xs text-muted-foreground mt-1">{order.technician.phone}</div>}
            </div>
          </Card>
          <Card className="p-3">
            <div>
              <div className="text-xs text-muted-foreground">Previsão de Entrega</div>
              <div className='mt-2'>
                {order.due_date ? (() => {
                  const v: string = order.due_date
                  const dt = v.length <= 10 ? new Date(`${v}T00:00:00`) : new Date(v)
                  return formatDateTimeBR(dt)
                })() : '—'}
              </div>
            </div>
          </Card>
        </div>

        {/* Devices */}
        <Card className="p-3">
          <div>
            <div className="font-medium flex items-center gap-2"><Smartphone className="size-4" /> Equipamentos</div>
            {(order.devices?.length ?? 0) === 0 ? (
              <div className="text-sm text-muted-foreground mt-1">Nenhum equipamento vinculado.</div>
            ) : (
              <div className="mt-2 grid md:grid-cols-2 gap-2">
                {order.devices.map((d: any, idx: number) => (
                  <div key={idx} className="rounded border p-2">
                    <div className="font-medium">{d.device?.brand} {d.device?.model}</div>
                    <div className="text-xs text-muted-foreground">IMEI/Série: {d.device?.imei || '—'}</div>
                    <div className="text-xs text-muted-foreground">Cor: {d.device?.color || '—'}</div>
                    {d.device?.notes && <div className="text-xs text-muted-foreground">Notas: {d.device?.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Problem/diagnostics/executed */}
        <Card className="p-3 space-y-3">
          <div>
            <div className="text-xs text-muted-foreground">Problema informado</div>
            <p className="whitespace-pre-wrap">{order.problem_description || '—'}</p>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Problema constatado (diagnóstico)</div>
            <p className="whitespace-pre-wrap">{order.diagnostics || '—'}</p>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Serviço executado</div>
            <p className="whitespace-pre-wrap">{order.executed_service || '—'}</p>
          </div>
          {order.notes && (
            <div>
              <div className="text-xs text-muted-foreground">Observações</div>
              <p className="whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </Card>

        {/* Items */}
        <Card className="p-3">
          <div className="font-medium flex items-center gap-2"><NotebookPen className="size-4" /> Itens</div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="px-2 py-1">Tipo</th>
                  <th className="px-2 py-1">Descrição</th>
                  <th className="px-2 py-1 w-20">Qtde</th>
                  <th className="px-2 py-1 w-28">Preço (R$)</th>
                  <th className="px-2 py-1 w-28">Total (R$)</th>
                </tr>
              </thead>
              <tbody>
                {(order.items ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-center text-muted-foreground">Sem itens.</td>
                  </tr>
                ) : (
                  order.items.map((it: any) => (
                    <tr key={it.id} className="border-t">
                      <td className="px-2 py-1">{it.kind === 'PRODUCT' ? 'Produto' : 'Serviço'}</td>
                      <td className="px-2 py-1">{it.description}</td>
                      <td className="px-2 py-1">{it.qty}</td>
                      <td className="px-2 py-1">{formatBRL(Number(it.unit_price || 0))}</td>
                      <td className="px-2 py-1">{formatBRL(Number(it.total || (Number(it.qty || 0) * Number(it.unit_price || 0))))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Totals */}
        <Card className="p-3">
          <div className="font-medium mb-1">Valores</div>
          <div className="grid md:grid-cols-4 gap-2">
            <div>Serviços: {formatBRL(Number(order.labor_price || 0))}</div>
            <div>Deslocamento: {formatBRL(Number(order.tax_amount || 0))}</div>
            <div>Desconto: {formatBRL(Number(order.discount_amount || 0))}</div>
            <div className="font-semibold">Total: {formatBRL(Number(order.total_amount || 0))}</div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="font-medium mb-2">Histórico</div>
        {logs.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sem eventos.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="px-2 py-1">Quando</th>
                  <th className="px-2 py-1">Quem</th>
                  <th className="px-2 py-1">Ação</th>
                  <th className="px-2 py-1">Campo</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Map of grouped logs by (created_at|actorId|action)
                  const fieldMap: Record<string, string> = {
                    status: 'Status',
                    diagnostics: 'Diagnóstico',
                    executed_service: 'Serviço executado',
                    labor_price: 'Serviço (mão de obra)',
                    discount_amount: 'Desconto',
                    tax_amount: 'Deslocamento',
                    assigned_to: 'Usuário atribuído',
                    technician_id: 'Técnico',
                    delivered_at: 'Entregue em',
                    notes: 'Observações',
                    problem_description: 'Problema informado',
                    device_id: 'Equipamento',
                    due_date: 'Previsão de entrega',
                    payment_method: 'Forma de pagamento',
                  }
                  type Group = { key: string; created_at: string; actor: any; action: string; fields: string[] }
                  const groups: Group[] = []
                  const index = new Map<string, number>()
                  for (const l of logs) {
                    const action = String(l.action || '').toUpperCase()
                    const actorId = l.actor?.id ?? ''
                    const key = `${l.created_at}|${actorId}|${action}`
                    const label = l.field ? (fieldMap[String(l.field)] ?? String(l.field)) : '-'
                    if (!index.has(key)) {
                      index.set(key, groups.length)
                      groups.push({ key, created_at: l.created_at, actor: l.actor, action, fields: label ? [label] : [] })
                    } else {
                      const idx = index.get(key)!
                      const arr = groups[idx].fields
                      if (label && !arr.includes(label)) arr.push(label)
                    }
                  }
                  return groups.map((g) => {
                    let cls = 'bg-gray-100 text-gray-800'
                    let Icon: any = NotebookPen
                    let actionLabel = g.action
                    if (g.action === 'CREATE') { cls = 'bg-emerald-100 text-emerald-800'; Icon = PlusCircle; actionLabel = 'Criada' }
                    else if (g.action === 'UPDATE') { cls = 'bg-amber-100 text-amber-800'; Icon = Pencil; actionLabel = 'Atualizada' }
                    else if (g.action === 'CANCEL') { cls = 'bg-rose-100 text-rose-800'; Icon = XCircle; actionLabel = 'Cancelada' }
                    else if (g.action === 'DELETE') { cls = 'bg-rose-100 text-rose-800'; Icon = Trash2; actionLabel = 'Removida' }
                    return (
                      <tr key={g.key} className="border-t">
                        <td className="px-2 py-1">{formatDateTimeBR(g.created_at)}</td>
                        <td className="px-2 py-1"><NameWithAvatar name={g.actor?.full_name ?? '-'} /></td>
                        <td className="px-2 py-1">
                          <Badge variant="outline" className={`gap-1.5 border-transparent ${cls}`}>
                            <Icon className="size-3.5" /> {actionLabel}
                          </Badge>
                        </td>
                        <td className="px-2 py-1">
                          {g.fields.length ? (
                            <div className="flex flex-wrap gap-1">
                              {g.fields.map((f) => (
                                <Badge key={f} variant="outline">{f}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                })()}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  )
}
