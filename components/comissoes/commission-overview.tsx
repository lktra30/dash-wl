"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CommissionOverview, CommissionSettings, Deal } from "@/lib/types"
import { formatCurrency, formatPercent } from "@/lib/commissions"
import { DollarSign, Users, TrendingUp, Award } from "lucide-react"
// import { CommissionGoalProgress } from "./commission-goal-progress"
import { DailySalesChart } from "./daily-sales-chart"

interface CommissionOverviewCardProps {
  overview: CommissionOverview
  periodMonth: number
  periodYear: number
  settings: CommissionSettings | null
  deals: Deal[]
  brandColor?: string
  businessModel?: "TCV" | "MRR"
}

export function CommissionOverviewCard({ 
  overview, 
  periodMonth, 
  periodYear,
  settings,
  deals,
  brandColor = '#3b82f6',
  businessModel = 'TCV'
}: CommissionOverviewCardProps) {
  const periodLabel = new Date(periodYear, periodMonth - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  })

  const closerSalesTarget = settings?.closerSalesTarget || 10000

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" style={{ color: brandColor }} />
              Total de Comissões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(overview.totalCommissions)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.totalDeals} deals • {formatCurrency(overview.totalSales)} em vendas
              {businessModel === 'MRR' && <span className="ml-1 text-purple-600 dark:text-purple-400 font-medium">(MRR)</span>}
            </p>
            <p className="text-xs text-muted-foreground">{periodLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: brandColor }} />
              Membros da Equipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview.sdrCount + overview.closerCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.sdrCount} SDRs • {overview.closerCount} Closers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" style={{ color: brandColor }} />
              Desempenho Médio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(overview.averageTargetAchievement)}</p>
            <p className="text-xs text-muted-foreground mt-1">Conclusão da meta</p>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Award className="h-4 w-4" style={{ color: brandColor }} />
              Melhor Desempenho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold truncate">
              {overview.topPerformers[0]?.userName || 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.topPerformers[0] ? formatCurrency(overview.topPerformers[0].commission) : ''}
            </p>
          </CardContent>
        </Card> */}
      </div>

      {/* Goal Progress Card */}
      {/* <CommissionGoalProgress 
        overview={overview}
        periodMonth={periodMonth}
        periodYear={periodYear}
        closerSalesTarget={closerSalesTarget}
        brandColor={brandColor}
      /> */}

      {/* Breakdown by Role */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Comissões SDR</CardTitle>
            <CardDescription>{overview.sdrCount} membros da equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ color: brandColor }}>
              {formatCurrency(overview.sdrCommissions)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {formatPercent((overview.sdrCommissions / overview.totalCommissions) * 100)} do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comissões Closer</CardTitle>
            <CardDescription>{overview.closerCount} membros da equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ color: brandColor }}>
              {formatCurrency(overview.closerCommissions)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {formatPercent((overview.closerCommissions / overview.totalCommissions) * 100)} do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Sales Chart */}
      <DailySalesChart 
        deals={deals}
        monthlyTarget={closerSalesTarget}
        periodMonth={periodMonth}
        periodYear={periodYear}
        brandColor={brandColor}
      />
    </div>
  )
}
