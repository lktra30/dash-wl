"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BarChart2, ArrowUpDown } from "lucide-react"
import type { GoogleCampaignData } from "@/lib/types"

interface GoogleAdsCampaignTableProps {
  campaigns: GoogleCampaignData[]
  brandColor?: string
}

type SortField = "name" | "spend" | "roas" | "roi" | "clicks" | "conversions" | "conversionRate"
type SortDirection = "asc" | "desc"

export function GoogleAdsCampaignTable({ campaigns, brandColor = "#6366f1" }: GoogleAdsCampaignTableProps) {
  const [sortField, setSortField] = useState<SortField>("spend")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue)
    }
    
    const aNum = Number(aValue)
    const bNum = Number(bValue)
    return sortDirection === "asc" ? aNum - bNum : bNum - aNum
  })

  const getROASBadge = (roas: number) => {
    if (roas >= 3) return { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", label: "Excelente" }
    if (roas >= 2) return { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", label: "Bom" }
    if (roas >= 1) return { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", label: "Regular" }
    return { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", label: "Fraco" }
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5" style={{ color: brandColor }} />
          Performance de Campanhas
        </CardTitle>
        <CardDescription>
          Métricas detalhadas de performance para cada campanha
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="name">Campanha</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="spend">Gasto</SortButton>
                </TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">
                  <SortButton field="roas">ROAS</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="roi">ROI</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="clicks">Cliques</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="conversions">Conversões</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="conversionRate">Taxa Conv.</SortButton>
                </TableHead>
                <TableHead className="text-right">CPC</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    Nenhum dado de campanha disponível
                  </TableCell>
                </TableRow>
              ) : (
                sortedCampaigns.map((campaign) => {
                  const roasBadge = getROASBadge(campaign.roas)
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium max-w-[200px] truncate" title={campaign.name}>
                        {campaign.name}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {campaign.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {campaign.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-semibold" style={{ color: brandColor }}>
                        {campaign.roas.toFixed(2)}x
                      </TableCell>
                      <TableCell className="text-right">
                        {campaign.roi.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {campaign.clicks.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        {campaign.conversions.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        {campaign.conversionRate.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {campaign.cpc.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {campaign.ctr.toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <Badge className={roasBadge.color}>
                          {roasBadge.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
