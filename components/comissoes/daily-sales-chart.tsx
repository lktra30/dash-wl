"use client"

import { useState, useMemo } from "react"
import { TrendingUp, Calendar } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ReferenceLine } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Deal } from "@/lib/types"

interface DailySalesChartProps {
  deals: Deal[]
  monthlyTarget: number
  periodMonth: number
  periodYear: number
  brandColor?: string
}

interface DailyData {
  day: number
  date: string
  sales: number
  cumulativeSales: number
  targetLinear: number
  targetBusinessDays: number
}

export function DailySalesChart({ 
  deals, 
  monthlyTarget, 
  periodMonth, 
  periodYear,
  brandColor = '#3b82f6'
}: DailySalesChartProps) {
  const [useBusinessDays, setUseBusinessDays] = useState(false)

  // Processar dados de vendas diárias
  const chartData = useMemo(() => {
    const daysInMonth = new Date(periodYear, periodMonth, 0).getDate()
    const now = new Date()
    const isCurrentMonth = periodMonth === now.getMonth() + 1 && periodYear === now.getFullYear()
    const currentDay = isCurrentMonth ? now.getDate() : daysInMonth

    // Filtrar deals ganhos do período
    const wonDeals = deals.filter(deal => {
      if (deal.status !== 'won') return false
      const dealDate = new Date(deal.updatedAt)
      return dealDate.getMonth() + 1 === periodMonth && dealDate.getFullYear() === periodYear
    })

    // Agrupar vendas por dia
    const dailySales: { [key: number]: number } = {}
    wonDeals.forEach(deal => {
      const dealDate = new Date(deal.updatedAt)
      const day = dealDate.getDate()
      dailySales[day] = (dailySales[day] || 0) + Number(deal.value)
    })

    // Calcular dias úteis (segunda a sexta)
    const countBusinessDays = (upToDay: number): number => {
      let count = 0
      for (let d = 1; d <= upToDay; d++) {
        const date = new Date(periodYear, periodMonth - 1, d)
        const dayOfWeek = date.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Não é domingo (0) nem sábado (6)
          count++
        }
      }
      return count
    }

    const totalBusinessDays = countBusinessDays(daysInMonth)

    // Gerar dados para TODOS os dias do mês
    const data: DailyData[] = []
    let cumulative = 0

    for (let day = 1; day <= daysInMonth; day++) {
      const sales = dailySales[day] || 0
      
      // Só acumular vendas até o dia atual (se for mês corrente)
      if (day <= currentDay) {
        cumulative += sales
      }

      const date = new Date(periodYear, periodMonth - 1, day)
      const businessDaysUpToNow = countBusinessDays(day)

      data.push({
        day,
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        sales,
        // Mostrar vendas acumuladas apenas até o dia atual
        cumulativeSales: day <= currentDay ? cumulative : 0,
        targetLinear: (monthlyTarget / daysInMonth) * day,
        targetBusinessDays: totalBusinessDays > 0 ? (monthlyTarget / totalBusinessDays) * businessDaysUpToNow : 0
      })
    }

    return data
  }, [deals, monthlyTarget, periodMonth, periodYear])

  const chartConfig = {
    cumulativeSales: {
      label: "Vendas Realizadas",
      color: brandColor,
    },
    targetLine: {
      label: useBusinessDays ? " Meta (Dias Úteis)" : " Meta (Linear)",
      color: "#94a3b8",
    },
  } satisfies ChartConfig

  // Calcular progresso
  const lastDataPoint = chartData[chartData.length - 1]
  const targetToUse = useBusinessDays ? lastDataPoint?.targetBusinessDays : lastDataPoint?.targetLinear
  const progressPercent = targetToUse ? (lastDataPoint?.cumulativeSales / targetToUse) * 100 : 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" style={{ color: brandColor }} />
              Vendas Diárias vs Meta
            </CardTitle>
            <CardDescription>
              Progresso acumulado de vendas comparado à meta mensal
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="business-days"
              checked={useBusinessDays}
              onCheckedChange={setUseBusinessDays}
            />
            <Label htmlFor="business-days" className="text-sm cursor-pointer">
              Considerar apenas dias úteis
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    const label = name === 'cumulativeSales' 
                      ? 'Vendas Realizadas' 
                      : useBusinessDays 
                        ? ' Meta (Dias Úteis)'
                        : ' Meta (Linear)'
                    return [formatCurrency(Number(value)), label]
                  }}
                />
              }
            />
            
            {/* Linha de meta fixa (neutra) - sempre tracejada */}
            <Line
              dataKey={useBusinessDays ? "targetBusinessDays" : "targetLinear"}
              type="monotone"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Meta"
            />
            
            {/* Linha de vendas realizadas (brandColor) - sólida */}
            <Line
              dataKey="cumulativeSales"
              type="monotone"
              stroke={brandColor}
              strokeWidth={3}
              dot={(props) => {
                const { cx, cy, payload, index } = props
                // Só mostrar dot se houver vendas até aquele dia
                if (!payload.cumulativeSales || payload.cumulativeSales === 0) return null
                return (
                  <circle
                    key={`dot-${index}-${payload.day}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={brandColor}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )
              }}
              activeDot={{
                r: 6,
                strokeWidth: 2,
              }}
              name="Vendas"
              connectNulls={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
