"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SDRMetrics, CloserMetrics } from "@/lib/types"
import { 
  formatCurrency, 
  formatPercent, 
  getCheckpointLabel, 
  getCheckpointColor 
} from "@/lib/commissions"
import { DollarSign, Target, TrendingUp, Award } from "lucide-react"

interface UserCommissionCardProps {
  metrics: SDRMetrics | CloserMetrics
  role: 'sdr' | 'closer'
}

export function UserCommissionCard({ metrics, role }: UserCommissionCardProps) {
  const isSdr = role === 'sdr'
  const sdrMetrics = isSdr ? (metrics as SDRMetrics) : null
  const closerMetrics = !isSdr ? (metrics as CloserMetrics) : null

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{metrics.userName}</CardTitle>
            <CardDescription className="mt-1">
              {isSdr ? 'SDR' : 'Closer'} • {new Date(metrics.periodYear, metrics.periodMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </CardDescription>
          </div>
          <Badge className={`${getCheckpointColor(metrics.checkpointTier)} border`} variant="outline">
            {getCheckpointLabel(metrics.checkpointTier)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Final Commission */}
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Comissão Final</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(metrics.finalCommission)}
            </p>
          </div>
        </div>

        {/* SDR-specific metrics */}
        {isSdr && sdrMetrics && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Reuniões Realizadas</span>
                </div>
                <p className="text-xl font-semibold">
                  {sdrMetrics.meetingsHeld} / {sdrMetrics.meetingsTarget}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="h-4 w-4" />
                  <span>Convertidas</span>
                </div>
                <p className="text-xl font-semibold">{sdrMetrics.meetingsConverted}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comissão Base</span>
                <span className="font-medium">{formatCurrency(sdrMetrics.baseCommission)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comissão Bônus</span>
                <span className="font-medium">{formatCurrency(sdrMetrics.bonusCommission)}</span>
              </div>
            </div>
          </>
        )}

        {/* Closer-specific metrics */}
        {!isSdr && closerMetrics && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Total de Vendas</span>
                </div>
                <p className="text-xl font-semibold">{formatCurrency(closerMetrics.totalSales)}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="h-4 w-4" />
                  <span>Negócios Fechados</span>
                </div>
                <p className="text-xl font-semibold">{closerMetrics.salesCount}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Meta de Vendas</span>
                <span className="font-medium">{formatCurrency(closerMetrics.salesTarget)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comissão Base</span>
                <span className="font-medium">{formatCurrency(closerMetrics.baseCommission)}</span>
              </div>
            </div>
          </>
        )}

        {/* Target Achievement */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Alcance da Meta</span>
            </div>
            <span className="text-sm font-semibold">
              {formatPercent(metrics.targetAchievementPercent)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(metrics.targetAchievementPercent, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
