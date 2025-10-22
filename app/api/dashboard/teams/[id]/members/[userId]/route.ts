import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
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
    const employeeId = params.userId // Note: this is actually employeeId

    console.log("[Teams API] Removing member:", employeeId, "from team:", teamId)

    // Verify team belongs to user's whitelabel
    const { data: existingTeam, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .eq("whitelabel_id", user.whitelabel_id)
      .single()

    if (teamError || !existingTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Remove employee from team by setting team_id to null
    const { error: updateError } = await supabase
      .from("employees")
      .update({ team_id: null })
      .eq("id", employeeId)
      .eq("team_id", teamId) // Ensure employee is actually on this team

    if (updateError) {
      console.error("[Teams API] Error removing team member:", updateError)
      return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 })
    }

    console.log("[Teams API] Member removed successfully")
    return NextResponse.json({ message: "Team member removed successfully" })
  } catch (error) {
    console.error("Error removing team member:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
