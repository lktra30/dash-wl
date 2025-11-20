"use client"

import React from "react"
import { TrendingUp, Users, Calendar } from "lucide-react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
import type { LeadsEvolutionData } from "@/lib/types"

interface LeadsEvolutionChartProps {
  data: LeadsEvolutionData[]
  brandColor?: string
  isLoading?: boolean
  dateRangeLabel?: string
}

export function LeadsEvolutionChart({ data, brandColor = "#6366f1", isLoading = false, dateRangeLabel }: LeadsEvolutionChartProps) {
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
            Evolução de Leads ({dateRangeLabel || "Últimos 12 Meses"})
          </CardTitle>
          <CardDescription>Reuniões e vendas realizadas ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    )
  }

  // Transform data for chart display
  const chartData = React.useMemo(() => {
    return data.map((item) => {
      const date = new Date(item.date + "-01")

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
        meetings: item.meetings,
        sales: item.sales,
      }
    })
  }, [data])

  const chartConfig = {
    meetings: {
      label: "Reuniões",
      color: "#3b82f6", // Blue
    },
    sales: {
      label: "Vendas",
      color: "#10b981", // Green
    },
  } satisfies ChartConfig

  // Calculate totals and growth
  const totalMeetings = chartData.reduce((sum, item) => sum + item.meetings, 0)
  const totalSales = chartData.reduce((sum, item) => sum + item.sales, 0)

  // Calculate growth for meetings (comparing first vs last month)
  const firstMonthMeetings = chartData[0]?.meetings || 0
  const lastMonthMeetings = chartData[chartData.length - 1]?.meetings || 0

  const meetingsGrowth = firstMonthMeetings > 0
    ? ((lastMonthMeetings - firstMonthMeetings) / firstMonthMeetings) * 100
    : 0

  // Calculate conversion rate (sales / meetings)
  const conversionRate = totalMeetings > 0 ? (totalSales / totalMeetings) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" style={{ color: brandColor }} />
          Evolução de Leads ({dateRangeLabel || "Últimos 12 Meses"})
        </CardTitle>
        <CardDescription>Reuniões e vendas realizadas ao longo do tempo</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] aspect-auto">
          <LineChart
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
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null

                const data = payload[0].payload
                const monthLabel = data.month
                const meetings = data.meetings
                const sales = data.sales

                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {monthLabel}
                        </span>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3b82f6" }} />
                            <span className="font-semibold text-sm">
                              {meetings} {meetings === 1 ? 'reunião' : 'reuniões'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#10b981" }} />
                            <span className="font-semibold text-sm">
                              {sales} {sales === 1 ? 'venda' : 'vendas'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
            <Line
              dataKey="meetings"
              type="monotone"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{
                fill: "#3b82f6",
              }}
              activeDot={{
                r: 6,
              }}
            />
            <Line
              dataKey="sales"
              type="monotone"
              stroke="#10b981"
              strokeWidth={2}
              dot={{
                fill: "#10b981",
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {meetingsGrowth >= 0 ? "Crescimento" : "Redução"} de {Math.abs(meetingsGrowth).toFixed(1)}% em reuniões no período
              <TrendingUp className={`h-4 w-4 ${meetingsGrowth >= 0 ? "text-green-600" : "text-red-600 rotate-180"}`} />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              <Users className="h-3.5 w-3.5" />
              Total: {totalMeetings} reuniões • {totalSales} vendas • Taxa de conversão: {conversionRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
