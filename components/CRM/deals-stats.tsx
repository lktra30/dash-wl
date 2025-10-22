"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Target, Percent } from "lucide-react"

interface DealsStatsProps {
  stats: {
    totalCount: number
    wonCount: number
    lostCount: number
    openCount: number
    totalValue: number
    wonValue: number
    lostValue: number
    openValue: number
    conversionRate: number
  }
  isLoading?: boolean
}

export function DealsStats({ stats, isLoading }: DealsStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-lg border bg-card animate-pulse" />
        ))}
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Deals Won */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Negócios Ganhos
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.wonCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(stats.wonValue)}
          </p>
        </CardContent>
      </Card>

      {/* Total Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Valor Total em Vendas
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(stats.wonValue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            De {stats.totalCount} negócios totais
          </p>
        </CardContent>
      </Card>

      {/* Open Deals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Negócios Abertos
          </CardTitle>
          <Target className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.openCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(stats.openValue)} em pipeline
          </p>
        </CardContent>
      </Card>

      {/* Conversion Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Taxa de Conversão
          </CardTitle>
          <Percent className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.conversionRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.wonCount} ganhos / {stats.wonCount + stats.lostCount} fechados
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
