import type { User, Contact, Deal, Activity, WhitelabelConfig, Team, TeamStats, Competition } from "./types"
import {
  mockUsersExtended,
  mockContacts,
  mockDealsExtended,
  mockWhitelabels,
  mockTeams,
  mockTeamStats,
  mockCompetitions,
} from "./mock-data"

// Data service with whitelabel isolation
export class DataService {
  private whitelabelId: string

  constructor(whitelabelId: string) {
    this.whitelabelId = whitelabelId
  }

  // Whitelabel methods
  getWhitelabelConfig(): WhitelabelConfig | null {
    return mockWhitelabels.find((w) => w.id === this.whitelabelId) || null
  }

  updateWhitelabelConfig(updates: Partial<WhitelabelConfig>): WhitelabelConfig | null {
    const config = this.getWhitelabelConfig()
    if (!config) return null

    // In a real app, this would update the database
    Object.assign(config, updates, { updatedAt: new Date() })
    return config
  }

  // User methods - isolated by whitelabel
  getUsers(): User[] {
    return mockUsersExtended.filter((user) => user.whitelabelId === this.whitelabelId)
  }

  getUserById(userId: string): User | null {
    const user = mockUsersExtended.find((u) => u.id === userId)
    return user && user.whitelabelId === this.whitelabelId ? user : null
  }

  createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): User {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      whitelabelId: this.whitelabelId, // Ensure whitelabel isolation
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // In a real app, this would save to database
    mockUsersExtended.push(newUser)
    return newUser
  }

  // Contact methods - isolated by whitelabel
  getContacts(): Contact[] {
    return mockContacts.filter((contact) => contact.whitelabelId === this.whitelabelId)
  }

  getContactById(contactId: string): Contact | null {
    const contact = mockContacts.find((c) => c.id === contactId)
    return contact && contact.whitelabelId === this.whitelabelId ? contact : null
  }

  createContact(contactData: Omit<Contact, "id" | "createdAt" | "updatedAt">): Contact {
    const newContact: Contact = {
      ...contactData,
      id: `contact-${Date.now()}`,
      whitelabelId: this.whitelabelId, // Ensure whitelabel isolation
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // In a real app, this would save to database
    mockContacts.push(newContact)
    return newContact
  }

  updateContact(contactId: string, updates: Partial<Contact>): Contact | null {
    const contact = this.getContactById(contactId)
    if (!contact) return null

    Object.assign(contact, updates, { updatedAt: new Date() })
    return contact
  }

  deleteContact(contactId: string): boolean {
    const contact = this.getContactById(contactId)
    if (!contact) return false

    const index = mockContacts.findIndex((c) => c.id === contactId)
    if (index > -1) {
      mockContacts.splice(index, 1)
      return true
    }
    return false
  }

  // Deal methods - isolated by whitelabel
  getDeals(): Deal[] {
    return mockDealsExtended.filter((deal) => deal.whitelabelId === this.whitelabelId)
  }

  getDealById(dealId: string): Deal | null {
    const deal = mockDealsExtended.find((d) => d.id === dealId)
    return deal && deal.whitelabelId === this.whitelabelId ? deal : null
  }

  createDeal(dealData: Omit<Deal, "id" | "createdAt" | "updatedAt">): Deal {
    const newDeal: Deal = {
      ...dealData,
      id: `deal-${Date.now()}`,
      whitelabelId: this.whitelabelId, // Ensure whitelabel isolation
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // In a real app, this would save to database
    mockDealsExtended.push(newDeal)
    return newDeal
  }

  updateDeal(dealId: string, updates: Partial<Deal>): Deal | null {
    const deal = this.getDealById(dealId)
    if (!deal) return null

    Object.assign(deal, updates, { updatedAt: new Date() })
    return deal
  }

  deleteDeal(dealId: string): boolean {
    const deal = this.getDealById(dealId)
    if (!deal) return false

    const index = mockDealsExtended.findIndex((d) => d.id === dealId)
    if (index > -1) {
      mockDealsExtended.splice(index, 1)
      return true
    }
    return false
  }

  // Team methods - isolated by whitelabel
  getTeams(): Team[] {
    return mockTeams.filter((team) => team.whitelabelId === this.whitelabelId)
  }

  getTeamById(teamId: string): Team | null {
    const team = mockTeams.find((t) => t.id === teamId)
    return team && team.whitelabelId === this.whitelabelId ? team : null
  }

  createTeam(teamData: Omit<Team, "id" | "createdAt" | "updatedAt">): Team {
    const newTeam: Team = {
      ...teamData,
      id: `team-${Date.now()}`,
      whitelabelId: this.whitelabelId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockTeams.push(newTeam)
    return newTeam
  }

  updateTeam(teamId: string, updates: Partial<Team>): Team | null {
    const team = this.getTeamById(teamId)
    if (!team) return null

    Object.assign(team, updates, { updatedAt: new Date() })
    return team
  }

  deleteTeam(teamId: string): boolean {
    const team = this.getTeamById(teamId)
    if (!team) return false

    const index = mockTeams.findIndex((t) => t.id === teamId)
    if (index > -1) {
      mockTeams.splice(index, 1)
      return true
    }
    return false
  }

  // Team statistics and competition methods
  getTeamStats(): TeamStats[] {
    return mockTeamStats.filter((stats) => {
      const team = this.getTeamById(stats.teamId)
      return team !== null
    })
  }

  getTopTeams(limit = 2): Array<Team & { stats: TeamStats }> {
    const teams = this.getTeams()
    const teamStats = this.getTeamStats()

    const teamsWithStats = teams
      .map((team) => {
        const stats = teamStats.find((s) => s.teamId === team.id)
        return stats ? { ...team, stats } : null
      })
      .filter(Boolean) as Array<Team & { stats: TeamStats }>

    return teamsWithStats.sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue).slice(0, limit)
  }

  getActiveCompetitions(): Competition[] {
    return mockCompetitions.filter((comp) => comp.whitelabelId === this.whitelabelId && comp.isActive)
  }

  // Activity methods - isolated by whitelabel
  getActivities(): Activity[] {
    // Mock activities data - in a real app this would come from database
    const mockActivities = [
      {
        id: "activity-1",
        type: "call" as const,
        title: "Follow-up call with Alice Johnson",
        description: "Discussed project requirements and timeline",
        contactId: "contact-1",
        whitelabelId: "wl-1",
        userId: "user-2",
        createdAt: new Date("2024-01-25T10:30:00"),
      },
      {
        id: "activity-2",
        type: "email" as const,
        title: "Sent proposal to Bob Smith",
        description: "Enterprise software license proposal",
        contactId: "contact-2",
        dealId: "deal-2",
        whitelabelId: "wl-1",
        userId: "user-2",
        createdAt: new Date("2024-01-24T14:15:00"),
      },
      {
        id: "activity-3",
        type: "meeting" as const,
        title: "Demo session with Carol Davis",
        description: "Product demonstration and Q&A",
        contactId: "contact-3",
        whitelabelId: "wl-2",
        userId: "user-3",
        createdAt: new Date("2024-01-23T16:00:00"),
      },
    ]

    return mockActivities.filter((activity) => activity.whitelabelId === this.whitelabelId)
  }

  createActivity(activityData: Omit<Activity, "id" | "createdAt">): Activity {
    const newActivity: Activity = {
      ...activityData,
      id: `activity-${Date.now()}`,
      whitelabelId: this.whitelabelId, // Ensure whitelabel isolation
      createdAt: new Date(),
    }

    // In a real app, this would save to database
    return newActivity
  }

  // Analytics methods - isolated by whitelabel
  getAnalytics() {
    const contacts = this.getContacts()
    const deals = this.getDeals()
    const activities = this.getActivities()

    const totalRevenue = deals.filter((d) => d.stage === "closed-won").reduce((sum, deal) => sum + deal.value, 0)

    const pipelineValue = deals
      .filter((d) => d.stage !== "closed-won" && d.stage !== "closed-lost")
      .reduce((sum, deal) => sum + deal.value, 0)

    const contactsByStatus = contacts.reduce(
      (acc, contact) => {
        acc[contact.status] = (acc[contact.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const dealsByStage = deals.reduce(
      (acc, deal) => {
        acc[deal.stage] = (acc[deal.stage] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalContacts: contacts.length,
      totalDeals: deals.length,
      totalActivities: activities.length,
      totalRevenue,
      pipelineValue,
      contactsByStatus,
      dealsByStage,
    }
  }

  getFunnelStats() {
    const contacts = this.getContacts()

    const funnelStats = {
      novoLead: 0,
      emContato: 0,
      reuniao: 0,
      emNegociacao: 0,
      fechado: 0,
      perdido: 0,
    }

    contacts.forEach((contact) => {
      switch (contact.status) {
        case "novo-lead":
          funnelStats.novoLead++
          break
        case "em-contato":
          funnelStats.emContato++
          break
        case "reuniao":
          funnelStats.reuniao++
          break
        case "em-negociacao":
          funnelStats.emNegociacao++
          break
        case "fechado":
          funnelStats.fechado++
          break
        case "perdido":
          funnelStats.perdido++
          break
      }
    })

    return funnelStats
  }
}

// Factory function to create data service with whitelabel isolation
export function createDataService(whitelabelId: string): DataService {
  return new DataService(whitelabelId)
}

// Hook to use data service with current user's whitelabel
export function useDataService() {
  // This would typically use the auth context
  // For now, we'll return a function that creates the service
  return (whitelabelId: string) => createDataService(whitelabelId)
}
