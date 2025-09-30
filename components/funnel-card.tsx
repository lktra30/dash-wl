"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useData } from "@/hooks/use-data"
import { UserPlus, Phone, Calendar, Handshake, CheckCircle, XCircle, TrendingDown, ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"

const funnelStages = [
  {
    key: "novoLead" as const,
    label: "Novo Lead",
    icon: UserPlus,
    color: "#6366f1",
    description: "Leads recém-capturados",
  },
  {
    key: "emContato" as const,
    label: "Em Contato",
    icon: Phone,
    color: "#8b5cf6",
    description: "Primeiro contato realizado",
  },
  {
    key: "reuniao" as const,
    label: "Reunião",
    icon: Calendar,
    color: "#06b6d4",
    description: "Reunião agendada/realizada",
  },
  {
    key: "emNegociacao" as const,
    label: "Em Negociação",
    icon: Handshake,
    color: "#f59e0b",
    description: "Negociando proposta",
  },
  {
    key: "fechado" as const,
    label: "Fechado",
    icon: CheckCircle,
    color: "#10b981",
    description: "Negócio concluído",
  },
  {
    key: "perdido" as const,
    label: "Perdido",
    icon: XCircle,
    color: "#ef4444",
    description: "Oportunidade perdida",
  },
]

export function FunnelCard() {
  const { whitelabel } = useAuth()
  const dataService = useData()
  const [funnelStats, setFunnelStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      if (!dataService) return

      setIsLoading(true)
      try {
        const stats = await dataService.getFunnelStats()
        setFunnelStats(stats)
      } catch (error) {
        console.error("[v0] Error loading funnel stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [dataService])

  if (isLoading || !funnelStats || !whitelabel) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">Loading funnel data...</p>
        </CardContent>
      </Card>
    )
  }

  const totalLeads = Object.values(funnelStats).reduce((sum, count) => sum + count, 0)
  const conversionRate = totalLeads > 0 ? Math.round((funnelStats.fechado / totalLeads) * 100) : 0

  return (
    <Card className="relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: `linear-gradient(135deg, ${whitelabel.brandColor} 0%, transparent 100%)`,
        }}
      />

      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <TrendingDown className="h-5 w-5" style={{ color: whitelabel.brandColor }} />
              Funil de Vendas
            </CardTitle>
            <CardDescription>Acompanhe seus leads em cada etapa do processo</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{totalLeads}</div>
            <div className="text-sm text-muted-foreground">Total de Leads</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative">
        <div className="space-y-4">
          {funnelStages.map((stage, index) => {
            const count = funnelStats[stage.key]
            const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
            const isLast = index === funnelStages.length - 1

            return (
              <div key={stage.key}>
                <div className="flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg shadow-sm" style={{ backgroundColor: `${stage.color}15` }}>
                      <stage.icon className="h-5 w-5" style={{ color: stage.color }} />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{stage.label}</div>
                      <div className="text-sm text-muted-foreground">{stage.description}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: stage.color }}>
                        {count}
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `${stage.color}15`,
                          color: stage.color,
                          border: `1px solid ${stage.color}30`,
                        }}
                      >
                        {percentage}%
                      </Badge>
                    </div>

                    {/* Progress bar */}
                    <div className="w-20">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: stage.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow connector */}
                {!isLast && index < 4 && (
                  <div className="flex justify-center py-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Conversion rate summary */}
        <div
          className="mt-6 p-4 rounded-lg border-2 border-dashed"
          style={{ borderColor: `${whitelabel.brandColor}40` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-foreground">Taxa de Conversão</div>
              <div className="text-sm text-muted-foreground">
                {funnelStats.fechado} de {totalLeads} leads convertidos
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold" style={{ color: whitelabel.brandColor }}>
                {conversionRate}%
              </div>
              <div className="text-sm text-muted-foreground">conversão</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
