import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    // Verify authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's whitelabel_id
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("whitelabel_id")
      .eq("email", session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get whitelabel settings including business model
    const { data: whitelabel, error: whitelabelError } = await supabase
      .from("whitelabels")
      .select("business_model")
      .eq("id", user.whitelabel_id)
      .single()

    if (whitelabelError) {
      console.error("Error fetching whitelabel:", whitelabelError)
      return NextResponse.json({ error: "Failed to fetch whitelabel settings" }, { status: 500 })
    }

    const businessModel = whitelabel?.business_model || "TCV"

    // Get all teams for this whitelabel
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, color")
      .eq("whitelabel_id", user.whitelabel_id)
      .order("name")

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
    }

    // Get all employees with their team_id
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, team_id")
      .eq("whitelabel_id", user.whitelabel_id)
      .eq("status", "active")

    if (employeesError) {
      console.error("Error fetching employees:", employeesError)
      return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
    }

    // Get all deals for this whitelabel with employee data
    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select("id, value, duration, status, sdr_id, closer_id, created_at")
      .eq("whitelabel_id", user.whitelabel_id)

    if (dealsError) {
      console.error("Error fetching deals:", dealsError)
      return NextResponse.json({ error: "Failed to fetch deals" }, { status: 500 })
    }

    // Calculate team statistics
    const teamStats = teams.map((team: any) => {
      // Get team members
      const teamMembers = employees.filter((emp: any) => emp.team_id === team.id)
      const memberIds = teamMembers.map((m: any) => m.id)

      // Filter deals for this team (either SDR or Closer belongs to team)
      const teamDeals = deals.filter(
        (deal: any) =>
          (deal.sdr_id && memberIds.includes(deal.sdr_id)) ||
          (deal.closer_id && memberIds.includes(deal.closer_id))
      )

      const wonDeals = teamDeals.filter((d: any) => d.status === "won")
      const totalDeals = teamDeals.length
      
      // Calculate total revenue based on business model
      let totalRevenue = 0
      if (businessModel === "MRR") {
        // MRR: divide each deal value by its duration to get monthly recurring revenue
        totalRevenue = wonDeals.reduce((sum: number, deal: any) => {
          const value = Number(deal.value) || 0
          const duration = Number(deal.duration) || 0
          
          // Only include deals with valid duration > 0
          if (duration > 0) {
            return sum + (value / duration)
          }
          return sum
        }, 0)
      } else {
        // TCV: sum the total values of all won deals
        totalRevenue = wonDeals.reduce((sum: number, deal: any) => sum + (Number(deal.value) || 0), 0)
      }
      
      const conversionRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0

      return {
        id: team.id,
        name: team.name,
        color: team.color,
        totalRevenue,
        wonDeals: wonDeals.length,
        totalDeals,
        conversionRate,
        memberCount: teamMembers.length,
      }
    })

    // Sort by total revenue (descending)
    const rankedTeams = teamStats
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
      .map((team: any, index: number) => ({
        ...team,
        rank: index + 1,
      }))

    return NextResponse.json({
      success: true,
      rankings: rankedTeams,
      totalTeams: teams.length,
      businessModel: businessModel,
    })
  } catch (error) {
    console.error("Error in teams rankings API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
