/**
 * Performance-Optimized Analytics Component
 * 
 * Demonstrates usage of optimized analytics hooks and best practices
 * 
 * Features:
 * - Uses materialized view for instant loading
 * - Displays last update time
 * - Manual refresh capability
 * - Performance monitoring
 * - Loading and error states
 */

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useOptimizedAnalytics, usePipelineMetrics, usePerformanceMonitor } from "@/hooks/use-optimized-analytics"
import { RefreshCw, TrendingUp, DollarSign, Users, Briefcase, Clock, Zap } from "lucide-react"
import { useState } from "react"

export function OptimizedAnalyticsExample() {
  const { analytics, isLoading, lastUpdated, refresh } = useOptimizedAnalytics()
  const { metrics: pipelineMetrics, isLoading: isPipelineLoading } = usePipelineMetrics()
  const { getAllMetrics } = usePerformanceMonitor()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showPerformance, setShowPerformance] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    setIsRefreshing(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando analytics otimizados...</p>
        </div>
      </div>
    )
  }

  const performanceMetrics = getAllMetrics()

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Dados precalculados • Última atualização: {lastUpdated ? new Date(lastUpdated).toLocaleString('pt-BR') : 'N/A'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPerformance(!showPerformance)}
          >
            <Zap className="w-4 h-4 mr-2" />
            Performance
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Performance Metrics (Optional) */}
      {showPerformance && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-sm">Métricas de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {Object.entries(performanceMetrics).map(([endpoint, metrics]) => (
                <div key={endpoint} className="space-y-1">
                  <p className="font-medium truncate">{endpoint}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Avg: {metrics.avg.toFixed(0)}ms</span>
                    <span>Min: {metrics.min.toFixed(0)}ms</span>
                    <span>Max: {metrics.max.toFixed(0)}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalContacts?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.newLeads || 0} novos leads
            </p>
          </CardContent>
        </Card>

        {/* Total Deals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Deals</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalDeals?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.openDeals || 0} abertos • {analytics?.wonDeals || 0} ganhos
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(analytics?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ticket médio: R$ {(analytics?.avgDealValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        {/* Pipeline Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor em Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(analytics?.pipelineValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Deals em aberto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas por Estágio de Pipeline</CardTitle>
          <CardDescription>
            Dados agregados em tempo real de cada estágio do funil de vendas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPipelineLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {pipelineMetrics?.map((stage) => (
                <div
                  key={stage.stageId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  style={{ borderLeftColor: stage.color, borderLeftWidth: 4 }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{stage.stageName}</h4>
                      {stage.countsAsMeeting && (
                        <Badge variant="secondary" className="text-xs">Reunião</Badge>
                      )}
                      {stage.countsAsSale && (
                        <Badge variant="default" className="text-xs">Venda</Badge>
                      )}
                    </div>
                    <div className="flex gap-6 mt-2 text-sm text-muted-foreground">
                      <span>{stage.contactsCount} contatos</span>
                      <span>
                        Valor médio: R$ {stage.avgDealValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {stage.avgDaysInStage.toFixed(0)} dias
                      </span>
                      <span>
                        Conv: {stage.conversionRatePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reuniões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalMeetings || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.completedMeetings || 0} realizadas • {analytics?.convertedMeetings || 0} convertidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Equipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.activeEmployees || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.totalEmployees || 0} total • {analytics?.totalTeams || 0} times
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status do Funil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Em contato:</span>
                <span className="font-medium">{analytics?.contactedLeads || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reuniões:</span>
                <span className="font-medium">{analytics?.meetingsScheduled || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Negociação:</span>
                <span className="font-medium">{analytics?.inNegotiation || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
