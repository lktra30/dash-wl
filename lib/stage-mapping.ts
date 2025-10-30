/**
 * Maps pipeline stage information to legacy funnel_stage values
 * This ensures backward compatibility between the new pipeline system
 * and the legacy funnel_stage field
 */

export interface StageInfo {
  counts_as_meeting?: boolean
  counts_as_sale?: boolean
  order_position?: number
  name?: string
}

/**
 * Determines the appropriate funnel_stage based on stage flags and properties
 */
export function mapStageToFunnelStage(stageInfo: StageInfo | null): string {
  // If no stage info provided, default to new_lead
  if (!stageInfo) {
    return 'new_lead'
  }

  // Priority 1: Check if it's a sale (highest priority)
  if (stageInfo.counts_as_sale === true) {
    return 'won'
  }

  // Priority 2: Check if it's a meeting
  if (stageInfo.counts_as_meeting === true) {
    return 'meeting'
  }

  // Priority 3: Check stage name for common patterns
  const stageName = stageInfo.name?.toLowerCase() || ''

  if (stageName.includes('novo') || stageName.includes('new') || stageName.includes('lead')) {
    return 'new_lead'
  }

  if (stageName.includes('contato') || stageName.includes('contacted') || stageName.includes('qualificação')) {
    return 'contacted'
  }

  if (stageName.includes('reunião') || stageName.includes('meeting') || stageName.includes('demo')) {
    return 'meeting'
  }

  if (stageName.includes('negociação') || stageName.includes('negotiation') || stageName.includes('proposta') || stageName.includes('proposal')) {
    return 'negotiation'
  }

  if (stageName.includes('perdido') || stageName.includes('lost')) {
    return 'lost'
  }

  if (stageName.includes('desqualificado') || stageName.includes('disqualified')) {
    return 'disqualified'
  }

  // Priority 4: Use order position as fallback
  if (stageInfo.order_position !== undefined) {
    const position = stageInfo.order_position

    if (position === 0) return 'new_lead'
    if (position === 1) return 'contacted'
    if (position === 2) return 'meeting'
    if (position === 3) return 'negotiation'
    if (position >= 4) return 'won'
  }

  // Default fallback
  return 'contacted'
}
