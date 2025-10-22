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
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { MetaAdsTimeSeriesData } from "@/lib/types"

interface MetaAdsMonthlyChartProps {
  data: MetaAdsTimeSeriesData[]
  brandColor?: string
  isLoading?: boolean
}

export function MetaAdsMonthlyChart({ data, brandColor = "#6366f1", isLoading = false }: MetaAdsMonthlyChartProps) {
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
            Histórico de Investimento Mensal
          </CardTitle>
          <CardDescription>Investimento em anúncios ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado disponível para o período selecionado</p>
        </CardContent>
      </Card>
    )
  }

  // Group data by month
  const monthlyData = groupDataByMonth(data)

  const chartConfig = {
    spend: {
      label: "Investimento",
      color: brandColor,
    },
  } satisfies ChartConfig

  // Calculate total investment and growth
  const totalInvestment = monthlyData.reduce((sum, item) => sum + item.spend, 0)
  const avgMonthlySpend = totalInvestment / (monthlyData.length || 1)

  // Calculate growth percentage (comparing first vs last month)
  const growth =
    monthlyData.length > 1 && monthlyData[0].spend > 0
      ? ((monthlyData[monthlyData.length - 1].spend - monthlyData[0].spend) / monthlyData[0].spend) * 100
      : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" style={{ color: brandColor }} />
          Histórico de Investimento Mensal
        </CardTitle>
        <CardDescription>Investimento em anúncios ao longo do tempo</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] aspect-auto">
          <AreaChart
            accessibilityLayer
            data={monthlyData}
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
                const monthLabel = data.month // Full format: "Outubro de 2024"
                const spendValue = data.spend
                
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {monthLabel}
                        </span>
                        <span className="font-bold" style={{ color: brandColor }}>
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
              type="natural"
              fill="url(#fillSpend)"
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
              Total: R$ {totalInvestment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} • Média mensal: R${" "}
              {avgMonthlySpend.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

// Helper function to group data by month
function groupDataByMonth(data: MetaAdsTimeSeriesData[]): { 
  month: string; 
  monthShort: string;
  spend: number; 
  sortKey: string 
}[] {
  const monthlyMap = new Map<string, { spend: number; sortKey: string }>()

  data.forEach((item) => {
    const date = new Date(item.date)
    const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    const current = monthlyMap.get(sortKey) || { spend: 0, sortKey }
    monthlyMap.set(sortKey, { 
      spend: current.spend + item.spend,
      sortKey
    })
  })

  return Array.from(monthlyMap.entries())
    .map(([sortKey, data]) => {
      // Recreate the label from sortKey for consistency
      const [year, month] = sortKey.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, 1)
      
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
        month: formattedLabelFull, // Full name for tooltip
        monthShort: monthLabelShort, // Short name for axis
        spend: parseFloat(data.spend.toFixed(2)),
        sortKey
      }
    })
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
}
