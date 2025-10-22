"use client"

import { TrendingUp, DollarSign } from "lucide-react"
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
import type { GoogleAdsTimeSeriesData } from "@/lib/types"

interface GoogleAdsInvestmentChartProps {
  data: GoogleAdsTimeSeriesData[]
  brandColor?: string
}

export function GoogleAdsInvestmentChart({ data, brandColor = "#6366f1" }: GoogleAdsInvestmentChartProps) {
  const chartConfig = {
    spend: {
      label: "Investimento",
      color: brandColor,
    },
    revenue: {
      label: "Receita",
      color: "#10b981",
    },
  } satisfies ChartConfig

  // Calculate total investment and growth
  const totalInvestment = data.reduce((sum, item) => sum + item.spend, 0)
  const avgDailySpend = totalInvestment / (data.length || 1)
  
  // Calculate growth percentage (comparing first half vs second half)
  const midPoint = Math.floor(data.length / 2)
  const firstHalfAvg = data.slice(0, midPoint).reduce((sum, item) => sum + item.spend, 0) / (midPoint || 1)
  const secondHalfAvg = data.slice(midPoint).reduce((sum, item) => sum + item.spend, 0) / (data.length - midPoint || 1)
  const growth = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" style={{ color: brandColor }} />
          Investimento ao Longo do Tempo
        </CardTitle>
        <CardDescription>
          Gasto diário em anúncios e receita para o período selecionado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] aspect-auto">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
              top: 12,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("pt-BR", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
              }
            />
            <Area
              dataKey="spend"
              type="natural"
              fill={brandColor}
              fillOpacity={0.2}
              stroke={brandColor}
              strokeWidth={2}
            />
            <Area
              dataKey="revenue"
              type="natural"
              fill="#10b981"
              fillOpacity={0.2}
              stroke="#10b981"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {growth >= 0 ? "Tendência de alta" : "Tendência de baixa"} de {Math.abs(growth).toFixed(1)}% 
              <TrendingUp className={`h-4 w-4 ${growth >= 0 ? "text-green-600" : "text-red-600 rotate-180"}`} />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Investimento total: R$ {totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • Média: R$ {avgDailySpend.toFixed(2)}/dia
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
