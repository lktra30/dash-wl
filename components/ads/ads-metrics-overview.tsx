"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Users, MousePointerClick } from "lucide-react"
import type { MetaAdsMetrics } from "@/lib/types"

interface AdsMetricsOverviewProps {
  metrics: MetaAdsMetrics
  brandColor?: string
}

export function AdsMetricsOverview({ metrics, brandColor = "#6366f1" }: AdsMetricsOverviewProps) {
  const metricsConfig = [
    {
      title: "ROAS",
      value: `${metrics.roas.toFixed(2)}x`,
      description: "Retorno sobre Investimento em Anúncios",
      icon: TrendingUp,
      color: brandColor,
      trend: metrics.roas >= 2 ? "positive" : metrics.roas >= 1 ? "neutral" : "negative",
    },
    {
      title: "CAC",
      value: `R$ ${metrics.cac.toFixed(2)}`,
      description: "Custo de Aquisição de Cliente",
      icon: Users,
      color: brandColor,
      trend: "neutral",
    },
    {
      title: "CPC",
      value: `R$ ${metrics.cpc.toFixed(2)}`,
      description: "Custo por Clique",
      icon: MousePointerClick,
      color: brandColor,
      trend: "neutral",
    },
    {
      title: "Investimento Total",
      value: `R$ ${metrics.totalSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: "Gasto Total em Anúncios",
      icon: DollarSign,
      color: brandColor,
      trend: "neutral",
    },
  ]

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "positive":
        return "text-green-600 dark:text-green-400"
      case "negative":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metricsConfig.map((metric, index) => {
        const Icon = metric.icon
        return (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${metric.color}20` }}
              >
                <Icon className="h-4 w-4" style={{ color: metric.color }} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getTrendColor(metric.trend)}`}>{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
