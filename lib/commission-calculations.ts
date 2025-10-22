import { 
  CommissionSettings, 
  SDRMetrics, 
  CloserMetrics, 
  Meeting,
  Deal 
} from './types'

/**
 * Determine which checkpoint tier has been achieved
 * @param achievementPercent - Percentage of target achieved (0-100+)
 * @param settings - Commission settings containing checkpoint thresholds
 * @returns Tier number (0-3) and corresponding commission multiplier
 */
export function determineCheckpointTier(
  achievementPercent: number,
  settings: CommissionSettings
): { tier: number; multiplier: number } {
  if (achievementPercent >= settings.checkpoint3Percent) {
    return { 
      tier: 3, 
      multiplier: settings.checkpoint3CommissionPercent / 100 
    }
  } else if (achievementPercent >= settings.checkpoint2Percent) {
    return { 
      tier: 2, 
      multiplier: settings.checkpoint2CommissionPercent / 100 
    }
  } else if (achievementPercent >= settings.checkpoint1Percent) {
    return { 
      tier: 1, 
      multiplier: settings.checkpoint1CommissionPercent / 100 
    }
  }
  return { tier: 0, multiplier: 0 }
}

/**
 * Calculate SDR commission based on meetings held and converted
 * @param meetingsHeld - Number of meetings completed
 * @param meetingsConverted - Number of meetings that resulted in sales
 * @param settings - Commission settings
 * @returns SDR metrics including final commission
 */
export function calculateSDRCommission(
  meetingsHeld: number,
  meetingsConverted: number,
  settings: CommissionSettings
): {
  baseCommission: number
  bonusCommission: number
  totalBeforeCheckpoint: number
  targetAchievementPercent: number
  checkpointTier: number
  checkpointMultiplier: number
  finalCommission: number
} {
  // Calculate base commission from meetings
  const baseCommission = meetingsHeld * settings.sdrMeetingCommission
  
  // Calculate bonus from converted meetings
  const bonusCommission = meetingsConverted * settings.sdrBonusClosedMeeting
  
  // Total before applying checkpoint multiplier
  const totalBeforeCheckpoint = baseCommission + bonusCommission
  
  // Calculate target achievement percentage
  const targetAchievementPercent = settings.sdrMeetingsTarget > 0
    ? (meetingsHeld / settings.sdrMeetingsTarget) * 100
    : 0
  
  // Determine checkpoint tier
  const { tier, multiplier } = determineCheckpointTier(
    targetAchievementPercent,
    settings
  )
  
  // Apply checkpoint multiplier to get final commission
  const finalCommission = totalBeforeCheckpoint * multiplier
  
  return {
    baseCommission,
    bonusCommission,
    totalBeforeCheckpoint,
    targetAchievementPercent,
    checkpointTier: tier,
    checkpointMultiplier: multiplier,
    finalCommission
  }
}

/**
 * Calculate Closer commission based on total sales
 * @param totalSales - Total value of sales closed
 * @param salesCount - Number of sales closed
 * @param settings - Commission settings
 * @returns Closer metrics including final commission
 */
export function calculateCloserCommission(
  totalSales: number,
  salesCount: number,
  settings: CommissionSettings
): {
  fixedCommission: number
  perSaleCommission: number
  percentCommission: number
  baseCommission: number
  targetAchievementPercent: number
  checkpointTier: number
  checkpointMultiplier: number
  finalCommission: number
} {
  // Calculate fixed monthly commission
  const fixedCommission = settings.closerFixedCommission || 0
  
  // Calculate commission per sale (fixed amount per deal)
  const perSaleCommission = salesCount * (settings.closerPerSaleCommission || 0)
  
  // Calculate commission as percentage of sales
  const percentCommission = totalSales * (settings.closerCommissionPercent / 100)
  
  // Total base commission before checkpoint multiplier
  const baseCommission = fixedCommission + perSaleCommission + percentCommission
  
  // Calculate target achievement percentage
  const targetAchievementPercent = settings.closerSalesTarget > 0
    ? (totalSales / settings.closerSalesTarget) * 100
    : 0
  
  // Determine checkpoint tier
  const { tier, multiplier } = determineCheckpointTier(
    targetAchievementPercent,
    settings
  )
  
  // Apply checkpoint multiplier to get final commission
  const finalCommission = baseCommission * multiplier
  
  return {
    fixedCommission,
    perSaleCommission,
    percentCommission,
    baseCommission,
    targetAchievementPercent,
    checkpointTier: tier,
    checkpointMultiplier: multiplier,
    finalCommission
  }
}

/**
 * Get SDR metrics for a specific period
 * @param meetings - All meetings for the SDR in the period
 * @param settings - Commission settings
 * @returns Complete SDR metrics
 */
export function getSDRMetricsForPeriod(
  meetings: Meeting[],
  settings: CommissionSettings,
  userId: string,
  userName: string,
  periodMonth: number,
  periodYear: number
): SDRMetrics {
  // Filter completed meetings
  const completedMeetings = meetings.filter(
    m => m.status === 'completed' && m.sdrId === userId
  )
  
  const meetingsHeld = completedMeetings.length
  const meetingsConverted = completedMeetings.filter(
    m => m.convertedToSale
  ).length
  
  const commission = calculateSDRCommission(
    meetingsHeld,
    meetingsConverted,
    settings
  )
  
  return {
    userId,
    userName,
    periodMonth,
    periodYear,
    meetingsHeld,
    meetingsConverted,
    meetingsTarget: settings.sdrMeetingsTarget,
    targetAchievementPercent: commission.targetAchievementPercent,
    baseCommission: commission.baseCommission,
    bonusCommission: commission.bonusCommission,
    checkpointTier: commission.checkpointTier,
    finalCommission: commission.finalCommission
  }
}

/**
 * Get Closer metrics for a specific period
 * @param deals - All won deals for the closer in the period
 * @param settings - Commission settings
 * @returns Complete Closer metrics
 */
export function getCloserMetricsForPeriod(
  deals: Deal[],
  settings: CommissionSettings,
  userId: string,
  userName: string,
  periodMonth: number,
  periodYear: number
): CloserMetrics {
  // Filter won deals assigned to this closer
  const wonDeals = deals.filter(
    d => d.status === 'won' && d.assignedTo === userId
  )
  
  const totalSales = wonDeals.reduce((sum, deal) => sum + deal.value, 0)
  const salesCount = wonDeals.length
  
  const commission = calculateCloserCommission(totalSales, salesCount, settings)
  
  return {
    userId,
    userName,
    periodMonth,
    periodYear,
    totalSales,
    salesCount,
    salesTarget: settings.closerSalesTarget,
    targetAchievementPercent: commission.targetAchievementPercent,
    baseCommission: commission.baseCommission,
    checkpointTier: commission.checkpointTier,
    finalCommission: commission.finalCommission
  }
}

/**
 * Calculate projected commission based on current progress
 * Useful for showing users "if you maintain this pace" projections
 */
export function calculateProjectedCommission(
  currentMetrics: { 
    achieved: number
    daysElapsed: number 
  },
  settings: CommissionSettings,
  role: 'sdr' | 'closer',
  daysInMonth: number = 30
): number {
  const projectedTotal = (currentMetrics.achieved / currentMetrics.daysElapsed) * daysInMonth
  
  if (role === 'sdr') {
    const projected = calculateSDRCommission(
      Math.round(projectedTotal),
      0, // Conservative - don't project conversions
      settings
    )
    return projected.finalCommission
  } else {
    const projected = calculateCloserCommission(projectedTotal, 0, settings)
    return projected.finalCommission
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Get checkpoint tier label
 */
export function getCheckpointLabel(tier: number): string {
  switch (tier) {
    case 0:
      return 'Below Checkpoint 1'
    case 1:
      return 'Checkpoint 1'
    case 2:
      return 'Checkpoint 2'
    case 3:
      return 'Checkpoint 3'
    default:
      return 'Unknown'
  }
}

/**
 * Get checkpoint tier color for UI
 */
export function getCheckpointColor(tier: number): string {
  switch (tier) {
    case 0:
      return 'text-gray-500'
    case 1:
      return 'text-yellow-500'
    case 2:
      return 'text-orange-500'
    case 3:
      return 'text-green-500'
    default:
      return 'text-gray-500'
  }
}

/**
 * Get next checkpoint info
 */
export function getNextCheckpoint(
  currentAchievement: number,
  settings: CommissionSettings
): {
  nextTier: number
  nextThreshold: number
  percentageNeeded: number
} | null {
  if (currentAchievement < settings.checkpoint1Percent) {
    return {
      nextTier: 1,
      nextThreshold: settings.checkpoint1Percent,
      percentageNeeded: settings.checkpoint1Percent - currentAchievement
    }
  } else if (currentAchievement < settings.checkpoint2Percent) {
    return {
      nextTier: 2,
      nextThreshold: settings.checkpoint2Percent,
      percentageNeeded: settings.checkpoint2Percent - currentAchievement
    }
  } else if (currentAchievement < settings.checkpoint3Percent) {
    return {
      nextTier: 3,
      nextThreshold: settings.checkpoint3Percent,
      percentageNeeded: settings.checkpoint3Percent - currentAchievement
    }
  }
  return null
}
