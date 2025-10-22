"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Target, MousePointerClick, BarChart3, Percent } from "lucide-react"
import type { GoogleAdsMetrics } from "@/lib/types"

interface GoogleAdsMetricsOverviewProps {
  metrics: GoogleAdsMetrics
  brandColor?: string
}

export function GoogleAdsMetricsOverview({ metrics, brandColor = "#6366f1" }: GoogleAdsMetricsOverviewProps) {
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
      title: "ROI",
      value: `${metrics.roi.toFixed(1)}%`,
      description: "Retorno sobre Investimento",
      icon: BarChart3,
      color: brandColor,
      trend: metrics.roi >= 100 ? "positive" : metrics.roi >= 0 ? "neutral" : "negative",
    },
    {
      title: "CPA",
      value: `R$ ${metrics.cpa.toFixed(2)}`,
      description: "Custo por Aquisição",
      icon: Target,
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
      description: "Total Gasto em Anúncios",
      icon: DollarSign,
      color: brandColor,
      trend: "neutral",
    },
    {
      title: "Conversões",
      value: metrics.totalConversions.toLocaleString('pt-BR'),
      description: "Total de Conversões",
      icon: Target,
      color: brandColor,
      trend: "positive",
    },
    {
      title: "Taxa de Conversão",
      value: `${metrics.conversionRate.toFixed(2)}%`,
      description: "Conversões / Cliques",
      icon: Percent,
      color: brandColor,
      trend: metrics.conversionRate >= 5 ? "positive" : metrics.conversionRate >= 2 ? "neutral" : "negative",
    },
    {
      title: "CTR",
      value: `${metrics.ctr.toFixed(2)}%`,
      description: "Taxa de Cliques",
      icon: MousePointerClick,
      color: brandColor,
      trend: metrics.ctr >= 3 ? "positive" : metrics.ctr >= 1 ? "neutral" : "negative",
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
