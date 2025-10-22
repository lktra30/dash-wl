import { Deal, Contact } from "@/lib/types"

/**
 * Interface for main page metrics data
 */
export interface MainPageMetrics {
  totalSales: {
    value: number
    trend: { value: number; isPositive: boolean }
    label: string // Will be "Total em Vendas" or "MRR Total"
  }
  averageTicket: {
    value: number
    trend: { value: number; isPositive: boolean }
    label: string // Will be "Ticket Médio" or "MRR Médio"
  }
  cac: {
    value: number
    trend: { value: number; isPositive: boolean }
  }
  roas: {
    value: number
    trend: { value: number; isPositive: boolean }
  }
}

/**
 * Interface for input data needed for calculations
 */
export interface MainPageCalculationInput {
  deals: Deal[]
  contacts: Contact[]
  adSpend: number // Total ad spend for the period
  previousPeriodData?: {
    totalSales: number
    averageTicket: number
    cac: number
    roas: number
    adSpend: number
  }
  businessModel: "TCV" | "MRR" // From whitelabel settings
}

/**
 * Calculate the trend percentage between current and previous values
 */
function calculateTrend(current: number, previous: number): { value: number; isPositive: boolean } {
  if (previous === 0) {
    return { value: 0, isPositive: true }
  }
  
  const percentChange = ((current - previous) / previous) * 100
  return {
    value: Math.abs(Math.round(percentChange * 10) / 10), // Round to 1 decimal place
    isPositive: percentChange >= 0,
  }
}

/**
 * Calculate Total Sales based on business model
 * - TCV (Total Contract Value): Sum of total deal values for all won deals
 * - MRR (Monthly Recurring Revenue): Sum of (deal value / duration) for all won deals with duration > 0
 */
function calculateTotalSales(deals: Deal[], businessModel: "TCV" | "MRR"): number {
  const wonDeals = deals.filter((deal) => deal.status === "won")
  
  if (businessModel === "TCV") {
    // TCV: sum the total values of all won deals (Total Contract Value)
    return wonDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0)
  } else {
    // MRR: divide each deal value by its duration to get monthly recurring revenue, then sum
    return wonDeals.reduce((sum, deal) => {
      const value = Number(deal.value || 0)
      const duration = Number(deal.duration || 0)
      
      // Only include deals with valid duration > 0
      if (duration > 0) {
        return sum + (value / duration)
      }
      return sum
    }, 0)
  }
}

/**
 * Calculate Average Ticket based on business model
 * - TCV: Total sales / Number of unique customers (contacts with won deals)
 * - MRR: Total sales / Number of unique customers (contacts with won deals)
 */
function calculateAverageTicket(deals: Deal[], businessModel: "TCV" | "MRR"): number {
  const wonDeals = deals.filter((deal) => deal.status === "won")
  
  // Get unique customer count (unique contact IDs from won deals)
  const uniqueCustomers = new Set(wonDeals.map((deal) => deal.contactId)).size
  
  if (uniqueCustomers === 0) return 0
  
  // Calculate total sales
  const totalSales = calculateTotalSales(deals, businessModel)
  
  // Average ticket is total sales divided by number of unique customers
  return totalSales / uniqueCustomers
}

/**
 * Calculate CAC (Customer Acquisition Cost)
 * CAC = Total ad spend / Number of new customers acquired
 * 
 * Note: CAC is independent of TCV/MRR business model
 */
function calculateCAC(adSpend: number, contacts: Contact[], deals: Deal[]): number {
  // Count new customers (contacts that have at least one won deal)
  const wonDealContactIds = new Set(
    deals.filter((deal) => deal.status === "won").map((deal) => deal.contactId)
  )
  
  const newCustomers = contacts.filter((contact) => wonDealContactIds.has(contact.id)).length
  
  if (newCustomers === 0) return 0
  
  return adSpend / newCustomers
}

/**
 * Calculate ROAS (Return on Ad Spend)
 * ROAS = Total revenue / Total ad spend
 * 
 * Note: ROAS calculation uses total sales regardless of business model,
 * but the interpretation differs:
 * - TCV: Immediate return on ad spend
 * - MRR: Monthly recurring return (longer-term value)
 */
function calculateROAS(totalSales: number, adSpend: number): number {
  if (adSpend === 0) return 0
  
  return totalSales / adSpend
}

/**
 * Main function to calculate all metrics for the main page
 */
export function calculateMainPageMetrics(input: MainPageCalculationInput): MainPageMetrics {
  const { deals, contacts, adSpend, previousPeriodData, businessModel } = input
  
  // Calculate current period metrics
  const totalSales = calculateTotalSales(deals, businessModel)
  const averageTicket = calculateAverageTicket(deals, businessModel)
  const cac = calculateCAC(adSpend, contacts, deals)
  const roas = calculateROAS(totalSales, adSpend)
  
  // Calculate trends if previous period data is available
  const totalSalesTrend = previousPeriodData
    ? calculateTrend(totalSales, previousPeriodData.totalSales)
    : { value: 0, isPositive: true }
  
  const averageTicketTrend = previousPeriodData
    ? calculateTrend(averageTicket, previousPeriodData.averageTicket)
    : { value: 0, isPositive: true }
  
  const cacTrend = previousPeriodData
    ? calculateTrend(cac, previousPeriodData.cac)
    : { value: 0, isPositive: true }
  
  // Note: For CAC, lower is better, so we invert the "isPositive" logic
  if (previousPeriodData && cac < previousPeriodData.cac) {
    cacTrend.isPositive = true
  } else if (previousPeriodData && cac > previousPeriodData.cac) {
    cacTrend.isPositive = false
  }
  
  const roasTrend = previousPeriodData
    ? calculateTrend(roas, previousPeriodData.roas)
    : { value: 0, isPositive: true }
  
  // Determine labels based on business model
  const salesLabel = businessModel === "TCV" ? "Total em Vendas" : "Total em Vendas"
  const ticketLabel = businessModel === "TCV" ? "Ticket Médio" : "Ticket Médio"
  
  return {
    totalSales: {
      value: totalSales,
      trend: totalSalesTrend,
      label: salesLabel,
    },
    averageTicket: {
      value: averageTicket,
      trend: averageTicketTrend,
      label: ticketLabel,
    },
    cac: {
      value: cac,
      trend: cacTrend,
    },
    roas: {
      value: roas,
      trend: roasTrend,
    },
  }
}

/**
 * Helper function to format currency values
 */
export function formatCurrency(value: number, locale: string = "pt-BR", currency: string = "BRL"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Helper function to format ROAS as a multiplier (e.g., "3.5x")
 */
export function formatROAS(value: number): string {
  return `${value.toFixed(2)}x`
}
