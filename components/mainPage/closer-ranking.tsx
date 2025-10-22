"use client"

import { useEffect, useState } from "react"
import { RankingCard } from "./ranking-card"
import { createSecureDataService } from "@/lib/supabase-data-service"

export function CloserRanking({ limit = 5 }: { limit?: number }) {
  const [ranking, setRanking] = useState<Array<{
    id: string
    name: string
    email: string
    avatarUrl: string | null
    closedDealsCount: number
    totalRevenue: number
    goalTarget: number
    goalPercentage: number
  }>>([])
  const [businessModel, setBusinessModel] = useState<"TCV" | "MRR">("TCV")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setIsLoading(true)
        const dataService = createSecureDataService()
        const data = await dataService.getCloserRanking(limit)
        setRanking(data.ranking)
        setBusinessModel(data.businessModel)
      } catch (error) {
        setRanking([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRanking()
  }, [limit])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  // Determine labels based on business model
  const revenueLabel = businessModel === "MRR" ? "MRR" : "vendas"
  const descriptionText = businessModel === "MRR" 
    ? "Ranking por MRR (receita recorrente mensal)"
    : "Ranking por vendas fechadas (status won)"

  const items = ranking.map((closer) => ({
    id: closer.id,
    name: closer.name,
    email: closer.email,
    avatarUrl: closer.avatarUrl,
    count: closer.totalRevenue,
    subtitle: `${formatCurrency(closer.totalRevenue)} em ${revenueLabel}`,
    goalTarget: closer.goalTarget,
    goalPercentage: closer.goalPercentage,
  }))

  return (
    <RankingCard
      title="Top Closers"
      description={descriptionText}
      items={items}
      isLoading={isLoading}
      emptyMessage="Nenhum closer com vendas fechadas"
      isCurrencyMode={true}
    />
  )
}
