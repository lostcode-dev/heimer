"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { apiSales } from "@/lib/api"

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--chart-1))",
  },
  products: {
    label: "Produtos",
    color: "hsl(var(--chart-2))",
  },
  os: {
    label: "OS",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState<"7d" | "30d" | "90d">("30d")
  const [data, setData] = React.useState<Array<{ date: string; total: number; products: number; os: number }>>([])
  const [, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (isMobile) setTimeRange("7d")
  }, [isMobile])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const rows = await apiSales.getSalesTimeseries(timeRange)
        if (!mounted) return
        setData(rows)
      } catch (e) {
        console.warn('Falha ao carregar série de vendas', e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [timeRange])

  const filteredData = data

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Vendas</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">Total no período selecionado</span>
          <span className="@[540px]/card:hidden">Período selecionado</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v as "7d" | "30d" | "90d")}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="90d" className="h-8 px-2.5">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5">Últimos 30 dias</ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5">Últimos 7 dias</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as "7d" | "30d" | "90d") }>
            <SelectTrigger
              className="@[767px]/card:hidden flex w-40"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Últimos 3 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">Últimos 3 meses</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Últimos 30 dias</SelectItem>
              <SelectItem value="7d" className="rounded-lg">Últimos 7 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-total)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-total)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillProducts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-products)" stopOpacity={0.9} />
                <stop offset="95%" stopColor="var(--color-products)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillOS" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-os)" stopOpacity={0.9} />
                <stop offset="95%" stopColor="var(--color-os)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("pt-BR", { month: "short", day: "numeric" })
                  }}
                  indicator="dot"
                  formatter={(val, name) => (
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="text-foreground font-mono font-medium tabular-nums">{Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                  )}
                />
              }
            />
            <Area dataKey="total" type="natural" fill="url(#fillTotal)" stroke="var(--color-total)" />
            <Area dataKey="products" type="natural" fill="url(#fillProducts)" stroke="var(--color-products)" />
            <Area dataKey="os" type="natural" fill="url(#fillOS)" stroke="var(--color-os)" />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
