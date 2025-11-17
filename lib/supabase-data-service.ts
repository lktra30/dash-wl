// Secure data service using backend API routes
import { Deal, Contact, Team, CommissionSettings, UserCommission, Meeting, Employee } from "./types"
import { fetchWithCache, apiCache } from "./api-cache"

interface Analytics {
  totalRevenue: number
  totalDeals: number
  pipelineValue: number
  totalContacts: number
  totalTeams: number
}

class SecureDataService {
  private apiBase = "/api/dashboard"

  private async request<T>(path = "", options: RequestInit = {}): Promise<T> {
    const url = `${this.apiBase}${path}`
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
      cache: options.method && options.method !== "GET" ? "no-store" : options.cache,
      ...options,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`API error (${response.status}): ${errorText}`)
    }

    return response.json() as Promise<T>
  }

  async getDashboardStats(): Promise<Analytics> {
    return fetchWithCache(
      'dashboard-analytics',
      () => this.request<Analytics>("/analytics"),
      { ttl: 60 * 1000 } // 1 minute cache
    )
  }

  async getDeals(): Promise<Deal[]> {
    return fetchWithCache(
      'deals',
      () => this.request<Deal[]>("/deals"),
      { ttl: 30 * 1000 } // 30 seconds cache
    )
  }

  async getContacts(): Promise<Contact[]> {
    return fetchWithCache(
      'contacts',
      () => this.request<Contact[]>("/contacts"),
      { ttl: 30 * 1000 } // 30 seconds cache
    )
  }

  async getTeams(): Promise<Team[]> {
    return fetchWithCache(
      'teams',
      () => this.request<Team[]>("/teams"),
      { ttl: 2 * 60 * 1000 } // 2 minutes cache
    )
  }

  async getEmployees(): Promise<Employee[]> {
    return fetchWithCache(
      'employees',
      () => this.request<Employee[]>("/employees"),
      { ttl: 2 * 60 * 1000 } // 2 minutes cache
    )
  }

  async getAnalytics(): Promise<Analytics> {
    return this.getDashboardStats()
  }

  async createDeal(dealData: Partial<Deal>): Promise<Deal> {
    const result = await this.request<Deal>("/deals", {
      method: "POST",
      body: JSON.stringify(dealData),
    })
    // Invalidate deals cache after mutation
    apiCache.invalidate('deals')
    apiCache.invalidate('dashboard-analytics')
    return result
  }

  async updateDeal(dealData: Partial<Deal> & { id: string }): Promise<Deal> {
    const { id, ...updates } = dealData
    const result = await this.request<Deal>(`/deals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    })
    // Invalidate deals cache after mutation
    apiCache.invalidate('deals')
    apiCache.invalidate('dashboard-analytics')
    return result
  }

  async createContact(contactData: Partial<Contact>): Promise<Contact> {
    const result = await this.request<Contact>("/contacts", {
      method: "POST",
      body: JSON.stringify(contactData),
    })
    // Invalidate contacts cache after mutation
    apiCache.invalidate('contacts')
    apiCache.invalidate('dashboard-analytics')
    return result
  }

  async updateContact(contactData: Partial<Contact> & { id: string }): Promise<Contact> {
    const result = await this.request<Contact>("/contacts", {
      method: "PATCH",
      body: JSON.stringify(contactData),
    })
    // Invalidate contacts cache after mutation
    apiCache.invalidate('contacts')
    apiCache.invalidate('dashboard-analytics')
    return result
  }

  async deleteContact(contactId: string): Promise<void> {
    await this.request<void>(`/contacts/${contactId}`, {
      method: "DELETE",
    })
    // Invalidate contacts cache after mutation
    apiCache.invalidate('contacts')
    apiCache.invalidate('dashboard-analytics')
  }

  async getCompetitionData() {
    const [deals, contacts, teams] = await Promise.all([
      this.getDeals(),
      this.getContacts(),
      this.getTeams(),
    ])

    const totalRevenue = deals
      .filter((d) => d.stage === "closed-won")
      .reduce((sum, d) => sum + Number(d.value), 0)

    const totalDeals = deals.length
    const pipelineValue = deals
      .filter((d) => d.stage === 'proposal' || d.stage === 'negotiation')
      .reduce((sum, d) => sum + Number(d.value), 0)

    return {
      totalRevenue,
      totalDeals,
      pipelineValue,
      totalContacts: contacts.length,
      totalTeams: teams.length,
    }
  }

  async getTeamPerformance() {
    const [teams, deals] = await Promise.all([
      this.getTeams(),
      this.getDeals(),
    ])

    return teams.map((team) => {
      const teamDeals = deals.filter((deal) =>
        team.memberIds.some((memberId) => deal.assignedTo === memberId)
      )

      const totalRevenue = teamDeals
        .filter((d) => d.stage === "closed-won")
        .reduce((sum, d) => sum + Number(d.value), 0)

      const closedDeals = teamDeals.filter((d) => d.stage === "closed-won").length
      const totalDeals = teamDeals.length
      const conversionRate = totalDeals > 0 ? (closedDeals / totalDeals) * 100 : 0

      return {
        id: team.id,
        name: team.name,
        performance: {
          totalRevenue,
          totalDeals,
          closedDeals,
          conversionRate,
          activeDeals: teamDeals.filter((d) => d.stage !== "closed-won" && d.stage !== "closed-lost").length,
        },
      }
    })
  }

  async getFunnelData() {
    // Use the dedicated funnel stats endpoint that processes data on the backend
    return this.request<{
      novoLead: number
      emContato: number
      reuniao: number
      fechado: number
      perdido: number
    }>("/funnel-stats")
  }

  async getFunnelStats() {
    return this.getFunnelData()
  }

  // Commission-related methods
  async getCommissionSettings(): Promise<CommissionSettings | null> {
    try {
      return await this.request<CommissionSettings>("/commissions/settings")
    } catch (error) {
      return null
    }
  }

  async updateCommissionSettings(settings: Partial<CommissionSettings>): Promise<CommissionSettings> {
    return this.request<CommissionSettings>("/commissions/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    })
  }

  async getMeetings(params?: { 
    sdrId?: string
    closerId?: string
    month?: number
    year?: number
    status?: string 
  }): Promise<Meeting[]> {
    const queryParams = new URLSearchParams()
    if (params?.sdrId) queryParams.append('sdrId', params.sdrId)
    if (params?.closerId) queryParams.append('closerId', params.closerId)
    if (params?.month) queryParams.append('month', params.month.toString())
    if (params?.year) queryParams.append('year', params.year.toString())
    if (params?.status) queryParams.append('status', params.status)
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return this.request<Meeting[]>(`/commissions/meetings${query}`)
  }

  async createMeeting(meetingData: Partial<Meeting>): Promise<Meeting> {
    return this.request<Meeting>("/commissions/meetings", {
      method: "POST",
      body: JSON.stringify(meetingData),
    })
  }

  async updateMeeting(meetingData: Partial<Meeting> & { id: string }): Promise<Meeting> {
    const { id, ...updates } = meetingData
    return this.request<Meeting>(`/commissions/meetings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    })
  }

  async getUserCommissions(params?: {
    userId?: string
    month?: number
    year?: number
  }): Promise<UserCommission[]> {
    const queryParams = new URLSearchParams()
    if (params?.userId) queryParams.append('userId', params.userId)
    if (params?.month) queryParams.append('month', params.month.toString())
    if (params?.year) queryParams.append('year', params.year.toString())
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return this.request<UserCommission[]>(`/commissions/user${query}`)
  }

  async calculateUserCommission(
    userId: string, 
    month: number, 
    year: number
  ): Promise<UserCommission> {
    return this.request<UserCommission>("/commissions/calculate", {
      method: "POST",
      body: JSON.stringify({ userId, month, year }),
    })
  }

  // Rankings
  async getSDRRanking(limit: number = 10): Promise<Array<{
    id: string
    name: string
    email: string
    avatarUrl: string | null
    meetingsCount: number
    goalTarget: number
    goalPercentage: number
  }>> {
    // Use fetch directly for rankings API (different base path)
    const response = await fetch(`/api/rankings/sdr?limit=${limit}`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`API error (${response.status}): ${errorText}`)
    }

    return response.json()
  }

  async getCloserRanking(limit: number = 10): Promise<{
    ranking: Array<{
      id: string
      name: string
      email: string
      avatarUrl: string | null
      closedDealsCount: number
      totalRevenue: number
      goalTarget: number
      goalPercentage: number
    }>
    businessModel: "TCV" | "MRR"
  }> {
    // Use fetch directly for rankings API (different base path)
    const response = await fetch(`/api/rankings/closer?limit=${limit}`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`API error (${response.status}): ${errorText}`)
    }

    return response.json()
  }
}

// Singleton instance
let dataServiceInstance: SecureDataService | null = null

export function createSecureDataService(): SecureDataService {
  if (!dataServiceInstance) {
    dataServiceInstance = new SecureDataService()
  }
  return dataServiceInstance
}

// Backward compatibility for existing imports
export function createSupabaseDataService(): SecureDataService {
  return createSecureDataService()
}
