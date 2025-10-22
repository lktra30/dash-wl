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
import type { MetaAdsTimeSeriesData } from "@/lib/types"

interface AdsPerformanceChartProps {
  data: MetaAdsTimeSeriesData[]
  brandColor?: string
}

export function AdsPerformanceChart({ data, brandColor = "#6366f1" }: AdsPerformanceChartProps) {
  const chartConfig = {
    roas: {
      label: "ROAS",
      color: brandColor,
    },
    roi: {
      label: "ROI",
      color: "#f59e0b",
    },
  } satisfies ChartConfig

  // Calculate average ROAS and ROI
  const avgRoas = data.reduce((sum, item) => sum + item.roas, 0) / (data.length || 1)
  const avgRoi = data.reduce((sum, item) => sum + item.roi, 0) / (data.length || 1)

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
          Tendências de ROAS e ROI no período selecionado
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
                    return [`${Number(value).toFixed(1)}%`, "ROI"]
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
              dataKey="roi"
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
              ROAS {roasTrend >= 0 ? "em tendência de alta" : "em tendência de baixa"} de {Math.abs(roasTrend).toFixed(1)}%
              <TrendingUp className={`h-4 w-4 ${roasTrend >= 0 ? "text-green-600" : "text-red-600 rotate-180"}`} />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              ROAS Médio: {avgRoas.toFixed(2)}x • ROI Médio: {avgRoi.toFixed(1)}%
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
