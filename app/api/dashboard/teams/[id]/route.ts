import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function PATCH(
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
    const { name, color, logoUrl } = body

    console.log("[Teams API] Updating team:", teamId, body)

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

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) updates.name = name
    if (color !== undefined) updates.color = color
    if (logoUrl !== undefined) updates.logo_url = logoUrl

    // Update the team
    const { data: updatedTeam, error: updateError } = await supabase
      .from("teams")
      .update(updates)
      .eq("id", teamId)
      .select()
      .single()

    if (updateError) {
      console.error("[Teams API] Error updating team:", updateError)
      return NextResponse.json({ error: "Failed to update team" }, { status: 500 })
    }

    console.log("[Teams API] Team updated successfully:", updatedTeam)

    // Get team members (employees assigned to this team)
    const { data: teamMembers } = await supabase
      .from("employees")
      .select("id")
      .eq("team_id", teamId)

    const memberIds = teamMembers?.map((emp) => emp.id) || []

    return NextResponse.json({
      ...updatedTeam,
      logoUrl: updatedTeam.logo_url,
      memberIds,
      whitelabelId: updatedTeam.whitelabel_id,
      createdAt: updatedTeam.created_at,
      updatedAt: updatedTeam.updated_at,
    })
  } catch (error) {
    console.error("Error updating team:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
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

    console.log("[Teams API DELETE] User lookup:", {
      email: authUser.email,
      found: !!user,
      error: userError?.message,
      role: user?.role,
      whitelabel: user?.whitelabel_id
    })

    if (userError || !user) {
      console.error("[Teams API DELETE] User not found:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Await params (Next.js 15+)
    const params = await context.params
    const teamId = params.id

    console.log("[Teams API] Deleting team:", teamId, "for whitelabel:", user.whitelabel_id)

    // Verify team belongs to user's whitelabel
    const { data: existingTeam, error: teamError } = await supabase
      .from("teams")
      .select("*, logo_url")
      .eq("id", teamId)
      .eq("whitelabel_id", user.whitelabel_id)
      .single()

    console.log("[Teams API DELETE] Team lookup:", {
      teamId,
      found: !!existingTeam,
      error: teamError?.message,
      teamWhitelabel: existingTeam?.whitelabel_id,
      userWhitelabel: user.whitelabel_id,
      match: existingTeam?.whitelabel_id === user.whitelabel_id
    })

    if (teamError || !existingTeam) {
      console.error("[Teams API DELETE] Team not found or RLS blocked:", teamError)
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Delete team logo from storage if exists
    if (existingTeam.logo_url) {
      const logoPath = existingTeam.logo_url.split('/').pop()
      if (logoPath) {
        await supabase.storage
          .from("team-logos")
          .remove([logoPath])
      }
    }

    // Delete the team (cascade will handle team_members)
    const { error: deleteError } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId)

    if (deleteError) {
      console.error("Error deleting team:", deleteError)
      return NextResponse.json({ error: "Failed to delete team" }, { status: 500 })
    }

    return NextResponse.json({ message: "Team deleted successfully" })
  } catch (error) {
    console.error("Error deleting team:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
