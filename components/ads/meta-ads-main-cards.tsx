"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Users, MousePointerClick, Target, ArrowUpRight } from "lucide-react"
import type { MetaAdsMetrics } from "@/lib/types"

interface MetaAdsMainCardsProps {
  metrics: MetaAdsMetrics | null
  isLoading?: boolean
  brandColor?: string
  roas?: number
}

export function MetaAdsMainCards({ metrics, isLoading = false, brandColor = "#6366f1", roas }: MetaAdsMainCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-8 w-8 bg-muted rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted rounded mb-2" />
              <div className="h-3 w-40 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="col-span-full">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Dados de Meta Ads não disponíveis. Configure suas credenciais da API do Facebook.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cardsConfig = [
    {
      title: "Total Investido",
      value: `R$ ${metrics.totalSpend.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: "Investimento total em anúncios",
      icon: DollarSign,
      color: brandColor,
    },
    {
      title: "CPL (Custo por Lead)",
      value: metrics.totalLeads > 0
        ? `R$ ${(metrics.totalSpend / metrics.totalLeads).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "R$ 0,00",
      description: `Total investido / ${metrics.totalLeads} leads`,
      icon: Users,
      color: brandColor,
    },
    {
      title: "CAC (Custo por Aquisição)",
      value: metrics.totalSales > 0
        ? `R$ ${metrics.cac.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "R$ 0,00",
      description: `Total investido / ${metrics.totalSales} vendas`,
      icon: Target,
      color: brandColor,
    },
    {
      title: "Alcance",
      value: metrics.totalImpressions.toLocaleString("pt-BR"),
      description: "Total de impressões geradas",
      icon: TrendingUp,
      color: brandColor,
    },
    {
      title: "CPC",
      value: `R$ ${metrics.cpc.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: "Custo por Clique",
      icon: MousePointerClick,
      color: brandColor,
    },
    {
      title: "ROAS",
      value: roas ? `${roas.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}x` : "0.0x",
      description: "Retorno sobre investimento em anúncios",
      icon: ArrowUpRight,
      color: brandColor,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      {cardsConfig.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${card.color}20` }}
              >
                <Icon className="h-5 w-5" style={{ color: card.color }} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
