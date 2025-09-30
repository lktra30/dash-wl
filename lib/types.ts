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
  role: "admin" | "user"
  whitelabelId: string
  createdAt: Date
  updatedAt: Date
}

export interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  status: "novo-lead" | "em-contato" | "reuniao" | "em-negociacao" | "fechado" | "perdido"
  whitelabelId: string
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
}

export interface Deal {
  id: string
  title: string
  value: number
  stage: "prospecting" | "qualification" | "proposal" | "negotiation" | "closed-won" | "closed-lost"
  contactId: string
  whitelabelId: string
  assignedTo?: string
  expectedCloseDate?: Date
  createdAt: Date
  updatedAt: Date
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
  createdAt: Date
}

export interface Team {
  id: string
  name: string
  description?: string
  color: string
  leaderId: string
  memberIds: string[]
  whitelabelId: string
  createdAt: Date
  updatedAt: Date
}

export interface TeamStats {
  teamId: string
  totalDeals: number
  totalRevenue: number
  closedDeals: number
  pipelineValue: number
  period: "month" | "quarter" | "year"
  periodStart: Date
  periodEnd: Date
}

export interface Competition {
  id: string
  name: string
  description?: string
  type: "revenue" | "deals" | "activities"
  startDate: Date
  endDate: Date
  whitelabelId: string
  isActive: boolean
  createdAt: Date
}

export interface FunnelStats {
  novoLead: number
  emContato: number
  reuniao: number
  emNegociacao: number
  fechado: number
  perdido: number
}
