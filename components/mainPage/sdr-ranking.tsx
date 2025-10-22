"use client"

import { useEffect, useState } from "react"
import { RankingCard } from "./ranking-card"
import { createSecureDataService } from "@/lib/supabase-data-service"

export function SDRRanking({ limit = 5 }: { limit?: number }) {
  const [ranking, setRanking] = useState<Array<{
    id: string
    name: string
    email: string
    avatarUrl: string | null
    meetingsCount: number
    goalTarget: number
    goalPercentage: number
  }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setIsLoading(true)
        const dataService = createSecureDataService()
        const data = await dataService.getSDRRanking(limit)
        setRanking(data)
      } catch (error) {
        setRanking([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRanking()
  }, [limit])

  const items = ranking.map((sdr) => ({
    id: sdr.id,
    name: sdr.name,
    email: sdr.email,
    avatarUrl: sdr.avatarUrl,
    count: sdr.meetingsCount,
    subtitle: sdr.email,
    goalTarget: sdr.goalTarget,
    goalPercentage: sdr.goalPercentage,
  }))

  return (
    <RankingCard
      title="Top SDRs"
      description="Ranking por reuniões realizadas (negociação, ganhas ou perdidas)"
      items={items}
      isLoading={isLoading}
      emptyMessage="Nenhum SDR com reuniões realizadas"
      countLabel={items.length === 1 ? "reunião" : "reuniões"}
    />
  )
}
