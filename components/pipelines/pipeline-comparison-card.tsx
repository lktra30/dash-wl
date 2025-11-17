"use client"

import React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, TrendingUp, Users, DollarSign, Target } from "lucide-react"
import { DynamicPipelineFunnel } from "./dynamic-pipeline-funnel"
import type { PipelineMetrics } from "@/lib/types"

interface PipelineComparisonCardProps {
  pipelines: PipelineMetrics[]
  brandColor?: string
  isLoading?: boolean
}

export function PipelineComparisonCard({
  pipelines,
  brandColor = "#6366f1",
  isLoading = false,
}: PipelineComparisonCardProps) {
  const [expandedPipelines, setExpandedPipelines] = React.useState<Set<string>>(new Set())

  const togglePipeline = React.useCallback((pipelineId: string) => {
    setExpandedPipelines((prev) => {
      const next = new Set(prev)
      if (next.has(pipelineId)) {
        next.delete(pipelineId)
      } else {
        next.add(pipelineId)
      }
      return next
    })
  }, [])

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded mb-2" />
          <div className="h-4 w-64 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!pipelines || pipelines.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" style={{ color: brandColor }} />
            Comparativo de Pipelines
          </CardTitle>
          <CardDescription>Compare métricas e funis de cada pipeline</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Nenhum pipeline configurado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" style={{ color: brandColor }} />
          Comparativo de Pipelines
        </CardTitle>
        <CardDescription>
          Compare métricas e funis de cada pipeline. Clique para expandir e ver o funil detalhado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {pipelines.map((pipeline) => {
          const isExpanded = expandedPipelines.has(pipeline.pipelineId)

          return (
            <Card key={pipeline.pipelineId} className="border-2 transition-all hover:shadow-md">
              <div>
                <button
                  onClick={() => togglePipeline(pipeline.pipelineId)}
                  className="w-full text-left cursor-pointer"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: pipeline.color }}
                        />
                        <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                        <Badge variant="secondary">
                          <Users className="w-3 h-3 mr-1" />
                          {pipeline.metrics.totalContacts} leads
                        </Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-left">
                      {/* Meeting Rate */}
                      <div className="flex flex-col space-y-1 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Taxa de Reunião
                        </div>
                        <div className="text-2xl font-bold" style={{ color: pipeline.color }}>
                          {pipeline.metrics.meetingRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pipeline.metrics.totalMeetings} de {pipeline.metrics.totalContacts} leads
                        </div>
                      </div>

                      {/* Final Conversion */}
                      <div className="flex flex-col space-y-1 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                          <DollarSign className="w-3.5 h-3.5" />
                          Conversão Final
                        </div>
                        <div className="text-2xl font-bold" style={{ color: pipeline.color }}>
                          {pipeline.metrics.finalConversion.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pipeline.metrics.totalSales} vendas realizadas
                        </div>
                      </div>

                      {/* Meetings per Sale */}
                      <div className="flex flex-col space-y-1 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                          <Target className="w-3.5 h-3.5" />
                          Reuniões por Venda
                        </div>
                        <div className="text-2xl font-bold" style={{ color: pipeline.color }}>
                          {pipeline.metrics.meetingsPerSale.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pipeline.metrics.totalSales > 0
                            ? "Média de reuniões para fechar"
                            : "Nenhuma venda ainda"}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {/* Collapsible Funnel Section */}
                {isExpanded && (
                  <CardContent className="pt-0 pb-6 border-t">
                    <div className="pt-6">
                      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4" style={{ color: pipeline.color }} />
                        Funil Detalhado
                      </h4>
                      <DynamicPipelineFunnel
                        stages={pipeline.funnel}
                        pipelineColor={pipeline.color}
                      />
                    </div>
                  </CardContent>
                )}
              </div>
            </Card>
          )
        })}

        {/* Summary Footer */}
        {pipelines.length > 1 && (
          <div className="pt-4 border-t mt-6">
            <div className="text-sm text-muted-foreground">
              Total de pipelines: <span className="font-semibold" style={{ color: brandColor }}>{pipelines.length}</span> •
              Total de leads: <span className="font-semibold" style={{ color: brandColor }}>
                {pipelines.reduce((sum, p) => sum + p.metrics.totalContacts, 0)}
              </span> •
              Total de vendas: <span className="font-semibold" style={{ color: brandColor }}>
                {pipelines.reduce((sum, p) => sum + p.metrics.totalSales, 0)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
