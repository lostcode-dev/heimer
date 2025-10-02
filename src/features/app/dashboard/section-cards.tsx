import { TrendingDownIcon, TrendingUpIcon, Info } from "lucide-react"
import { useEffect, useState } from "react"
import { apiDashboard } from "@/lib/api"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ revenue: number; completedOrders: number; newCustomers: number; avgTicket: number; prevRevenue?: number; prevCompletedOrders?: number; prevNewCustomers?: number; prevAvgTicket?: number }>({ revenue: 0, completedOrders: 0, newCustomers: 0, avgTicket: 0 })
  const currentMonth = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date()).toLowerCase()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await apiDashboard.getMonthlyOverview()
        if (!mounted) return
        setData(res)
      } catch (e: any) {
        if (!mounted) return
        console.warn('Falha ao carregar indicadores', e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const pct = (curr: number, prev?: number) => {
    if (prev === undefined) return null
    if (prev === 0) return curr > 0 ? 100 : 0
    return ((curr - prev) / Math.abs(prev)) * 100
  }

  const fmtPct = (value: number | null) => value === null ? '' : `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`

  const revenueDelta = pct(data.revenue, data.prevRevenue)
  const ordersDelta = pct(data.completedOrders, data.prevCompletedOrders)
  const customersDelta = pct(data.newCustomers, data.prevNewCustomers)
  const ticketDelta = pct(data.avgTicket, data.prevAvgTicket)

  const hasCmp = (curr: number, prev?: number) => {
    const p = prev ?? 0
    return !(curr === 0 && p === 0)
  }

  const revenueHasCmp = hasCmp(data.revenue, data.prevRevenue)
  const ordersHasCmp = hasCmp(data.completedOrders, data.prevCompletedOrders)
  const customersHasCmp = hasCmp(data.newCustomers, data.prevNewCustomers)
  const ticketHasCmp = hasCmp(data.avgTicket, data.prevAvgTicket)

  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4  *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card ">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>
            <span className="inline-flex items-center gap-2">
              Faturamento ({currentMonth})
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground hover:text-foreground cursor-help inline-flex"><Info className="size-3.5" /></span>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>Comparativo do dia 1 ao final do mês passado, com o mês atual</TooltipContent>
              </Tooltip>
            </span>
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {loading ? (
              <Skeleton className="h-7 w-40" />
            ) : (
              data.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            )}
          </CardTitle>
          {!loading && revenueHasCmp && (
            <div className="absolute right-4 top-4">
              <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                {(revenueDelta ?? 0) >= 0 ? (
                  <TrendingUpIcon className="size-3" />
                ) : (
                  <TrendingDownIcon className="size-3" />
                )}
                {fmtPct(revenueDelta)}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Soma dos pagamentos recebidos</div>
          {loading ? (
            <Skeleton className="h-4 w-48" />
          ) : (
            <div className="text-muted-foreground">Mês anterior: {(data.prevRevenue ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          )}
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>
            <span className="inline-flex items-center gap-2">
              OS concluídas ({currentMonth})
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground hover:text-foreground cursor-help inline-flex"><Info className="size-3.5" /></span>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>Comparativo do dia 1 ao final do mês passado, com o mês atual</TooltipContent>
              </Tooltip>
            </span>
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              data.completedOrders.toLocaleString('pt-BR')
            )}
          </CardTitle>
          {!loading && ordersHasCmp && (
            <div className="absolute right-4 top-4">
              <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                {(ordersDelta ?? 0) >= 0 ? (
                  <TrendingUpIcon className="size-3" />
                ) : (
                  <TrendingDownIcon className="size-3" />
                )}
                {fmtPct(ordersDelta)}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">OS entregues no período</div>
          {loading ? (
            <Skeleton className="h-4 w-44" />
          ) : (
            <div className="text-muted-foreground">Mês anterior: {(data.prevCompletedOrders ?? 0).toLocaleString('pt-BR')} OS</div>
          )}
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>
            <span className="inline-flex items-center gap-2">
              Novos clientes ({currentMonth})
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground hover:text-foreground cursor-help inline-flex"><Info className="size-3.5" /></span>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>Comparativo do dia 1 ao final do mês passado, com o mês atual</TooltipContent>
              </Tooltip>
            </span>
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              data.newCustomers.toLocaleString('pt-BR')
            )}
          </CardTitle>
          {!loading && customersHasCmp && (
            <div className="absolute right-4 top-4">
              <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                {(customersDelta ?? 0) >= 0 ? (
                  <TrendingUpIcon className="size-3" />
                ) : (
                  <TrendingDownIcon className="size-3" />
                )}
                {fmtPct(customersDelta)}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Novos clientes criados no período</div>
          {loading ? (
            <Skeleton className="h-4 w-48" />
          ) : (
            <div className="text-muted-foreground">Mês anterior: {(data.prevNewCustomers ?? 0).toLocaleString('pt-BR')} clientes</div>
          )}
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>
            <span className="inline-flex items-center gap-2">
              Ticket Médio ({currentMonth})
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground hover:text-foreground cursor-help inline-flex"><Info className="size-3.5" /></span>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>Comparativo do dia 1 ao final do mês passado, com o mês atual</TooltipContent>
              </Tooltip>
            </span>
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {loading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              data.avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            )}
          </CardTitle>
          {!loading && ticketHasCmp && (
            <div className="absolute right-4 top-4">
              <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                {(ticketDelta ?? 0) >= 0 ? (
                  <TrendingUpIcon className="size-3" />
                ) : (
                  <TrendingDownIcon className="size-3" />
                )}
                {fmtPct(ticketDelta)}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Média por venda no período</div>
          {loading ? (
            <Skeleton className="h-4 w-52" />
          ) : (
            <div className="text-muted-foreground">Mês anterior: {(data.prevAvgTicket ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
