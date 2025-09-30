import { getSupabaseBrowserClient } from "./supabase/client"
import type { Contact, Deal, Team, User, Whitelabel } from "./types"

export class SupabaseDataService {
  private supabase = getSupabaseBrowserClient()
  private whitelabelId: string

  constructor(whitelabelId: string) {
    this.whitelabelId = whitelabelId
  }

  // Whitelabel methods
  async getWhitelabel(whitelabelId: string): Promise<Whitelabel | null> {
    const { data, error } = await this.supabase.from("whitelabels").select("*").eq("id", whitelabelId).single()

    if (error) {
      console.error("[v0] Error fetching whitelabel:", error)
      return null
    }

    return data
  }

  async updateWhitelabel(whitelabelId: string, updates: Partial<Whitelabel>): Promise<void> {
    const { error } = await this.supabase
      .from("whitelabels")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", whitelabelId)

    if (error) {
      console.error("[v0] Error updating whitelabel:", error)
      throw error
    }
  }

  // User methods
  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user: authUser },
    } = await this.supabase.auth.getUser()

    if (!authUser) return null

    const { data, error } = await this.supabase.from("users").select("*").eq("email", authUser.email).single()

    if (error) {
      console.error("[v0] Error fetching user:", error)
      return null
    }

    return data
  }

  async getUsers(whitelabelId: string): Promise<User[]> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("whitelabel_id", whitelabelId)
      .order("name")

    if (error) {
      console.error("[v0] Error fetching users:", error)
      return []
    }

    return data || []
  }

  // Contact methods
  async getContacts(): Promise<Contact[]> {
    return this._getContacts()
  }

  private async _getContacts(): Promise<Contact[]> {
    const { data, error } = await this.supabase
      .from("contacts")
      .select("*")
      .eq("whitelabel_id", this.whitelabelId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching contacts:", error)
      return []
    }

    return data || []
  }

  async createContact(contact: Omit<Contact, "id" | "created_at" | "updated_at">): Promise<Contact | null> {
    const { data, error } = await this.supabase
      .from("contacts")
      .insert({ ...contact, whitelabel_id: this.whitelabelId })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating contact:", error)
      return null
    }

    return data
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<void> {
    const { error } = await this.supabase
      .from("contacts")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("[v0] Error updating contact:", error)
      throw error
    }
  }

  async deleteContact(id: string): Promise<void> {
    const { error } = await this.supabase.from("contacts").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting contact:", error)
      throw error
    }
  }

  // Deal methods
  async getDeals(): Promise<Deal[]> {
    return this._getDeals()
  }

  private async _getDeals(): Promise<Deal[]> {
    const { data, error } = await this.supabase
      .from("deals")
      .select("*")
      .eq("whitelabel_id", this.whitelabelId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching deals:", error)
      return []
    }

    return data || []
  }

  async createDeal(deal: Omit<Deal, "id" | "created_at" | "updated_at">): Promise<Deal | null> {
    const { data, error } = await this.supabase
      .from("deals")
      .insert({ ...deal, whitelabel_id: this.whitelabelId })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating deal:", error)
      return null
    }

    return data
  }

  async updateDeal(id: string, updates: Partial<Deal>): Promise<void> {
    const { error } = await this.supabase
      .from("deals")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("[v0] Error updating deal:", error)
      throw error
    }
  }

  // Team methods
  async getTeams(): Promise<Team[]> {
    return this._getTeams()
  }

  private async _getTeams(): Promise<Team[]> {
    const { data, error } = await this.supabase
      .from("teams")
      .select(`
        *,
        team_members (
          user_id,
          users (*)
        )
      `)
      .eq("whitelabel_id", this.whitelabelId)
      .order("name")

    if (error) {
      console.error("[v0] Error fetching teams:", error)
      return []
    }

    return (
      data?.map((team) => ({
        ...team,
        members: team.team_members?.map((tm: any) => tm.users) || [],
        memberIds: team.team_members?.map((tm: any) => tm.user_id) || [],
      })) || []
    )
  }

  // Analytics method for dashboard stats
  async getAnalytics() {
    const contacts = await this._getContacts()
    const deals = await this._getDeals()

    const totalRevenue = deals.filter((d) => d.status === "won").reduce((sum, d) => sum + Number(d.value), 0)

    const pipelineValue = deals.filter((d) => d.status === "open").reduce((sum, d) => sum + Number(d.value), 0)

    return {
      totalContacts: contacts.length,
      totalDeals: deals.length,
      totalRevenue,
      pipelineValue,
    }
  }

  // Top teams method
  async getTopTeams(limit = 2) {
    const teams = await this._getTeams()
    const deals = await this._getDeals()

    const teamsWithStats = await Promise.all(
      teams.map(async (team) => {
        const teamDeals = deals.filter(
          (deal) => team.memberIds.some((memberId) => deal.contact_id), // Simplified for now
        )

        const totalRevenue = teamDeals.filter((d) => d.status === "won").reduce((sum, d) => sum + Number(d.value), 0)

        const closedDeals = teamDeals.filter((d) => d.status === "won").length

        return {
          ...team,
          stats: {
            totalRevenue,
            closedDeals,
            activeDeals: teamDeals.filter((d) => d.status === "open").length,
          },
        }
      }),
    )

    return teamsWithStats.sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue).slice(0, limit)
  }

  // Active competitions method
  getActiveCompetitions() {
    // Mock competition for now
    return [
      {
        id: "1",
        name: "Batalha de Vendas Q4",
        description: "Competição trimestral entre equipes",
        startDate: "2025-10-01",
        endDate: "2025-12-31",
        isActive: true,
      },
    ]
  }

  // Funnel statistics
  async getFunnelStats() {
    const contacts = await this._getContacts()

    const stats = {
      novoLead: contacts.filter((c) => c.funnel_stage === "new_lead").length,
      emContato: contacts.filter((c) => c.funnel_stage === "contacted").length,
      reuniao: contacts.filter((c) => c.funnel_stage === "meeting").length,
      emNegociacao: contacts.filter((c) => c.funnel_stage === "negotiation").length,
      fechado: contacts.filter((c) => c.funnel_stage === "closed").length,
      perdido: contacts.filter((c) => c.funnel_stage === "lost").length,
    }

    return stats
  }
}

export function createSupabaseDataService(whitelabelId: string) {
  return new SupabaseDataService(whitelabelId)
}

export const supabaseDataService = {
  getCurrentUser: async () => {
    const supabase = getSupabaseBrowserClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return null

    const { data, error } = await supabase.from("users").select("*").eq("email", authUser.email).single()
    if (error) {
      console.error("[v0] Error fetching user:", error)
      return null
    }
    return data
  },

  getWhitelabel: async (whitelabelId: string) => {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from("whitelabels").select("*").eq("id", whitelabelId).single()
    if (error) {
      console.error("[v0] Error fetching whitelabel:", error)
      return null
    }
    return data
  },

  updateWhitelabel: async (whitelabelId: string, updates: Partial<Whitelabel>) => {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase
      .from("whitelabels")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", whitelabelId)
    if (error) {
      console.error("[v0] Error updating whitelabel:", error)
      throw error
    }
  },
}
