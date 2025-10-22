import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Await params (Next.js 15+)
    const params = await context.params
    const teamId = params.id
    const body = await request.json()
    const { employeeId, force = false } = body
    
    console.log("[Teams API] Adding member:", employeeId, "to team:", teamId, "force:", force)

    if (!employeeId) {
      console.error("[Teams API] Error: employeeId is required")
      return NextResponse.json({ error: "employeeId is required" }, { status: 400 })
    }

    // Verify team belongs to user's whitelabel
    const { data: existingTeam, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .eq("whitelabel_id", user.whitelabel_id)
      .single()

    if (teamError || !existingTeam) {
      console.error("[Teams API] Team not found:", teamError)
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    console.log("[Teams API] Team found:", existingTeam.name)

    // Verify employee exists and belongs to same whitelabel
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .eq("whitelabel_id", user.whitelabel_id)
      .single()

    if (employeeError || !employee) {
      console.error("[Teams API] Employee not found:", employeeError)
      return NextResponse.json({ error: "Employee not found or belongs to different whitelabel" }, { status: 404 })
    }

    console.log("[Teams API] Employee found:", employee.name, "current team_id:", employee.team_id)

    // Check if employee is already on another team
    if (employee.team_id && employee.team_id !== teamId) {
      // If force is not enabled, return error
      if (!force) {
        console.log("[Teams API] Employee on another team, force not enabled")
        
        // Get the current team name for better error message
        const { data: currentTeam } = await supabase
          .from("teams")
          .select("name")
          .eq("id", employee.team_id)
          .single()
        
        return NextResponse.json({ 
          error: "Employee is already assigned to another team",
          currentTeamId: employee.team_id,
          currentTeamName: currentTeam?.name || "Unknown Team",
          requiresConfirmation: true
        }, { status: 400 })
      }
      
      console.log("[Teams API] Force enabled, moving employee from team:", employee.team_id)
    }

    // Check if employee is already on this team
    if (employee.team_id === teamId) {
      console.error("[Teams API] Employee already on this team")
      return NextResponse.json({ error: "Employee is already a team member" }, { status: 400 })
    }

    // Assign employee to team
    const { data: updatedEmployee, error: updateError } = await supabase
      .from("employees")
      .update({ team_id: teamId })
      .eq("id", employeeId)
      .select()
      .single()

    if (updateError) {
      console.error("[Teams API] Error adding team member:", updateError)
      return NextResponse.json({ error: "Failed to add team member" }, { status: 500 })
    }

    console.log("[Teams API] Member added successfully:", updatedEmployee)
    return NextResponse.json({
      message: "Team member added successfully",
      employee: updatedEmployee,
    }, { status: 201 })
  } catch (error) {
    console.error("Error adding team member:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
