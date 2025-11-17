"use client"

import { TrendingUp, DollarSign, Calendar, TrendingDown } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"
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
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { MetaAdsTimeSeriesData } from "@/lib/types"

interface MetaAdsDailyChartProps {
  data: MetaAdsTimeSeriesData[]
  brandColor?: string
  isLoading?: boolean
}

export function MetaAdsDailyChart({ data, brandColor = "#6366f1", isLoading = false }: MetaAdsDailyChartProps) {
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
            Investimento Diário em Anúncios
          </CardTitle>
          <CardDescription>Investimento dia a dia em anúncios do Meta Ads</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado disponível para o período selecionado</p>
        </CardContent>
      </Card>
    )
  }

  // Format data for chart - show day of month
  const chartData = data.map((item) => {
    const date = new Date(item.date)
    const day = date.getDate()
    
    return {
      day: `${day}`,
      date: item.date,
      spend: item.spend,
    }
  })

  const chartConfig = {
    spend: {
      label: "Investimento",
      color: brandColor,
    },
  } satisfies ChartConfig

  // Calculate totals and metrics
  const totalInvestment = data.reduce((sum, item) => sum + item.spend, 0)

  // Calculate averages
  const avgDailySpend = totalInvestment / (data.length || 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" style={{ color: brandColor }} />
          Investimento Diário em Anúncios
        </CardTitle>
        <CardDescription>Investimento dia a dia em anúncios do Meta Ads</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] aspect-auto">
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
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              label={{ value: "Dia do Mês", position: "insideBottom", offset: -5 }}
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
                const dateObj = new Date(data.date)
                const dateLabel = dateObj.toLocaleDateString("pt-BR", { 
                  day: "2-digit",
                  month: "long",
                  year: "numeric"
                })
                
                const spendValue = data.spend || 0
                
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex flex-col mb-2">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {dateLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Investimento:</span>
                        <span className="font-bold text-sm" style={{ color: brandColor }}>
                          R$ {Number(spendValue).toLocaleString("pt-BR", { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
            <defs>
              <linearGradient id="fillSpend" x1="0" y1="0" x2="0" y2="1">
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
              dataKey="spend"
              type="monotone"
              fill="url(#fillSpend)"
              fillOpacity={0.4}
              stroke={brandColor}
              strokeWidth={2}
              name="Investimento"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
