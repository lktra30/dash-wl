import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um período de datas para exibição em títulos de gráficos
 * @param fromDate Data inicial
 * @param toDate Data final
 * @returns String formatada (ex: "Janeiro - Março 2025" ou "Últimos 12 Meses")
 */
export function formatDateRangeLabel(fromDate?: Date, toDate?: Date): string {
  if (!fromDate || !toDate) {
    return "Últimos 12 Meses"
  }

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  const fromFormatted = formatMonth(fromDate)
  const toFormatted = formatMonth(toDate)

  // Capitaliza primeira letra
  const fromCapitalized = fromFormatted.charAt(0).toUpperCase() + fromFormatted.slice(1)
  const toCapitalized = toFormatted.charAt(0).toUpperCase() + toFormatted.slice(1)

  // Se for o mesmo mês/ano, retorna apenas um
  if (fromFormatted === toFormatted) {
    return fromCapitalized
  }

  // Se for o mesmo ano, omite o ano do primeiro mês
  const fromYear = fromDate.getFullYear()
  const toYear = toDate.getFullYear()
  
  if (fromYear === toYear) {
    const fromMonthOnly = fromDate.toLocaleDateString('pt-BR', { month: 'long' })
    const fromMonthCapitalized = fromMonthOnly.charAt(0).toUpperCase() + fromMonthOnly.slice(1)
    return `${fromMonthCapitalized} - ${toCapitalized}`
  }

  return `${fromCapitalized} - ${toCapitalized}`
}
