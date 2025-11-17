/**
 * Cálculos de Comissões para Cards da Página de Comissões
 * 
 * Este arquivo contém funções específicas para calcular os valores
 * exibidos nos cards da dashboard de comissões.
 */

import { Deal, CommissionSettings } from './types'
import { determineCheckpointTier } from './commission-calculations'

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Resultado do cálculo de comissão para um único funcionário
 */
export interface EmployeeCommissionResult {
  employeeId: string
  totalSales: number
  salesCount: number
  baseCommission: number
  bonus: number
  checkpointMultiplier: number
  finalCommission: number
  targetAchievementPercent: number
}

/**
 * Resultado agregado de comissões por role
 */
export interface RoleCommissionSummary {
  role: 'sdr' | 'closer'
  totalCommissions: number
  employeeCount: number
  totalSales: number
  salesCount: number
  employees: EmployeeCommissionResult[]
}

/**
 * Dados do Card 1: Total em Comissões
 */
export interface TotalCommissionsCard {
  totalCommissions: number
  sdrCommissions: number
  closerCommissions: number
  sdrCount: number
  closerCount: number
  totalSales: number
  totalDeals: number
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Calcula o valor de vendas baseado no modelo de negócio
 */
function calculateDealValue(deal: Deal, businessModel: "TCV" | "MRR"): number {
  if (businessModel === "MRR") {
    const value = Number(deal.value) || 0
    const duration = Number(deal.duration) || 0
    
    // Only include deals with valid duration > 0 for MRR
    if (duration > 0) {
      return value / duration
    }
    return 0
  } else {
    // TCV: use total value
    return Number(deal.value) || 0
  }
}

/**
 * Agrupa deals por funcionário (SDR ou Closer)
 */
function groupDealsByEmployee(
  deals: Deal[],
  role: 'sdr' | 'closer'
): Map<string, Deal[]> {
  const grouped = new Map<string, Deal[]>()
  
  deals.forEach(deal => {
    const employeeId = role === 'sdr' ? deal.sdrId : deal.closerId
    
    if (employeeId) {
      if (!grouped.has(employeeId)) {
        grouped.set(employeeId, [])
      }
      grouped.get(employeeId)!.push(deal)
    }
  })
  
  return grouped
}

/**
 * Calcula a comissão para um funcionário baseado em seus deals
 * Fórmula: (valorVenda * multiplicadorCheckpoint) + (bonus * qtdVendas)
 * 
 * O cálculo respeita o businessModel:
 * - TCV: comissão sobre valor total do contrato
 * - MRR: comissão sobre valor mensal recorrente
 */
function calculateEmployeeCommission(
  deals: Deal[],
  settings: CommissionSettings,
  role: 'sdr' | 'closer',
  employeeId: string,
  businessModel: "TCV" | "MRR"
): EmployeeCommissionResult {
  // Calcular totais baseado no modelo de negócio
  const totalSales = deals.reduce((sum, deal) => sum + calculateDealValue(deal, businessModel), 0)
  const salesCount = deals.length
  
  // Determinar qual meta usar baseado no role
  const target = role === 'sdr' 
    ? settings.closerSalesTarget // SDRs também têm meta de vendas fechadas
    : settings.closerSalesTarget
  
  // Calcular percentual de atingimento da meta
  const targetAchievementPercent = target > 0 
    ? (totalSales / target) * 100 
    : 0
  
  // Determinar o tier do checkpoint e o multiplicador
  const { multiplier } = determineCheckpointTier(
    targetAchievementPercent,
    settings
  )
  
  // Calcular comissão base
  let baseCommission = 0
  
  if (role === 'sdr') {
    // SDRs: usar percentual sobre vendas
    const commissionPercent = settings.closerCommissionPercent
    baseCommission = totalSales * (commissionPercent / 100)
  } else {
    // Closers: comissão fixa + por venda + percentual
    const fixedCommission = settings.closerFixedCommission || 0
    const perSaleCommission = salesCount * (settings.closerPerSaleCommission || 0)
    const percentCommission = totalSales * (settings.closerCommissionPercent / 100)
    baseCommission = fixedCommission + perSaleCommission + percentCommission
  }
  
  // Calcular bônus por quantidade de vendas
  // Para SDRs: usar o bonus de reunião convertida
  // Para Closers: usar um valor padrão ou configurável
  const bonusPerSale = role === 'sdr'
    ? settings.sdrBonusClosedMeeting
    : settings.sdrBonusClosedMeeting // Usar o mesmo bonus inicialmente
  
  const bonus = bonusPerSale * salesCount
  
  // Aplicar multiplicador do checkpoint sobre a comissão base
  const commissionWithMultiplier = baseCommission * multiplier
  
  // Comissão final = comissão com multiplicador + bônus
  const finalCommission = commissionWithMultiplier + bonus
  
  return {
    employeeId,
    totalSales,
    salesCount,
    baseCommission,
    bonus,
    checkpointMultiplier: multiplier,
    finalCommission,
    targetAchievementPercent
  }
}

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Calcula as comissões para todos os SDRs baseado nos deals ganhos
 */
export function calculateSDRCommissionsFromDeals(
  deals: Deal[],
  settings: CommissionSettings,
  businessModel: "TCV" | "MRR"
): RoleCommissionSummary {
  // Filtrar apenas deals ganhos que têm SDR e que têm contact válido (não órfãos)
  const wonDealsWithSDR = deals.filter(
    deal => deal.status === 'won' && deal.sdrId && deal.contactId
  )
  
  // Agrupar por SDR
  const dealsBySDR = groupDealsByEmployee(wonDealsWithSDR, 'sdr')
  
  // Calcular comissão para cada SDR
  const employees: EmployeeCommissionResult[] = []
  let totalCommissions = 0
  let totalSales = 0
  let salesCount = 0
  
  dealsBySDR.forEach((employeeDeals, sdrId) => {
    const result = calculateEmployeeCommission(
      employeeDeals,
      settings,
      'sdr',
      sdrId,
      businessModel
    )
    
    employees.push(result)
    totalCommissions += result.finalCommission
    totalSales += result.totalSales
    salesCount += result.salesCount
  })
  
  return {
    role: 'sdr',
    totalCommissions,
    employeeCount: employees.length,
    totalSales,
    salesCount,
    employees
  }
}

/**
 * Calcula as comissões para todos os Closers baseado nos deals ganhos
 */
export function calculateCloserCommissionsFromDeals(
  deals: Deal[],
  settings: CommissionSettings,
  businessModel: "TCV" | "MRR",
  contacts?: any[] // Optional contacts to find closerId
): RoleCommissionSummary {
  let wonDealsWithCloser: Deal[]
  
  // If contacts provided, use them to find closerId
  if (contacts && contacts.length > 0) {
    const wonDeals = deals.filter(deal => deal.status === 'won' && deal.contactId)
    wonDealsWithCloser = wonDeals.map(deal => {
      const contact = contacts.find(c => c.id === deal.contactId)
      return {
        ...deal,
        closerId: contact?.closerId || deal.closerId || deal.assignedTo
      }
    }).filter(deal => !!deal.closerId)
  } else {
    // Filtrar apenas deals ganhos que têm Closer e que têm contact válido (não órfãos)
    wonDealsWithCloser = deals.filter(
      deal => deal.status === 'won' && deal.closerId && deal.contactId
    )
  }
  
  // Agrupar por Closer
  const dealsByCloser = groupDealsByEmployee(wonDealsWithCloser, 'closer')
  
  // Calcular comissão para cada Closer
  const employees: EmployeeCommissionResult[] = []
  let totalCommissions = 0
  let totalSales = 0
  let salesCount = 0
  
  dealsByCloser.forEach((employeeDeals, closerId) => {
    const result = calculateEmployeeCommission(
      employeeDeals,
      settings,
      'closer',
      closerId,
      businessModel
    )
    
    employees.push(result)
    totalCommissions += result.finalCommission
    totalSales += result.totalSales
    salesCount += result.salesCount
  })
  
  return {
    role: 'closer',
    totalCommissions,
    employeeCount: employees.length,
    totalSales,
    salesCount,
    employees
  }
}

/**
 * Calcula o total de comissões para o Card 1
 * 
 * @param deals - Array de todos os deals
 * @param settings - Configurações de comissão
 * @param businessModel - Modelo de negócio (TCV ou MRR)
 * @returns Dados formatados para o Card 1
 */
export function calculateTotalCommissionsCard(
  deals: Deal[],
  settings: CommissionSettings,
  businessModel: "TCV" | "MRR" = "TCV",
  contacts?: any[] // Optional contacts
): TotalCommissionsCard {
  // Filtrar apenas deals válidos (com contact_id) para evitar deals órfãos
  const validDeals = deals.filter(deal => !!deal.contactId)
  
  // Calcular comissões dos SDRs
  const sdrSummary = calculateSDRCommissionsFromDeals(validDeals, settings, businessModel)
  
  // Calcular comissões dos Closers
  const closerSummary = calculateCloserCommissionsFromDeals(validDeals, settings, businessModel, contacts)
  
  // Agregar totais
  const totalSales = sdrSummary.totalSales + closerSummary.totalSales
  const totalDeals = sdrSummary.salesCount + closerSummary.salesCount
  
  // Note: Se um deal tem tanto SDR quanto Closer, as vendas serão contadas duas vezes
  // Para evitar isso, vamos calcular o total real de vendas
  const wonDeals = validDeals.filter(deal => deal.status === 'won')
  const actualTotalSales = wonDeals.reduce((sum, deal) => sum + calculateDealValue(deal, businessModel), 0)
  const actualTotalDeals = wonDeals.length
  
  return {
    totalCommissions: sdrSummary.totalCommissions + closerSummary.totalCommissions,
    sdrCommissions: sdrSummary.totalCommissions,
    closerCommissions: closerSummary.totalCommissions,
    sdrCount: sdrSummary.employeeCount,
    closerCount: closerSummary.employeeCount,
    totalSales: actualTotalSales,
    totalDeals: actualTotalDeals
  }
}

/**
 * Formata valor monetário para exibição
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Formata percentual para exibição
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}
