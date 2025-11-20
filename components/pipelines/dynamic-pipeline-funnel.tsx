"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Calendar, DollarSign } from "lucide-react"
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
                className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500 flex items-center justify-center px-2"
                style={{
                  width: `${Math.max(widthPercentage, 25)}%`, // Minimum 25% for visibility on mobile
                  backgroundColor: stage.stageColor,
                  opacity: 0.8,
                }}
              >
                <span className="text-xs sm:text-sm font-semibold text-white truncate">
                  {stage.count} {stage.count === 1 ? 'lead' : 'leads'}
                </span>
              </div>
            </div>
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
