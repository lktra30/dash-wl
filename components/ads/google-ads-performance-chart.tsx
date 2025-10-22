"use client"

import { TrendingUp, Activity } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
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

interface GoogleAdsPerformanceChartProps {
  data: GoogleAdsTimeSeriesData[]
  brandColor?: string
}

export function GoogleAdsPerformanceChart({ data, brandColor = "#6366f1" }: GoogleAdsPerformanceChartProps) {
  const chartConfig = {
    roas: {
      label: "ROAS",
      color: brandColor,
    },
    conversionRate: {
      label: "Taxa de Conversão",
      color: "#f59e0b",
    },
  } satisfies ChartConfig

  // Calculate average ROAS and Conversion Rate
  const avgRoas = data.reduce((sum, item) => sum + item.roas, 0) / (data.length || 1)
  const avgConversionRate = data.reduce((sum, item) => sum + item.conversionRate, 0) / (data.length || 1)

  // Find trend (comparing first 3 vs last 3 data points)
  const recentRoas = data.slice(-3).reduce((sum, item) => sum + item.roas, 0) / 3
  const earlierRoas = data.slice(0, 3).reduce((sum, item) => sum + item.roas, 0) / 3
  const roasTrend = earlierRoas > 0 ? ((recentRoas - earlierRoas) / earlierRoas) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" style={{ color: brandColor }} />
          Métricas de Performance
        </CardTitle>
        <CardDescription>
          Tendências de ROAS e taxa de conversão para o período selecionado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] aspect-auto">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
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
              tickFormatter={(value) => value.toFixed(1)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("pt-BR", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  formatter={(value, name) => {
                    if (name === "roas") {
                      return [`${Number(value).toFixed(2)}x`, "ROAS"]
                    }
                    return [`${Number(value).toFixed(2)}%`, "Taxa de Conversão"]
                  }}
                />
              }
            />
            <Line
              dataKey="roas"
              type="monotone"
              stroke={brandColor}
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="conversionRate"
              type="monotone"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              ROAS {roasTrend >= 0 ? "em alta" : "em baixa"} em {Math.abs(roasTrend).toFixed(1)}%
              <TrendingUp className={`h-4 w-4 ${roasTrend >= 0 ? "text-green-600" : "text-red-600 rotate-180"}`} />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              ROAS médio: {avgRoas.toFixed(2)}x • Taxa de conversão média: {avgConversionRate.toFixed(2)}%
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
