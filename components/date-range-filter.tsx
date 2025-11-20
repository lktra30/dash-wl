"use client"

import * as React from "react"
import { Calendar } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type DateRangePreset = 
  | "today" 
  | "yesterday" 
  | "7d" 
  | "14d" 
  | "30d" 
  | "this_month" 
  | "90d" 
  | "6m" 
  | "1y"

export interface DateRangeFilterValue {
  preset: DateRangePreset
  from: Date
  to: Date
}

interface DateRangeFilterProps {
  value: DateRangeFilterValue
  onChange: (value: DateRangeFilterValue) => void
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const handlePresetChange = (preset: DateRangePreset) => {
    const now = new Date()
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    let from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)

    switch (preset) {
      case "today":
        // from já está definido como hoje às 00:00
        break
      case "yesterday":
        from.setDate(from.getDate() - 1)
        to.setDate(to.getDate() - 1)
        break
      case "7d":
        from.setDate(to.getDate() - 6) // Últimos 7 dias incluindo hoje
        from.setHours(0, 0, 0, 0)
        break
      case "14d":
        from.setDate(to.getDate() - 13) // Últimos 14 dias incluindo hoje
        from.setHours(0, 0, 0, 0)
        break
      case "30d":
        from.setDate(to.getDate() - 29) // Últimos 30 dias incluindo hoje
        from.setHours(0, 0, 0, 0)
        break
      case "this_month":
        // Primeiro dia do mês atual
        from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
        break
      case "90d":
        from.setDate(to.getDate() - 89) // Últimos 90 dias incluindo hoje
        from.setHours(0, 0, 0, 0)
        break
      case "6m":
        // 6 meses atrás
        from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate(), 0, 0, 0, 0)
        break
      case "1y":
        // 1 ano atrás
        from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0, 0)
        break
    }

    onChange({ preset, from, to })
  }

  const presetLabels: Record<DateRangePreset, string> = {
    today: "Hoje",
    yesterday: "Ontem",
    "7d": "Últimos 7 dias",
    "14d": "Últimos 14 dias",
    "30d": "Últimos 30 dias",
    this_month: "Este mês",
    "90d": "Últimos 90 dias",
    "6m": "Último semestre",
    "1y": "Último ano",
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <Select value={value.preset} onValueChange={(val) => handlePresetChange(val as DateRangePreset)}>
        <SelectTrigger className="w-[130px] sm:w-[180px] cursor-pointer">
          <SelectValue placeholder="Selecionar período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">{presetLabels.today}</SelectItem>
          <SelectItem value="yesterday">{presetLabels.yesterday}</SelectItem>
          <SelectItem value="7d">{presetLabels["7d"]}</SelectItem>
          <SelectItem value="14d">{presetLabels["14d"]}</SelectItem>
          <SelectItem value="30d">{presetLabels["30d"]}</SelectItem>
          <SelectItem value="this_month">{presetLabels.this_month}</SelectItem>
          <SelectItem value="90d">{presetLabels["90d"]}</SelectItem>
          <SelectItem value="6m">{presetLabels["6m"]}</SelectItem>
          <SelectItem value="1y">{presetLabels["1y"]}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export function getDefaultDateRange(): DateRangeFilterValue {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0) // Primeiro dia do mês
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999) // Hoje fim do dia

  return {
    preset: "this_month",
    from,
    to,
  }
}
