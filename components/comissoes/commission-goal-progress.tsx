"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CommissionOverview } from "@/lib/types"
import { formatCurrency, formatPercent } from "@/lib/commissions"
import { Target, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CommissionGoalProgressProps {
  overview: CommissionOverview
  periodMonth: number
  periodYear: number
  closerSalesTarget: number
  brandColor?: string
}

export function CommissionGoalProgress({ 
  overview, 
  periodMonth, 
  periodYear,
  closerSalesTarget,
  brandColor = '#3b82f6'
}: CommissionGoalProgressProps) {
  const periodLabel = new Date(periodYear, periodMonth - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  })

  // Calcular percentual de progresso da meta
  const percentage = closerSalesTarget > 0 
    ? (overview.totalSales / closerSalesTarget) * 100 
    : 0

  // Define cores baseadas no percentual de progresso
  const getProgressColor = () => {
    if (percentage >= 100) return brandColor
    if (percentage >= 75) return brandColor
    if (percentage >= 50) return `${brandColor}CC` // 80% opacidade
    return `${brandColor}99` // 60% opacidade
  }

  // Define texto do badge
  const getBadgeVariant = () => {
    if (percentage >= 100) return 'default'
    if (percentage >= 75) return 'secondary'
    return 'outline'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" style={{ color: brandColor }} />
          Progresso da Meta Mensal
        </CardTitle>
        <CardDescription>{periodLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Info */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Vendas Realizadas</p>
            <p className="text-2xl font-bold" style={{ color: brandColor }}>
              {formatCurrency(overview.totalSales)}
            </p>
          </div>
          <Badge 
            variant={getBadgeVariant()} 
            className="text-sm px-3 py-1"
            style={percentage >= 100 ? { backgroundColor: brandColor, color: 'white' } : {}}
          >
            {percentage >= 100 ? '✓ ' : ''}
            {percentage.toFixed(1)}%
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="relative w-full h-4 bg-primary/20 rounded-full overflow-hidden">
            <div
              className="h-full transition-all rounded-full"
              style={{ 
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: getProgressColor()
              }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Meta: {formatCurrency(closerSalesTarget)}
            </span>
            {percentage > 100 && (
              <span className="font-semibold" style={{ color: brandColor }}>
                +{formatCurrency(overview.totalSales - closerSalesTarget)} acima da meta
              </span>
            )}
            {percentage <= 100 && (
              <span>
                Faltam: {formatCurrency(closerSalesTarget - overview.totalSales)}
              </span>
            )}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Total de Deals
            </p>
            <p className="text-lg font-bold">{overview.totalDeals}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Ticket Médio
            </p>
            <p className="text-lg font-bold">
              {overview.totalDeals > 0 
                ? formatCurrency(overview.totalSales / overview.totalDeals)
                : formatCurrency(0)
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
