"use client"

import { TrendingUp, DollarSign, Calendar } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"

interface SalesEvolutionData {
  date: string
  revenue: number
  count: number
}

interface SalesEvolutionChartProps {
  data: SalesEvolutionData[]
  brandColor?: string
  isLoading?: boolean
  dateRangeLabel?: string
}

export function SalesEvolutionChart({ data, brandColor = "#6366f1", isLoading = false, dateRangeLabel }: SalesEvolutionChartProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded mb-2" />
          <div className="h-4 w-64 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" style={{ color: brandColor }} />
            Evolução de Vendas ({dateRangeLabel || "Últimos 12 Meses"})
          </CardTitle>
          <CardDescription>Receita de vendas fechadas ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    )
  }

  // Transform data for chart display
  const chartData = data.map((item) => {
    const date = new Date(item.date)

    // Full format for tooltip: "Outubro de 2024"
    const monthLabelFull = date.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric"
    })
    const formattedLabelFull = monthLabelFull.charAt(0).toUpperCase() + monthLabelFull.slice(1)

    // Short format for X axis: "out. de 2024"
    const monthLabelShort = date.toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric"
    })

    return {
      month: formattedLabelFull,
      monthShort: monthLabelShort,
      revenue: item.revenue,
      count: item.count,
    }
  })

  const chartConfig = {
    revenue: {
      label: "Receita",
      color: brandColor,
    },
  } satisfies ChartConfig

  // Calculate total revenue and growth
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0)
  const avgMonthlyRevenue = totalRevenue / (chartData.length || 1)
  const totalDeals = chartData.reduce((sum, item) => sum + item.count, 0)

  // Calculate growth percentage (comparing first vs last month with revenue)
  const firstMonthWithRevenue = chartData.find(item => item.revenue > 0)
  const lastMonthWithRevenue = [...chartData].reverse().find(item => item.revenue > 0)

  const growth = firstMonthWithRevenue && lastMonthWithRevenue && firstMonthWithRevenue.revenue > 0
    ? ((lastMonthWithRevenue.revenue - firstMonthWithRevenue.revenue) / firstMonthWithRevenue.revenue) * 100
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" style={{ color: brandColor }} />
          Evolução de Vendas ({dateRangeLabel || "Últimos 12 Meses"})
        </CardTitle>
        <CardDescription>Receita de vendas fechadas ao longo do tempo</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] aspect-auto">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="monthShort"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null

                const data = payload[0].payload
                const monthLabel = data.month
                const revenueValue = data.revenue
                const dealsCount = data.count

                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {monthLabel}
                        </span>
                        <span className="font-bold" style={{ color: brandColor }}>
                          R$ {Number(revenueValue).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                        <span className="text-[0.70rem] text-muted-foreground mt-1">
                          {dealsCount} {dealsCount === 1 ? 'venda' : 'vendas'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={brandColor}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={brandColor}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="revenue"
              type="natural"
              fill="url(#fillRevenue)"
              fillOpacity={0.4}
              stroke={brandColor}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {growth >= 0 ? "Crescimento" : "Redução"} de {Math.abs(growth).toFixed(1)}% no período
              <TrendingUp className={`h-4 w-4 ${growth >= 0 ? "text-green-600" : "text-red-600 rotate-180"}`} />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Total: R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} •
              Média mensal: R$ {avgMonthlyRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} •
              {totalDeals} vendas
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
