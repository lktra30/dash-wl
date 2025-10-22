import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[Teams API] Starting team stats fetch...")
    const supabase = await getSupabaseServerClient()
    
    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      console.error("[Teams API] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's whitelabel information
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*, whitelabel_id")
      .eq("email", authUser.email)
      .single()

    if (userError || !user) {
      console.error("[Teams API] User not found:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("[Teams API] Fetching stats for whitelabel:", user.whitelabel_id)

    // Call the optimized RPC function to get team stats
    const { data: teamStats, error: statsError } = await supabase
      .rpc("get_team_stats", { p_whitelabel_id: user.whitelabel_id })

    if (statsError) {
      console.error("[Teams API] Error fetching team stats:", statsError)
      return NextResponse.json({ error: "Failed to fetch team stats" }, { status: 500 })
    }

    console.log("[Teams API] Team stats fetched:", teamStats?.length, "teams")
    console.log("[Teams API] Stats details:", teamStats)

    // Get employees for detailed member information
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, name, email, avatar_url, team_id, role, department")
      .eq("whitelabel_id", user.whitelabel_id)
      .eq("status", "active")

    if (employeesError) {
      console.error("[Teams API] Error fetching employees:", employeesError)
    }

    // Transform the data to match frontend expectations
    const teamsWithStats = teamStats?.map((team: any) => {
      // Get detailed member information
      const members = employees?.filter((emp) => 
        team.member_ids?.includes(emp.id)
      ) || []

      return {
        id: team.team_id,
        name: team.team_name,
        color: team.team_color,
        whitelabelId: team.whitelabel_id,
        createdAt: team.team_created_at,
        updatedAt: team.team_updated_at,
        memberIds: team.member_ids || [],
        members: members,
        stats: {
          totalRevenue: Number(team.total_revenue),
          totalDeals: Number(team.total_deals),
          closedDeals: Number(team.won_deals),
          activeDeals: Number(team.open_deals),
        },
      }
    }) || []

    console.log("[Teams API] Returning", teamsWithStats.length, "teams with stats")

    return NextResponse.json(teamsWithStats)
  } catch (error) {
    console.error("[Teams API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's information
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*, whitelabel_id")
      .eq("email", authUser.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, color, memberIds, employeeIds } = body

    if (!name || !color) {
      return NextResponse.json({ error: "Name and color are required" }, { status: 400 })
    }

    // Create the team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({
        whitelabel_id: user.whitelabel_id,
        name,
        color,
      })
      .select()
      .single()

    if (teamError) {
      console.error("Error creating team:", teamError)
      return NextResponse.json({ error: "Failed to create team" }, { status: 500 })
    }

    // Add team members (employees) if provided
    if (employeeIds && employeeIds.length > 0) {
      const { error: employeeMembersError } = await supabase
        .from("employees")
        .update({ team_id: team.id })
        .in("id", employeeIds)

      if (employeeMembersError) {
        console.error("Error adding employee members:", employeeMembersError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ 
      ...team, 
      logoUrl: team.logo_url,
      memberIds: employeeIds || [],
      whitelabelId: team.whitelabel_id,
      createdAt: team.created_at,
      updatedAt: team.updated_at,
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating team:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}