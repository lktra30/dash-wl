"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
// import { StatsCard } from "@/components/stats-card"
import { MainMetricsCards, calculateMainPageMetrics, TeamCompetition } from "@/components/mainPage"
import { MeetingsGoalProgress, SalesGoalProgress } from "@/components/goals"
import { MetaAdsMainCards, MetaAdsDailyChart } from "@/components/ads"
import { PipelineComparisonCard } from "@/components/pipelines/pipeline-comparison-card"
import { SDRRanking } from "@/components/mainPage/sdr-ranking"
import { CloserRanking } from "@/components/mainPage/closer-ranking"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { Users, Briefcase, DollarSign, TrendingUp, Trophy, Crown, Target, Zap } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import type { MetaAdsMetrics, MetaAdsTimeSeriesData } from "@/lib/types"

type DateRangeFilterValue = { from: Date; to: Date }

// Função para obter o intervalo do mês atual
function getCurrentMonthRange(): DateRangeFilterValue {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  
  return {
    from: firstDay,
    to: lastDay
  }
}

export default function DashboardPage() {
  const { user, whitelabel, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [mainMetrics, setMainMetrics] = useState<any>(null)
  const [recentContacts, setRecentContacts] = useState<any[]>([])
  const [recentDeals, setRecentDeals] = useState<any[]>([])
  const [topTeams, setTopTeams] = useState<any[]>([])
  const [competition, setCompetition] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange] = useState<DateRangeFilterValue>(getCurrentMonthRange())
  
  // Meta Ads state
  const [metaAdsMetrics, setMetaAdsMetrics] = useState<MetaAdsMetrics | null>(null)
  const [metaAdsTimeSeries, setMetaAdsTimeSeries] = useState<MetaAdsTimeSeriesData[]>([])
  const [isMetaAdsLoading, setIsMetaAdsLoading] = useState(true)

  // Pipeline Metrics state
  const [pipelineMetrics, setPipelineMetrics] = useState<any[]>([])
  const [isPipelineMetricsLoading, setIsPipelineMetricsLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      // Wait for auth to complete and ensure user exists
      if (authLoading || !user) return

      setIsLoading(true)
      try {
        // Use the secure API endpoint instead of direct Supabase calls
        const params = new URLSearchParams({
          from: dateRange.from.toISOString().split('T')[0],
          to: dateRange.to.toISOString().split('T')[0]
        })

        const response = await fetch(`/api/dashboard?${params}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to fetch dashboard data: ${response.statusText} - ${errorText}`)
        }

        const data = await response.json()
        
        setStats(data.analytics)
        setRecentContacts(data.contacts.slice(0, 3))
        setRecentDeals((data.recentDeals || data.deals || []).slice(0, 3))
        setTopTeams(data.topTeams)
        setCompetition(data.competitions[0] || null)
        
        // Calculate main page metrics
        if (whitelabel && data.deals && data.contacts) {
          const metrics = calculateMainPageMetrics({
            deals: data.deals,
            contacts: data.contacts,
            adSpend: data.adSpend || 0,
            previousPeriodData: data.previousPeriodData,
            businessModel: whitelabel.businessModel || "TCV",
          })
          setMainMetrics(metrics)
        }
      } catch (error) {
        setStats(null)
        setRecentContacts([])
        setRecentDeals([])
        setTopTeams([])
        setCompetition(null)
        setMainMetrics(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user, authLoading, whitelabel, dateRange])

  // Load Meta Ads data - Cards and Chart both filtered by dateRange (current month)
  useEffect(() => {
    const loadMetaAdsData = async () => {
      if (authLoading || !user) return

      setIsMetaAdsLoading(true)
      try {
        // Fetch cards data (filtered by date range)
        const cardsParams = new URLSearchParams({
          type: "cards",
          from: dateRange.from.toISOString().split('T')[0],
          to: dateRange.to.toISOString().split('T')[0]
        })
        
        const cardsResponse = await fetch(`/api/dashboard/ads?${cardsParams}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        // Fetch chart data (also filtered by current month)
        const chartParams = new URLSearchParams({
          type: "chart",
          from: dateRange.from.toISOString().split('T')[0],
          to: dateRange.to.toISOString().split('T')[0]
        })
        
        const chartResponse = await fetch(`/api/dashboard/ads?${chartParams}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (cardsResponse.ok && chartResponse.ok) {
          const cardsData = await cardsResponse.json()
          const chartData = await chartResponse.json()
          
          if (cardsData.success) {
            setMetaAdsMetrics(cardsData.metrics)
          }
          if (chartData.success) {
            setMetaAdsTimeSeries(chartData.timeSeries)
          }
        } else {
          setMetaAdsMetrics(null)
          setMetaAdsTimeSeries([])
        }
      } catch (error) {
        setMetaAdsMetrics(null)
        setMetaAdsTimeSeries([])
        // Silently ignore errors - Meta Ads is optional
      } finally {
        setIsMetaAdsLoading(false)
      }
    }

    loadMetaAdsData()
  }, [user, authLoading, dateRange])

  // Load Pipeline Metrics data
  useEffect(() => {
    const loadPipelineMetrics = async () => {
      if (authLoading || !user) return

      setIsPipelineMetricsLoading(true)
      try {
        const params = new URLSearchParams({
          from: dateRange.from.toISOString().split('T')[0],
          to: dateRange.to.toISOString().split('T')[0]
        })

        const response = await fetch(`/api/dashboard/pipeline-metrics?${params}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setPipelineMetrics(data)
        } else {
          setPipelineMetrics([])
        }
      } catch (error) {
        setPipelineMetrics([])
        // Silently ignore errors
      } finally {
        setIsPipelineMetricsLoading(false)
      }
    }

    loadPipelineMetrics()
  }, [user, authLoading, dateRange])

  if (authLoading) {
    return (
      <DashboardLayout>
        <DashboardHeader title="Painel Comercial" description="Carregando..." />
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Autenticando...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user || !whitelabel) return null

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardHeader title="Painel Comercial" description={`Bem-vindo, ${user.name}`} />
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!stats) return null

  return (
    <DashboardLayout>
      <DashboardHeader title="Dashboard" description={`Bem-vindo, ${user.name}`} />

      <div className="flex-1 overflow-auto p-6 space-y-6 ">

        {whitelabel.teamCompetition && (
            <div className="space-y-4">
              <TeamCompetition whitelabelId={user.whitelabelId} />
            </div>
        )}

        <div className="space-y-6">
          {/* Goals Progress Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MeetingsGoalProgress whitelabelId={user.whitelabelId} />
            <SalesGoalProgress whitelabelId={user.whitelabelId} />
          </div>
          
          {/* Main Metrics Grid - New Feature */}
          {mainMetrics ? (
            <MainMetricsCards metrics={mainMetrics} isLoading={false} brandColor={whitelabel.brandColor} />
          ) : (
            <MainMetricsCards metrics={null as any} isLoading={true} brandColor={whitelabel.brandColor} />
          )}

          {/* Pipeline Comparison Section */}
          <div className="space-y-4">
            <PipelineComparisonCard
              pipelines={pipelineMetrics}
              brandColor={whitelabel.brandColor}
              isLoading={isPipelineMetricsLoading}
            />
          </div>

          {/* Meta Ads Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Meta Ads</h2>
                <p className="text-muted-foreground">Métricas de desempenho dos anúncios do Facebook</p>
              </div>
              {/* <Link href="/dashboard/Ads">
                <button
                  className="px-4 py-2 rounded-lg text-white font-medium text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ backgroundColor: whitelabel.brandColor }}
                >
                  Ver Detalhes →
                </button>
              </Link> */}
            </div>
            
            <MetaAdsMainCards 
              metrics={metaAdsMetrics} 
              isLoading={isMetaAdsLoading} 
                brandColor={whitelabel.brandColor}
              roas={mainMetrics?.roas.value}
            />
            
            <MetaAdsDailyChart 
              data={metaAdsTimeSeries} 
              brandColor={whitelabel.brandColor}
              isLoading={isMetaAdsLoading}
            />
          </div>

          {/* Rankings Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Rankings de Performance</h2>
              <p className="text-muted-foreground">Top performers de SDRs e Closers</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SDRRanking limit={5} />
              <CloserRanking limit={5} />
            </div>
          </div>

          {/* Team Competition Section - Only if enabled and 2+ teams */}

          {/* Team Competition Section */}
          {competition && topTeams.length > 0 && (
            <Card className="relative overflow-hidden border-2" style={{ borderColor: whitelabel.brandColor }}>
              {/* Animated background gradient */}
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  background: `linear-gradient(135deg, ${whitelabel.brandColor} 0%, transparent 50%, ${whitelabel.brandColor} 100%)`,
                }}
              />

              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-xl shadow-lg"
                      style={{
                        backgroundColor: whitelabel.brandColor,
                        boxShadow: `0 8px 25px ${whitelabel.brandColor}40`,
                      }}
                    >
                      <Trophy className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        🔥 {competition.name}
                        <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />
                      </CardTitle>
                      <CardDescription className="text-base">{competition.description}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    className="text-white font-semibold px-4 py-2 text-sm animate-pulse"
                    style={{ backgroundColor: whitelabel.brandColor }}
                  >
                    🏆 ATIVA
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="relative">
                <div className="grid md:grid-cols-2 gap-6">
                  {topTeams.map((team, index) => (
                    <div
                      key={team.id}
                      className="relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                      style={{
                        borderColor: index === 0 ? whitelabel.brandColor : team.color,
                        backgroundColor: index === 0 ? `${whitelabel.brandColor}08` : `${team.color}08`,
                        boxShadow: index === 0 ? `0 8px 25px ${whitelabel.brandColor}20` : `0 4px 15px ${team.color}20`,
                      }}
                    >
                      {/* Winner crown */}
                      {index === 0 && (
                        <div className="absolute -top-3 -right-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg animate-bounce"
                            style={{ backgroundColor: whitelabel.brandColor }}
                          >
                            <Crown className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Position badge */}
                      <div className="absolute top-4 left-4">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                          style={{ backgroundColor: index === 0 ? whitelabel.brandColor : team.color }}
                        >
                          {index + 1}
                        </div>
                      </div>

                      <div className="pt-8">
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: team.color }}
                          >
                            <Users className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-xl">{team.name}</h3>
                            <p className="text-sm text-muted-foreground">{team.memberIds.length} membros</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Receita Total</span>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className="font-bold text-xl">${team.stats.totalRevenue.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Negócios Fechados</span>
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" style={{ color: team.color }} />
                              <span className="font-semibold text-lg">{team.stats.closedDeals}</span>
                            </div>
                          </div>

                          {/* Progress bar for visual impact */}
                          <div className="mt-4">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Meta do Mês</span>
                              <span>{Math.round((team.stats.totalRevenue / 150000) * 100)}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-1000 ease-out"
                                style={{
                                  width: `${Math.min((team.stats.totalRevenue / 150000) * 100, 100)}%`,
                                  backgroundColor: index === 0 ? whitelabel.brandColor : team.color,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <Link href="/dashboard/teams">
                    <button
                      className="px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      style={{ backgroundColor: whitelabel.brandColor }}
                    >
                      Ver Todas as Equipes →
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
