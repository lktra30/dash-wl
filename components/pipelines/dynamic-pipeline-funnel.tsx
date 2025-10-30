"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calendar, DollarSign } from "lucide-react"
import type { PipelineFunnelStage } from "@/lib/types"

interface DynamicPipelineFunnelProps {
  stages: PipelineFunnelStage[]
  pipelineColor?: string
}

export const DynamicPipelineFunnel = React.memo(({ stages, pipelineColor = "#6366f1" }: DynamicPipelineFunnelProps) => {
  // Calculate total contacts and max count for percentage calculations
  const totalContacts = React.useMemo(() => {
    return stages.reduce((sum, stage) => sum + stage.count, 0)
  }, [stages])

  const maxCount = React.useMemo(() => {
    return Math.max(...stages.map(s => s.count), 1)
  }, [stages])

  if (stages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Este pipeline não tem estágios configurados
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => {
        // Calculate percentages
        const totalPercentage = totalContacts > 0 ? (stage.count / totalContacts) * 100 : 0
        const widthPercentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0

        return (
          <div key={stage.stageId} className="space-y-2">
            {/* Stage Name and Badges */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.stageColor }}
                />
                <span className="text-sm font-medium">{stage.stageName}</span>
                {stage.countsAsMeeting && (
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    Reunião
                  </Badge>
                )}
                {stage.countsAsSale && (
                  <Badge variant="outline" className="text-xs">
                    <DollarSign className="w-3 h-3 mr-1" />
                    Venda
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {totalPercentage.toFixed(1)}%
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-10 bg-muted rounded-lg overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500 flex items-center justify-between px-3"
                style={{
                  width: `${Math.max(widthPercentage, 15)}%`, // Minimum 15% for visibility
                  backgroundColor: stage.stageColor,
                  opacity: 0.8,
                }}
              >
                <span className="text-sm font-semibold text-white">
                  {stage.count} {stage.count === 1 ? 'lead' : 'leads'}
                </span>
                {stage.conversionFromPrevious !== undefined && (
                  <span className="text-xs text-white/90 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    {stage.conversionFromPrevious.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            {/* Conversion Rate from Previous Stage */}
            {index > 0 && stage.conversionFromPrevious !== undefined && (
              <div className="text-xs text-muted-foreground pl-5">
                Taxa de conversão do estágio anterior: {stage.conversionFromPrevious.toFixed(1)}%
              </div>
            )}
          </div>
        )
      })}

      {/* Summary */}
      {totalContacts > 0 && (
        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Total de leads neste pipeline: <span className="font-semibold text-foreground">{totalContacts}</span>
          </div>
        </div>
      )}
    </div>
  )
})

DynamicPipelineFunnel.displayName = "DynamicPipelineFunnel"
