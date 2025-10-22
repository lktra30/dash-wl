"use client"

import { useState } from "react"
import { DealCard } from "./deal-card"
import { DealsStatsSidebar } from "./deals-stats-sidebar"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"

interface Deal {
  id: string
  title: string
  value: number
  status: "open" | "won" | "lost"
  created_at: string
  contacts: {
    id: string
    name: string
    company?: string
  } | null
  sdr: {
    id: string
    name: string
  } | null
  closer: {
    id: string
    name: string
  } | null
}

interface DealsGridProps {
  deals: Deal[]
  isLoading?: boolean
}

export function DealsGrid({ deals, isLoading }: DealsGridProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "won" | "lost">("all")
  const [sortBy, setSortBy] = useState<"value" | "date">("date")

  // Filter to show only closed deals (won or lost), not open deals
  const closedDeals = deals.filter((deal) => deal.status === "won" || deal.status === "lost")

  // Apply search and status filters
  const filteredDeals = closedDeals.filter((deal) => {
    const matchesSearch =
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.contacts?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.contacts?.company?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || deal.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Sort deals
  const sortedDeals = [...filteredDeals].sort((a, b) => {
    if (sortBy === "value") {
      return b.value - a.value // Descending by default for value
    } else {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateB - dateA // Most recent first
    }
  })

  // Calculate stats for closed deals only
  const closedStats = {
    totalCount: closedDeals.length,
    wonCount: closedDeals.filter((d) => d.status === "won").length,
    lostCount: closedDeals.filter((d) => d.status === "lost").length,
    wonValue: closedDeals
      .filter((d) => d.status === "won")
      .reduce((sum, d) => sum + Number(d.value || 0), 0),
    conversionRate:
      closedDeals.length > 0
        ? (closedDeals.filter((d) => d.status === "won").length / closedDeals.length) * 100
        : 0,
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-lg border bg-card animate-pulse" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-1">
          <DealsStatsSidebar stats={closedStats} isLoading={true} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, contato ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="won">Ganhos</SelectItem>
            <SelectItem value="lost">Perdidos</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Data (Recente)</SelectItem>
            <SelectItem value="value">Valor (Maior)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid Layout with fixed stats and scrollable deals */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Deals Cards - 3 columns - Scrollable */}
        <div className="lg:col-span-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {sortedDeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground text-center">
                {searchTerm || statusFilter !== "all"
                  ? "Nenhum negócio encontrado com os filtros aplicados"
                  : "Nenhum negócio fechado ainda"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Negócios ganhos e perdidos aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {sortedDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal as any} />
              ))}
            </div>
          )}
        </div>

        {/* Stats Sidebar - 1 column - Fixed */}
        <div className="lg:col-span-1">
          <DealsStatsSidebar stats={closedStats} isLoading={false} />
        </div>
      </div>

      {/* Results Count */}
      {sortedDeals.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Mostrando {sortedDeals.length} de {closedDeals.length} negócios fechados
        </div>
      )}
    </div>
  )
}
