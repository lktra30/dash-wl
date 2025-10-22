"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building, Calendar, User } from "lucide-react"
import { formatCurrency } from "@/components/mainPage/main-page-calculations"

interface DealCardProps {
  deal: {
    id: string
    title: string
    value: number
    status: "won" | "lost"
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
}

export function DealCard({ deal }: DealCardProps) {
  const isWon = deal.status === "won"
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <Card 
      className={`group hover:shadow-lg transition-all duration-300 border-2 ${
        isWon 
          ? "hover:border-green-600/50 hover:shadow-green-900/50" 
          : "hover:border-red-600/50 hover:shadow-red-900/50"
      }`}
    >
      <CardContent className="p-6">
        {/* Header: Status Badge + Team Members */}
        <div className="flex items-start justify-between mb-4">
          <Badge 
            className={`${
              isWon 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
            }`}
          >
            {isWon ? "🏆 Ganho" : "❌ Perdido"}
          </Badge>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {deal.sdr && (
              <div className="flex items-center gap-1" title={`SDR: ${deal.sdr.name}`}>
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    {deal.sdr.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            {deal.closer && (
              <div className="flex items-center gap-1" title={`Closer: ${deal.closer.name}`}>
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    {deal.closer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {deal.title}
        </h3>

        {/* Contact Info */}
        <div className="space-y-1 mb-4">
          {deal.contacts && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{deal.contacts.name}</span>
              </div>
              {deal.contacts.company && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-3 w-3" />
                  <span>{deal.contacts.company}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Value - Prominent Display */}
        <div className={`my-4 py-3 px-4 rounded-lg ${
          isWon 
            ? "bg-green-50 dark:bg-green-950/30" 
            : "bg-red-50 dark:bg-red-950/30"
        }`}>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              isWon ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
            }`}>
              {formatCurrency(deal.value)}
            </div>
          </div>
        </div>

        {/* Footer: Date + Team Info */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(deal.created_at)}</span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {deal.sdr && deal.closer && (
              <span className="hidden sm:inline">
                {deal.sdr.name.split(' ')[0]} → {deal.closer.name.split(' ')[0]}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
