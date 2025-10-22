"use client"

import { useEffect, useState } from "react"
import { Trophy, DollarSign } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface TeamRanking {
  id: string
  name: string
  color: string
  rank: number
  totalRevenue: number
  wonDeals: number
  totalDeals: number
  conversionRate: number
  memberCount: number
}

interface TeamCompetitionProps {
  whitelabelId: string
}

export function TeamCompetition({ whitelabelId }: TeamCompetitionProps) {
  const [rankings, setRankings] = useState<TeamRanking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [businessModel, setBusinessModel] = useState<"TCV" | "MRR">("TCV")

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await fetch("/api/teams/rankings")
        if (response.ok) {
          const data = await response.json()
          setRankings(data.rankings || [])
          setBusinessModel(data.businessModel || "TCV")
        }
      } catch (error) {
        setRankings([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRankings()
  }, [whitelabelId])

  if (isLoading) {
    return (
      <div className="col-span-full overflow-hidden rounded-lg bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
        <div className="flex items-center justify-center">
          <Skeleton className="h-64 w-full max-w-5xl" />
        </div>
      </div>
    )
  }

  if (rankings.length < 2) {
    return null
  }

  const topTwo = rankings.slice(0, 2)
  const team1 = topTwo[0]
  const team2 = topTwo[1]

  // Determine label based on business model
  const revenueLabel = businessModel === "MRR" ? "MRR" : "Receita"

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <div className="col-span-full overflow-hidden rounded-lg bg-gradient-to-br">
      {/* Main Competition Container */}
      <div className="relative min-h-[400px] flex items-center justify-center p-8 md:p-12 overflow-hidden">
        {/* Background Glow Effects */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1/2 opacity-10 blur-3xl"
          style={{ backgroundColor: team1.color }}
        />
        <div 
          className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 blur-3xl"
          style={{ backgroundColor: team2.color }}
        />

        {/* Competition Layout */}
        <div className="relative z-10 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-center">
            
            {/* Team 1 - Leader */}
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Team Logo/Badge */}
              <div 
                className="relative w-48 h-48 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105"
                style={{ 
                  backgroundColor: team1.color,
                  boxShadow: `0 20px 60px -15px ${team1.color}80`
                }}
              >
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg border-4 border-background">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <span className="text-6xl font-black text-white drop-shadow-lg">1º</span>
              </div>

              {/* Team Name */}
              <div>
                <h3 className="text-3xl font-black mb-2" style={{ color: team1.color }}>
                  {team1.name}
                </h3>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Líder</p>
              </div>

              {/* Stats */}
              <div className="w-full max-w-sm space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 backdrop-blur border">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" style={{ color: team1.color }} />
                    {revenueLabel}
                  </span>
                  <span className="font-bold text-lg">{formatCurrency(team1.totalRevenue)}</span>
                </div>
              </div>
            </div>

            {/* VS Divider */}
            <div className="flex flex-col items-center justify-center py-8 lg:py-0">
              <div className="relative">
                <div className="text-7xl md:text-8xl font-black bg-gradient-to-br from-primary to-primary/50 bg-clip-text text-transparent">
                  VS
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                  Competição
                </div>
              </div>
            </div>

            {/* Team 2 - Second Place */}
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Team Logo/Badge */}
              <div 
                className="relative w-48 h-48 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105"
                style={{ 
                  backgroundColor: team2.color,
                  boxShadow: `0 20px 60px -15px ${team2.color}80`
                }}
              >
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center shadow-lg border-4 border-background">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <span className="text-6xl font-black text-white drop-shadow-lg">2º</span>
              </div>

              {/* Team Name */}
              <div>
                <h3 className="text-3xl font-black mb-2" style={{ color: team2.color }}>
                  {team2.name}
                </h3>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Desafiante</p>
              </div>

              {/* Stats */}
              <div className="w-full max-w-sm space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 backdrop-blur border">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" style={{ color: team2.color }} />
                    {revenueLabel}
                  </span>
                  <span className="font-bold text-lg">{formatCurrency(team2.totalRevenue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
