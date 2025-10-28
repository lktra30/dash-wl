// Core types for the whitelabel CRM system
export interface WhitelabelConfig {
  id: string
  name: string
  brandColor: string
  logo?: string
  domain?: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  name: string
  role: string
  whitelabelId: string
  createdAt: string
  updatedAt: string
}

// Whitelabel interface - contains only safe data for frontend
// Sensitive fields (id, encrypted keys, etc.) are excluded to prevent data leaks
export interface Whitelabel {
  name: string
  domain?: string
  brandColor?: string
  logoUrl?: string
  businessModel?: "TCV" | "MRR"
  metaAdsConfigured?: boolean
  googleAdsConfigured?: boolean
  facebookConfigured?: boolean
  metaAdsAccountId?: string
  facebookPageId?: string
  teamCompetition?: boolean
}

export interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  status: "new_lead" | "contacted" | "meeting" | "negotiation" | "won" | "closed" | "lost" | "disqualified"
  leadSource?: "inbound" | "outbound" // Lead source: inbound (came to us) or outbound (we reached out)
  whitelabelId: string
  assignedTo?: string
  sdrId?: string // SDR (Sales Development Representative) responsible for this contact
  closerId?: string // Closer/Account Executive responsible for closing this deal
  dealValue?: number // Expected deal value when contact is closed
  dealDuration?: number // Expected duration of the deal in days
  createdAt: string
  updatedAt: string
}

export interface Deal {
  id: string
  title: string
  value: number
  status: "open" | "won" | "lost"
  duration?: number // Deal duration in days (used for TCV calculations)
  contactId: string
  whitelabelId: string
  assignedTo?: string
  sdrId?: string // SDR who sourced this deal
  closerId?: string // Closer who closed this deal
  expectedCloseDate?: string
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: string
  type: "call" | "email" | "meeting" | "note"
  title: string
  description?: string
  contactId?: string
  dealId?: string
  whitelabelId: string
  userId: string
  createdAt: string
}

export interface Team {
  id: string
  name: string
  description?: string
  color: string
  logoUrl?: string
  leaderId?: string
  memberIds: string[] // User IDs (legacy support)
  employeeIds?: string[] // Employee IDs (new system)
  whitelabelId: string
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  id: string
  teamId: string
  userId?: string // Optional - for user-based members
  employeeId?: string // Optional - for employee-based members
  createdAt: string
}

export interface TeamStats {
  totalRevenue: number // Receita total de deals WON (apenas closers do time)
  totalDeals: number // Total de deals onde o time está envolvido (SDR ou Closer)
  closedDeals: number // Deals ganhos (WON) onde o time tem um closer
  activeDeals: number // Deals em aberto onde o time está envolvido
}

export interface Competition {
  id: string
  name: string
  description?: string
  type: "revenue" | "deals" | "activities"
  startDate: string
  endDate: string
  whitelabelId: string
  isActive: boolean
  createdAt: string
}

export interface Employee {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  department: string
  hire_date: string
  status: "active" | "inactive" | "on_leave"
  avatar_url?: string
  whitelabel_id: string
  team_id?: string | null // FK to teams table
  user_role?: "admin" | "gestor" | "colaborador" // User access level
  created_at: string
  updated_at: string
}

export interface FunnelStats {
  novoLead: number
  emContato: number
  reuniao: number
  emNegociacao: number
  fechado: number
  perdido: number
}

// Meta Ads Analytics Types
export interface MetaAdsMetrics {
  totalSpend: number
  totalClicks: number
  totalImpressions: number
  totalPurchases: number
  totalRevenue: number
  roas: number // Return on Ad Spend
  roi: number // Return on Investment (%)
  cac: number // Customer Acquisition Cost (Investimento por Lead)
  cpc: number // Cost Per Click
  ctr: number // Click Through Rate (%)
  totalLeads: number // Total de leads no período
}

export interface MetaAdsTimeSeriesData {
  date: string
  spend: number
  revenue: number
  clicks: number
  impressions: number
  purchases: number
  roas: number
  roi: number
  cpc: number
}

export interface MetaCampaignData {
  id: string
  name: string
  spend: number
  clicks: number
  impressions: number
  purchases: number
  revenue: number
  roas: number
  roi: number
  cpc: number
  ctr: number
  cac: number
}

export interface MetaAdsResponse {
  success: boolean
  metrics: MetaAdsMetrics
  timeSeries: MetaAdsTimeSeriesData[]
  campaigns: MetaCampaignData[]
  rawDataCount: number
}

// Google Ads Analytics Types
export interface GoogleAdsMetrics {
  totalSpend: number
  totalClicks: number
  totalImpressions: number
  totalConversions: number
  totalRevenue: number
  roas: number // Return on Ad Spend
  roi: number // Return on Investment (%)
  cpa: number // Cost Per Acquisition
  cpc: number // Cost Per Click
  ctr: number // Click Through Rate (%)
  conversionRate: number // Conversion Rate (%)
  avgCpc: number // Average Cost Per Click
}

export interface GoogleAdsTimeSeriesData {
  date: string
  spend: number
  revenue: number
  clicks: number
  impressions: number
  conversions: number
  roas: number
  roi: number
  cpc: number
  conversionRate: number
}

export interface GoogleCampaignData {
  id: string
  name: string
  spend: number
  clicks: number
  impressions: number
  conversions: number
  revenue: number
  roas: number
  roi: number
  cpc: number
  ctr: number
  cpa: number
  conversionRate: number
}

export interface GoogleAdsResponse {
  success: boolean
  metrics: GoogleAdsMetrics
  timeSeries: GoogleAdsTimeSeriesData[]
  campaigns: GoogleCampaignData[]
  rawDataCount: number
}

// Commission Types
export interface CommissionSettings {
  id: string
  whitelabelId: string
  
  // Checkpoint thresholds (% of target to reach each tier)
  checkpoint1Percent: number
  checkpoint2Percent: number
  checkpoint3Percent: number
  
  // Checkpoint commission multipliers (% of base commission at each tier)
  checkpoint1CommissionPercent: number
  checkpoint2CommissionPercent: number
  checkpoint3CommissionPercent: number
  
  // SDR Settings
  sdrMeetingCommission: number // Fixed value per meeting
  sdrMeetingsTarget: number // Monthly meetings target
  sdrBonusClosedMeeting: number // Bonus when meeting converts to sale
  
  // Closer Settings
  closerCommissionPercent: number // % of sale value
  closerSalesTarget: number // Monthly sales target
  closerFixedCommission: number // Fixed monthly commission for closers
  closerPerSaleCommission: number // Commission per sale closed (fixed amount per deal)
  
  createdAt: string
  updatedAt: string
}

export interface Meeting {
  id: string
  whitelabelId: string
  sdrId: string
  contactId?: string
  dealId?: string
  title: string
  scheduledAt: string
  completedAt?: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  convertedToSale: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface UserCommission {
  id: string
  whitelabelId: string
  userId: string
  periodMonth: number
  periodYear: number
  userRole: 'sdr' | 'closer'
  
  // SDR Metrics
  meetingsHeld?: number
  meetingsConverted?: number
  
  // Closer Metrics
  totalSales?: number
  salesCount?: number
  
  // Commission Calculations
  baseCommission: number
  checkpointTier: number
  checkpointMultiplier: number
  finalCommission: number
  targetAchievementPercent: number
  
  createdAt: string
  updatedAt: string
}

export interface SDRMetrics {
  userId: string
  userName: string
  periodMonth: number
  periodYear: number
  meetingsHeld: number
  meetingsConverted: number
  meetingsTarget: number
  targetAchievementPercent: number
  baseCommission: number
  bonusCommission: number
  checkpointTier: number
  finalCommission: number
}

export interface CloserMetrics {
  userId: string
  userName: string
  periodMonth: number
  periodYear: number
  totalSales: number
  salesCount: number
  salesTarget: number
  targetAchievementPercent: number
  baseCommission: number
  checkpointTier: number
  finalCommission: number
}

export interface CommissionOverview {
  totalCommissions: number
  sdrCommissions: number
  closerCommissions: number
  sdrCount: number
  closerCount: number
  totalSales: number
  totalDeals: number
  averageTargetAchievement: number
  topPerformers: Array<{
    userId: string
    userName: string
    role: 'sdr' | 'closer'
    commission: number
    achievement: number
  }>
}

// Facebook Lead Ads Webhook Types
export interface FacebookWebhookPayload {
  object: string
  entry: Array<{
    id: string
    time: number
    changes: Array<{
      field: string
      value: {
        leadgen_id: string
        page_id: string
        form_id: string
        ad_id?: string
        created_time: number
      }
    }>
  }>
}

export interface FacebookLead {
  id: string
  whitelabelId: string
  contactId?: string
  facebookLeadId: string
  pageId: string
  formId: string
  adId?: string
  formData: Record<string, any>
  processed: boolean
  errorMessage?: string
  createdAt: string
  processedAt?: string
}
