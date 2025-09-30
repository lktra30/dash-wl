"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCard } from "@/components/stats-card"
import { FunnelCard } from "@/components/funnel-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useData } from "@/hooks/use-data"
import { Users, Briefcase, DollarSign, TrendingUp, Trophy, Crown, Target, Zap } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function DashboardPage() {
  const { user, whitelabel } = useAuth()
  const dataService = useData()
  const [stats, setStats] = useState<any>(null)
  const [recentContacts, setRecentContacts] = useState<any[]>([])
  const [recentDeals, setRecentDeals] = useState<any[]>([])
  const [topTeams, setTopTeams] = useState<any[]>([])
  const [competition, setCompetition] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!dataService) return

      setIsLoading(true)
      try {
        const [analytics, contacts, deals, teams, competitions] = await Promise.all([
          dataService.getAnalytics(),
          dataService.getContacts(),
          dataService.getDeals(),
          dataService.getTopTeams(2),
          Promise.resolve(dataService.getActiveCompetitions()),
        ])

        setStats(analytics)
        setRecentContacts(contacts.slice(0, 3))
        setRecentDeals(deals.slice(0, 3))
        setTopTeams(teams)
        setCompetition(competitions[0] || null)
      } catch (error) {
        console.error("[v0] Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [dataService])

  if (!user || !whitelabel) return null

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardHeader title="Dashboard" description={`Welcome back, ${user.name}`} />
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!stats) return null

  return (
    <DashboardLayout>
      <DashboardHeader title="Dashboard" description={`Welcome back, ${user.name}`} />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Contacts"
              value={stats.totalContacts}
              description="Active contacts in your CRM"
              icon={Users}
              trend={{ value: 12, isPositive: true }}
            />
            <StatsCard
              title="Active Deals"
              value={stats.totalDeals}
              description="Deals in your pipeline"
              icon={Briefcase}
              trend={{ value: 8, isPositive: true }}
            />
            <StatsCard
              title="Revenue"
              value={`$${stats.totalRevenue.toLocaleString()}`}
              description="Closed won deals"
              icon={DollarSign}
              trend={{ value: 23, isPositive: true }}
            />
            <StatsCard
              title="Pipeline Value"
              value={`$${stats.pipelineValue.toLocaleString()}`}
              description="Potential revenue"
              icon={TrendingUp}
              trend={{ value: 5, isPositive: true }}
            />
          </div>

          <FunnelCard />

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

          {/* Recent Activity */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Contacts</CardTitle>
                <CardDescription>Latest contacts added to your CRM</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.company}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm capitalize text-muted-foreground">{contact.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Deals</CardTitle>
                <CardDescription>Latest deals in your pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentDeals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{deal.title}</p>
                        <p className="text-sm text-muted-foreground capitalize">{deal.stage.replace("-", " ")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">${deal.value.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
