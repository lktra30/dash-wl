"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Crown, TrendingUp, Users } from "lucide-react"
import { Team } from "@/lib/types"
import Image from "next/image"

interface TeamLeaderboardProps {
  teams: Array<Team & {
    stats: {
      totalRevenue: number
      closedDeals: number
      activeDeals: number
      totalDeals?: number
    }
    members?: Array<{
      id: string
      name: string
      email: string
      avatar_url?: string
    }>
  }>
  brandColor: string
  limit?: number
}

export function TeamLeaderboard({ teams, brandColor, limit = 3 }: TeamLeaderboardProps) {
  // Sort teams by revenue and take top N
  const topTeams = [...teams]
    .sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue)
    .slice(0, limit)

  if (topTeams.length === 0) {
    return null
  }

  return (
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
              className="flex items-center justify-between p-4 rounded-lg border-2 relative overflow-hidden transition-all hover:shadow-md"
              style={{
                borderColor: index === 0 ? brandColor : "hsl(var(--border))",
                backgroundColor: index === 0 ? `${brandColor}05` : "transparent",
              }}
            >
              {index === 0 && (
                <div
                  className="absolute top-0 left-0 w-1 h-full"
                  style={{ backgroundColor: brandColor }}
                />
              )}
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: team.color }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    {team.logoUrl ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0">
                        <Image
                          src={team.logoUrl}
                          alt={team.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: team.color }}
                      >
                        <Users className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {team.name}
                        {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {team.memberIds?.length || 0} {team.memberIds?.length === 1 ? "membro" : "membros"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-2 justify-end">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-bold text-lg">
                    ${team.stats.totalRevenue.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {team.stats.closedDeals} {team.stats.closedDeals === 1 ? "negócio fechado" : "negócios fechados"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
