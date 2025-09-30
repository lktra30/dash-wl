"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useData } from "@/hooks/use-data"
import { Users, Trophy, Plus, Crown, TrendingUp } from "lucide-react"
import { useMemo } from "react"

export default function TeamsPage() {
  const { user, whitelabel } = useAuth()
  const dataService = useData()

  const { teams, topTeams, competition, teamStats } = useMemo(() => {
    if (!dataService) {
      return { teams: [], topTeams: [], competition: null, teamStats: [] }
    }

    const allTeams = dataService.getTeams()
    const topPerformers = dataService.getTopTeams(2)
    const activeCompetition = dataService.getActiveCompetitions()[0] || null
    const stats = dataService.getTeamStats()

    return {
      teams: allTeams,
      topTeams: topPerformers,
      competition: activeCompetition,
      teamStats: stats,
    }
  }, [dataService])

  if (!user || !whitelabel) return null

  const users = dataService?.getUsers() || []

  return (
    <DashboardLayout>
      <DashboardHeader title="Equipes de Vendas" description="Gerencie suas equipes e acompanhe a competição">
        {user.role === "admin" && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Equipe
          </Button>
        )}
      </DashboardHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Competition Banner */}
          {competition && (
            <Card className="border-2" style={{ borderColor: whitelabel.brandColor }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${whitelabel.brandColor}20` }}>
                    <Trophy className="h-6 w-6" style={{ color: whitelabel.brandColor }} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{competition.name}</CardTitle>
                    <CardDescription>{competition.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-sm">
                      {competition.type === "revenue" ? "Por Receita" : "Por Negócios"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {competition.startDate.toLocaleDateString()} - {competition.endDate.toLocaleDateString()}
                    </span>
                  </div>
                  <Badge className="text-white" style={{ backgroundColor: whitelabel.brandColor }}>
                    Ativa
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Teams Leaderboard */}
          {topTeams.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Ranking das Equipes
                </CardTitle>
                <CardDescription>As equipes que mais estão vendendo este mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topTeams.map((team, index) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between p-4 rounded-lg border-2 relative overflow-hidden"
                      style={{
                        borderColor: index === 0 ? whitelabel.brandColor : "hsl(var(--border))",
                        backgroundColor: index === 0 ? `${whitelabel.brandColor}05` : "transparent",
                      }}
                    >
                      {index === 0 && (
                        <div
                          className="absolute top-0 left-0 w-1 h-full"
                          style={{ backgroundColor: whitelabel.brandColor }}
                        />
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: team.color }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {team.name}
                              {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                            </h3>
                            <p className="text-sm text-muted-foreground">{team.memberIds.length} membros</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="font-bold text-lg">${team.stats.totalRevenue.toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{team.stats.closedDeals} negócios fechados</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Teams Grid */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Todas as Equipes</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => {
                const teamMembers = users.filter((u) => team.memberIds.includes(u.id))
                const leader = users.find((u) => u.id === team.leaderId)
                const stats = teamStats.find((s) => s.teamId === team.id)

                return (
                  <Card key={team.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: team.color }}
                          >
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{team.name}</CardTitle>
                            <CardDescription className="text-sm">{team.memberIds.length} membros</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {team.description && <p className="text-sm text-muted-foreground">{team.description}</p>}

                        {leader && (
                          <div>
                            <p className="text-sm font-medium mb-1">Líder da Equipe</p>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-medium"
                                style={{ backgroundColor: team.color }}
                              >
                                {leader.name.charAt(0)}
                              </div>
                              <span className="text-sm">{leader.name}</span>
                            </div>
                          </div>
                        )}

                        {stats && (
                          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                            <div>
                              <p className="text-xs text-muted-foreground">Receita</p>
                              <p className="font-semibold">${stats.totalRevenue.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Negócios</p>
                              <p className="font-semibold">{stats.closedDeals}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1">
                          {teamMembers.slice(0, 3).map((member) => (
                            <div
                              key={member.id}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-medium"
                              style={{ backgroundColor: team.color }}
                              title={member.name}
                            >
                              {member.name.charAt(0)}
                            </div>
                          ))}
                          {teamMembers.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                              +{teamMembers.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
