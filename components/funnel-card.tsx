"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import useData from "@/hooks/use-data"
import { TrendingUp, UserPlus, Phone, Calendar, DollarSign, Target, Percent, Users } from "lucide-react"
import { useState, useEffect } from "react"

const funnelStages = [
  {
    key: "novoLead" as const,
    label: "Novo Lead",
    icon: UserPlus,
  },
  {
    key: "emContato" as const,
    label: "Em Contato",
    icon: Phone,
  },
  {
    key: "reuniao" as const,
    label: "Reunião",
    icon: Calendar,
  },
  {
    key: "fechado" as const,
    label: "Ganho",
    icon: DollarSign,
  },
]

interface FunnelCardProps {
  dateRange?: {
    from: Date
    to: Date
  }
}

export function FunnelCard({ dateRange }: FunnelCardProps) {
  const { whitelabel } = useAuth()
  const dataService = useData()
  const [funnelStats, setFunnelStats] = useState<Record<string, number> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      if (!dataService) return

      setIsLoading(true)
      try {
        const stats = await dataService.getFunnelStats()
        setFunnelStats(stats)
      } catch (error) {
        setFunnelStats(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [dataService, dateRange])

  if (isLoading || !funnelStats || !whitelabel) {
    return (
      <>
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center">Carregando...</p>
            </CardContent>
          </Card>
        </div>
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground text-center">Carregando dados do funil...</p>
          </CardContent>
        </Card>
      </>
    )
  }

  const brandColor = whitelabel.brandColor || "#6366f1"
  const totalPhases = funnelStats.novoLead
  const totalConversion = funnelStats.fechado
  
  // Calculate conversion rates between stages
  const contactRate = totalPhases > 0 ? ((funnelStats.emContato / funnelStats.novoLead) * 100) : 0
  const meetingRate = funnelStats.emContato > 0 ? ((funnelStats.reuniao / funnelStats.emContato) * 100) : 0
  const winRate = funnelStats.reuniao > 0 ? ((funnelStats.fechado / funnelStats.reuniao) * 100) : 0
  const totalConversionRate = totalPhases > 0 ? ((totalConversion / totalPhases) * 100) : 0
  
  // Calculate minimum meetings for 1 win
  const meetingsPerWin = funnelStats.fechado > 0 ? (funnelStats.reuniao / funnelStats.fechado) : 0

  return (
    <>
      {/* Left Side Metrics */}
      <div className="space-y-4">
        {/* Meeting Conversion Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" style={{ color: brandColor }} />
              Taxa de Reunião
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold" style={{ color: brandColor }}>
              {meetingRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {funnelStats.reuniao} de {funnelStats.emContato} contatos
            </div>
          </CardContent>
        </Card>

        {/* Total Conversion Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4" style={{ color: brandColor }} />
              Conversão Final
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold" style={{ color: brandColor }}>
              {totalConversionRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {totalConversion} de {totalPhases} leads
            </div>
          </CardContent>
        </Card>

        {/* Meetings per Win */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" style={{ color: brandColor }} />
              Reuniões por Venda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold" style={{ color: brandColor }}>
              {meetingsPerWin.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">
              {funnelStats.reuniao} reuniões ÷ {funnelStats.fechado} vendas
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Chart */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" style={{ color: brandColor }} />
              Funil de Vendas
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Conversão de leads por etapa do processo</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" style={{ color: brandColor }} />
                Progresso da Jornada do Negócio
              </h3>
              <div className="flex items-center gap-8 text-xs text-muted-foreground">
                <span>Conversão Total para a Fase</span>
              </div>
            </div>

            <div className="space-y-4">
              {funnelStages.map((stage, index) => {
                const count = funnelStats[stage.key]
                const prevCount = index === 0 ? count : funnelStats[funnelStages[index - 1].key]
                const stagePercentage = index === 0 ? 100 : prevCount > 0 ? ((count / prevCount) * 100) : 0
                const totalPercentage = totalPhases > 0 ? ((count / totalPhases) * 100) : 0

                // Calculate color intensity based on stage
                const opacity = 1 - (index * 0.15)

                return (
                  <div key={stage.key} className="flex items-center gap-4">
                    <div className="flex items-center gap-3 w-44">
                      <stage.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-base font-semibold">{stage.label}</span>
                    </div>

                    <div className="flex items-center gap-4 flex-1">
                      {/* Progress Bar */}
                      <div className="relative flex-1 h-12 bg-muted rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 flex items-center justify-center"
                          style={{ 
                            width: `${Math.max(totalPercentage, 8)}%`,
                            backgroundColor: brandColor,
                            opacity: opacity
                          }}
                        >
                          <span className="text-sm font-bold text-white px-4">
                            {count.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center gap-8 min-w-[200px] justify-end">
                        <span 
                          className="text-base font-bold w-20 text-right"
                          style={{ color: brandColor }}
                        >
                          {stagePercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
