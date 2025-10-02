import { useEffect, useState } from 'react'
import { apiReminders } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CalendarDays, PackageOpen } from 'lucide-react'

type LowStock = { id: string; sku: string; name: string; stock_qty: number; reorder_level: number }
type Birthday = { id: string; full_name: string; birth_date: string; type: 'customer' | 'employee' | 'technician' }
type DueSoon = { id: string; ticket_number: string; customer_name: string; due_date: string; days_left: number }

export default function RemindersPage() {
    const [loading, setLoading] = useState(true)
    const [lowStock, setLowStock] = useState<LowStock[]>([])
    const [birthdays, setBirthdays] = useState<Birthday[]>([])
    const [dueSoon, setDueSoon] = useState<DueSoon[]>([])

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const [ls, b, ds] = await Promise.all([
                        apiReminders.getLowStock(),
                        apiReminders.getUpcomingBirthdays(14),
                        apiReminders.getOrdersDueSoon(3),
                    ])
                    if (!mounted) return
                    setLowStock(ls)
                    setBirthdays(b)
                    setDueSoon(ds)
                } catch (_e) {
                    // noop: could show a toast
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [])

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PackageOpen className="size-4 text-amber-600" /> Estoque baixo</CardTitle>
                    <CardDescription>Produtos no nível de reposição</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <ul className="space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <li key={i} className="flex items-center justify-between rounded-md border p-2">
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <div className="text-right space-y-1">
                                        <Skeleton className="h-5 w-28 rounded-md" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : lowStock.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum produto abaixo do mínimo.</p>
                    ) : (
                        <ul className="space-y-2">
                            {lowStock.map(p => (
                                <li key={p.id} className="flex items-center justify-between rounded-md border p-2">
                                    <div>
                                        <div className="font-medium">{p.name}</div>
                                        <div className="text-xs text-muted-foreground">SKU {p.sku}</div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="secondary">{p.stock_qty} em estoque</Badge>
                                        <div className="text-xs text-muted-foreground">Mín: {p.reorder_level}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>



            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertTriangle className="size-4 text-rose-600" /> OS próximas do prazo</CardTitle>
                    <CardDescription>Vencem em até 3 dias</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <ul className="space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <li key={i} className="flex items-center justify-between rounded-md border p-2">
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-36" />
                                    </div>
                                    <div className="text-right space-y-1">
                                        <Skeleton className="h-5 w-36 rounded-md" />
                                        <Skeleton className="h-3 w-28" />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : dueSoon.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhuma OS próxima do prazo.</p>
                    ) : (
                        <ul className="space-y-2">
                            {dueSoon.map(o => {
                                const d = new Date(o.due_date)
                                const label = d.toLocaleDateString('pt-BR', { dateStyle: 'medium' })
                                return (
                                    <li key={o.id} className="flex items-center justify-between rounded-md border p-2">
                                        <div>
                                            <div className="font-medium">{o.ticket_number}</div>
                                            <div className="text-xs text-muted-foreground">{o.customer_name}</div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={o.days_left < 0 ? 'destructive' : 'default'}>
                                                {o.days_left < 0 ? `${Math.abs(o.days_left)} dia(s) em atraso` : `Faltam ${o.days_left} dia(s)`}
                                            </Badge>
                                            <div className="text-xs text-muted-foreground">Prazo: {label}</div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CalendarDays className="size-4 text-emerald-600" /> Aniversários</CardTitle>
                    <CardDescription>Próximos 14 dias</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <ul className="space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <li key={i} className="flex items-center justify-between rounded-md border p-2">
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <Skeleton className="h-5 w-24 rounded-md" />
                                </li>
                            ))}
                        </ul>
                    ) : birthdays.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sem aniversários no período.</p>
                    ) : (
                        <ul className="space-y-2">
                            {birthdays.map(b => {
                                const d = new Date(b.birth_date)
                                const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
                                const typeLabel = b.type === 'customer' ? 'Cliente' : b.type === 'employee' ? 'Funcionário' : 'Técnico'
                                return (
                                    <li key={`${b.type}-${b.id}`} className="flex items-center justify-between rounded-md border p-2">
                                        <div>
                                            <div className="font-medium">{b.full_name}</div>
                                            <div className="text-xs text-muted-foreground">{typeLabel}</div>
                                        </div>
                                        <Badge className="shrink-0">{label}</Badge>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
