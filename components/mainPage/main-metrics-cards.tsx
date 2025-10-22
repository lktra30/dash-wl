"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Receipt } from "lucide-react"
import { MainPageMetrics, formatCurrency } from "./main-page-calculations"

interface MainMetricsCardsProps {
  metrics: MainPageMetrics
  isLoading?: boolean
  brandColor?: string
}

export function MainMetricsCards({ metrics, isLoading, brandColor = "#3b82f6" }: MainMetricsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-lg border bg-card animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Total Sales Card */}
      <Card className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5" 
          style={{ 
            background: `linear-gradient(135deg, ${brandColor} 0%, transparent 100%)` 
          }}
        />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {metrics.totalSales.label}
          </CardTitle>
          <div 
            className="p-2 rounded-lg" 
            style={{ backgroundColor: `${brandColor}15` }}
          >
            <DollarSign className="h-5 w-5" style={{ color: brandColor }} />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold" style={{ color: brandColor }}>
            {formatCurrency(metrics.totalSales.value)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.totalSales.label.includes("MRR")
              ? "Receita recorrente mensal"
              : "Valor total de negócios fechados"}
          </p>
          {metrics.totalSales.trend && metrics.totalSales.trend.value > 0 && (
            <p className={`text-xs mt-2 font-semibold ${metrics.totalSales.trend.isPositive ? "text-green-600" : "text-red-600"}`}>
              {metrics.totalSales.trend.isPositive ? "↑" : "↓"} {metrics.totalSales.trend.value}% vs. período anterior
            </p>
          )}
        </CardContent>
      </Card>

      {/* Average Ticket Card */}
      <Card className="relative overflow-hidden border">
        <div 
          className="absolute inset-0 opacity-5" 
          style={{ 
            background: `linear-gradient(135deg, ${brandColor} 0%, transparent 100%)` 
          }}
        />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {metrics.averageTicket.label}
          </CardTitle>
          <div 
            className="p-2 rounded-lg" 
            style={{ backgroundColor: `${brandColor}15` }}
          >
            <Receipt className="h-5 w-5" style={{ color: brandColor }} />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold" style={{ color: brandColor }}>
            {formatCurrency(metrics.averageTicket.value)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.averageTicket.label.includes("MRR")
              ? "MRR médio por cliente"
              : "Valor médio por cliente"}
          </p>
          {metrics.averageTicket.trend && metrics.averageTicket.trend.value > 0 && (
            <p className={`text-xs mt-2 font-semibold ${metrics.averageTicket.trend.isPositive ? "text-green-600" : "text-red-600"}`}>
              {metrics.averageTicket.trend.isPositive ? "↑" : "↓"} {metrics.averageTicket.trend.value}% vs. período anterior
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
