"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"

interface RankingItem {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  count: number
  subtitle?: string
  goalTarget?: number
  goalPercentage?: number
}

interface RankingCardProps {
  title: string
  description: string
  items: RankingItem[]
  isLoading?: boolean
  emptyMessage?: string
  countLabel?: string
  isCurrencyMode?: boolean
}

export function RankingCard({
  title,
  description,
  items,
  isLoading = false,
  emptyMessage = "Nenhum dado disponível",
  countLabel = "pontos",
  isCurrencyMode = false,
}: RankingCardProps) {
  const { brandColor } = useTheme()
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatValue = (value: number) => {
    return isCurrencyMode ? formatCurrency(value) : value.toString()
  }
  
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 2:
        return <Award className="h-5 w-5 text-amber-700" />
      default:
        return null
    }
  }

  const getRankBadgeVariant = (index: number) => {
    switch (index) {
      case 0:
        return "default"
      case 1:
        return "secondary"
      case 2:
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" style={{ color: brandColor }} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-[40px]">
                  {getRankIcon(index)}
                  {!getRankIcon(index) && (
                    <span className="text-sm font-medium text-muted-foreground w-6 text-center">
                      {index + 1}
                    </span>
                  )}
                </div>
                
                <Avatar className="h-10 w-10">
                  <AvatarImage src={item.avatarUrl || undefined} alt={item.name} />
                  <AvatarFallback>
                    {item.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  {item.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  )}
                  {item.goalTarget !== undefined && item.goalPercentage !== undefined && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Meta mensal: {formatValue(item.count)} / {formatValue(item.goalTarget)}
                        </span>
                        <span className="font-medium" style={{ color: brandColor }}>
                          {item.goalPercentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div 
                          className="h-full transition-all"
                          style={{ 
                            width: `${Math.min(item.goalPercentage, 100)}%`,
                            backgroundColor: brandColor
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Badge 
                  variant="outline" 
                  className="shrink-0 border-2 font-semibold"
                  style={{ 
                    borderColor: brandColor,
                    color: brandColor,
                    backgroundColor: `${brandColor}10`
                  }}
                >
                  {isCurrencyMode ? formatCurrency(item.count) : `${item.count} ${countLabel}`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
