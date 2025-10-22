import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getUserRoleWithFallback, hasSettingsAccess } from "@/lib/permissions"

export async function PATCH(request: NextRequest) {
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
      .select("*")
      .eq("email", session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user role with fallback (employee table or users table)
    const userRole = await getUserRoleWithFallback(session.user.email!, user)

    // Verify permission to edit team competition settings (admin or SuperAdmin only)
    if (!hasSettingsAccess(userRole)) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem alterar configurações de competição de equipes." }, 
        { status: 403 }
      )
    }

    const body = await request.json()
    const { team_competition } = body

    if (typeof team_competition !== "boolean") {
      return NextResponse.json(
        { error: "team_competition must be a boolean" },
        { status: 400 }
      )
    }

    // Update whitelabel settings
    const { error: updateError } = await supabase
      .from("whitelabels")
      .update({ team_competition })
      .eq("id", user.whitelabel_id)

    if (updateError) {
      console.error("Error updating team competition setting:", updateError)
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      team_competition,
    })
  } catch (error) {
    console.error("Error in team competition settings API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
