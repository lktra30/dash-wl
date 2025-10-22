import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json(
        { isSuperAdmin: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Get the user record from public.users to check role
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", authUser.id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { isSuperAdmin: false, error: "User record not found" },
        { status: 403 }
      )
    }

    const isSuperAdmin = user.role === "SuperAdmin"

    return NextResponse.json({ isSuperAdmin })
  } catch (error) {
    console.error("Error checking SuperAdmin status:", error)
    return NextResponse.json(
      { isSuperAdmin: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
