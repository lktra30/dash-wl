"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, DollarSign, Percent, Hash } from "lucide-react"

interface DealsStatsSidebarProps {
  stats: {
    totalCount: number
    wonCount: number
    lostCount: number
    wonValue: number
    conversionRate: number
  }
  isLoading?: boolean
}

export function DealsStatsSidebar({ stats, isLoading }: DealsStatsSidebarProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const avgDealValue = stats.wonCount > 0 ? stats.wonValue / stats.wonCount : 0

  const statCards = [
    {
      icon: Hash,
      value: stats.wonCount + stats.lostCount,
      label: "Total Fechados",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      icon: DollarSign,
      value: formatCurrency(stats.wonValue),
      label: "Valor Ganho",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      icon: Percent,
      value: `${stats.conversionRate.toFixed(1)}%`,
      label: "Taxa Conversão",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      icon: TrendingUp,
      value: formatCurrency(avgDealValue),
      label: "Ticket Médio",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Estatísticas
      </h3>
      
      {/* 2x2 Grid for stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className={`text-xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium leading-tight">
                    {stat.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Additional Info Card */}
      <Card className="border-dashed">
        <CardContent className="p-3">
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Ganhos:</span>
              <span className="font-semibold text-green-600">{stats.wonCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Perdidos:</span>
              <span className="font-semibold text-red-600">{stats.lostCount}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span>Total:</span>
              <span className="font-bold text-foreground">{stats.wonCount + stats.lostCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
