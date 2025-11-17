import { Deal, CommissionSettings } from "../types"

export interface EmployeeCommissionResult {
  employeeId: string
  totalSales: number
  salesCount: number
  baseCommission: number
  bonus: number
  checkpointTier: number
  checkpointMultiplier: number
  finalCommission: number
  targetAchievementPercent: number
}

export interface RoleCommissionSummary {
  role: "SDR" | "Closer"
  totalCommissions: number
  employeeCount: number
  totalSales: number
  salesCount: number
  employees: EmployeeCommissionResult[]
}

export interface TotalCommissionsCard {
  totalCommissions: number
  sdrCommissions: number
  closerCommissions: number
  sdrCount: number
  closerCount: number
  totalSales: number
  totalDeals: number
}

function calculateDealValue(deal: Deal, businessModel: "TCV" | "MRR"): number {
  if (businessModel === "MRR") {
    const duration = Number(deal.duration) || 0
    if (duration <= 0) return 0
    return (Number(deal.value) || 0) / duration
  }
  return Number(deal.value) || 0
}

export function formatCurrency(value: number, currency: string = "BRL"): string {
  const amount = Number.isFinite(value) ? value : 0
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatPercent(value: number, fractionDigits: number = 1): string {
  const numeric = Number.isFinite(value) ? value : 0
  return `${numeric.toFixed(fractionDigits)}%`
}

export function getCheckpointLabel(tier: number): string {
  switch (tier) {
    case 1:
      return "Checkpoint 1"
    case 2:
      return "Checkpoint 2"
    case 3:
      return "Checkpoint 3"
    default:
      return "Sem Checkpoint"
  }
}

export function getCheckpointColor(tier: number): string {
  switch (tier) {
    case 1:
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
    case 2:
      return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
    case 3:
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function determineCheckpointTier(
  achievementPercent: number,
  settings: CommissionSettings
): { tier: number; multiplier: number } {
  if (achievementPercent >= settings.checkpoint3Percent) {
    return { tier: 3, multiplier: settings.checkpoint3CommissionPercent / 100 }
  }
  if (achievementPercent >= settings.checkpoint2Percent) {
    return { tier: 2, multiplier: settings.checkpoint2CommissionPercent / 100 }
  }
  if (achievementPercent >= settings.checkpoint1Percent) {
    return { tier: 1, multiplier: settings.checkpoint1CommissionPercent / 100 }
  }
  return { tier: 0, multiplier: 0 }
}

export function getNextCheckpoint(
  currentAchievement: number,
  settings: CommissionSettings
):
  | {
      nextTier: number
      nextThreshold: number
      percentageNeeded: number
    }
  | null {
  if (currentAchievement < settings.checkpoint1Percent) {
    return {
      nextTier: 1,
      nextThreshold: settings.checkpoint1Percent,
      percentageNeeded: settings.checkpoint1Percent - currentAchievement,
    }
  }
  if (currentAchievement < settings.checkpoint2Percent) {
    return {
      nextTier: 2,
      nextThreshold: settings.checkpoint2Percent,
      percentageNeeded: settings.checkpoint2Percent - currentAchievement,
    }
  }
  if (currentAchievement < settings.checkpoint3Percent) {
    return {
      nextTier: 3,
      nextThreshold: settings.checkpoint3Percent,
      percentageNeeded: settings.checkpoint3Percent - currentAchievement,
    }
  }
  return null
}

function groupDealsByEmployee(deals: Deal[], role: "sdr" | "closer"): Map<string, Deal[]> {
  const grouped = new Map<string, Deal[]>()
  deals.forEach((deal) => {
    const ownerId = role === "sdr" ? deal.sdrId : deal.closerId
    if (!ownerId) return
    if (!grouped.has(ownerId)) {
      grouped.set(ownerId, [])
    }
    grouped.get(ownerId)!.push(deal)
  })
  return grouped
}

/**
 * Calcula a comissão para um funcionário baseado em seus deals
 * 
 * O cálculo respeita o businessModel:
 * - TCV: comissão sobre valor total do contrato
 * - MRR: comissão sobre valor mensal recorrente
 */
function calculateEmployeeCommission(
  deals: Deal[],
  settings: CommissionSettings,
  role: "sdr" | "closer",
  employeeId: string,
  businessModel: "TCV" | "MRR"
): EmployeeCommissionResult {
  const wonDeals = deals.filter((deal) => deal.status === "won")
  const totalSales = wonDeals.reduce((total, deal) => total + calculateDealValue(deal, businessModel), 0)

  if (role === "sdr") {
    const meetingsHeld = deals.length
    const meetingsConverted = wonDeals.length
    const baseCommission = meetingsHeld * settings.sdrMeetingCommission
    const bonus = meetingsConverted * settings.sdrBonusClosedMeeting
    const targetAchievementPercent =
      settings.sdrMeetingsTarget > 0 ? (meetingsHeld / settings.sdrMeetingsTarget) * 100 : 0

    const { tier, multiplier } = determineCheckpointTier(targetAchievementPercent, settings)
    const checkpointBonus = baseCommission * multiplier
    const finalCommission = baseCommission + bonus + checkpointBonus

    return {
      employeeId,
      totalSales,
      salesCount: meetingsHeld,
      baseCommission,
      bonus,
      checkpointTier: tier,
      checkpointMultiplier: multiplier,
      finalCommission,
      targetAchievementPercent,
    }
  }

  // Closers
  const salesCount = wonDeals.length
  const variableCommission = totalSales * (settings.closerCommissionPercent / 100)
  const baseCommission = settings.closerFixedCommission + variableCommission
  const bonus = salesCount * settings.closerPerSaleCommission
  const targetAchievementPercent =
    settings.closerSalesTarget > 0 ? (totalSales / settings.closerSalesTarget) * 100 : 0

  const { tier, multiplier } = determineCheckpointTier(targetAchievementPercent, settings)
  const checkpointBonus = baseCommission * multiplier
  const finalCommission = baseCommission + bonus + checkpointBonus

  return {
    employeeId,
    totalSales,
    salesCount,
    baseCommission,
    bonus,
    checkpointTier: tier,
    checkpointMultiplier: multiplier,
    finalCommission,
    targetAchievementPercent,
  }
}

function calculateRoleCommissions(
  deals: Deal[],
  settings: CommissionSettings,
  role: "sdr" | "closer",
  businessModel: "TCV" | "MRR"
): RoleCommissionSummary {
  const groupedDeals = groupDealsByEmployee(deals, role)
  const employees: EmployeeCommissionResult[] = []

  groupedDeals.forEach((employeeDeals, employeeId) => {
    const result = calculateEmployeeCommission(employeeDeals, settings, role, employeeId, businessModel)
    employees.push(result)
  })

  const totalCommissions = employees.reduce((sum, item) => sum + item.finalCommission, 0)
  const totalSales = employees.reduce((sum, item) => sum + item.totalSales, 0)
  const salesCount = employees.reduce((sum, item) => sum + item.salesCount, 0)

  return {
    role: role === "sdr" ? "SDR" : "Closer",
    totalCommissions,
    employeeCount: employees.length,
    totalSales,
    salesCount,
    employees,
  }
}

export function calculateSDRCommissionsFromDeals(
  deals: Deal[],
  settings: CommissionSettings,
  businessModel: "TCV" | "MRR" = "TCV"
): RoleCommissionSummary {
  // Filter out orphan deals (deals without a valid contact) and deals without SDR
  const filteredDeals = deals.filter((deal) => !!deal.sdrId && !!deal.contactId)
  return calculateRoleCommissions(filteredDeals, settings, "sdr", businessModel)
}

export function calculateCloserCommissionsFromDeals(
  deals: Deal[],
  settings: CommissionSettings,
  businessModel: "TCV" | "MRR" = "TCV",
  contacts?: any[] // Optional contacts array to find closerId
): RoleCommissionSummary {
  // If contacts provided, use them to find closerId
  if (contacts && contacts.length > 0) {
    const filteredDeals = deals.filter((deal) => {
      if (deal.status !== "won" || !deal.contactId) return false
      const contact = contacts.find(c => c.id === deal.contactId)
      return contact && (contact.closerId || deal.closerId)
    })
    
    // Map deals to include closerId from contact
    const dealsWithCloser = filteredDeals.map(deal => {
      const contact = contacts.find(c => c.id === deal.contactId)
      return {
        ...deal,
        closerId: contact?.closerId || deal.closerId || deal.assignedTo
      }
    }).filter(deal => !!deal.closerId)
    
    return calculateRoleCommissions(dealsWithCloser, settings, "closer", businessModel)
  }
  
  // Fallback to original logic
  const filteredDeals = deals.filter((deal) => deal.status === "won" && !!deal.closerId && !!deal.contactId)
  return calculateRoleCommissions(filteredDeals, settings, "closer", businessModel)
}

export function calculateTotalCommissionsCard(
  deals: Deal[],
  settings: CommissionSettings,
  businessModel: "TCV" | "MRR" = "TCV",
  contacts?: any[] // Optional contacts array
): TotalCommissionsCard {
  // Only consider valid deals with contacts for commission calculations
  const validDeals = deals.filter((deal) => !!deal.contactId)
  
  const sdrSummary = calculateSDRCommissionsFromDeals(validDeals, settings, businessModel)
  const closerSummary = calculateCloserCommissionsFromDeals(validDeals, settings, businessModel, contacts)

  return {
    totalCommissions: sdrSummary.totalCommissions + closerSummary.totalCommissions,
    sdrCommissions: sdrSummary.totalCommissions,
    closerCommissions: closerSummary.totalCommissions,
    sdrCount: sdrSummary.employeeCount,
    closerCount: closerSummary.employeeCount,
    totalSales: sdrSummary.totalSales + closerSummary.totalSales,
    totalDeals: validDeals.length,
  }
}
