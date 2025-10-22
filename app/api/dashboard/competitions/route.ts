import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's whitelabel information
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*, whitelabel_id")
      .eq("email", authUser.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // For now, return mock competition data since the competition system might not be fully implemented
    // In a real implementation, you would fetch from a competitions table
    const mockCompetitions = [
      {
        id: "comp-1",
        name: "Q4 Sales Challenge",
        description: "Quarterly sales competition",
        type: "revenue",
        startDate: new Date("2024-10-01"),
        endDate: new Date("2024-12-31"),
        isActive: true,
        whitelabel_id: user.whitelabel_id,
      }
    ]

    // Filter active competitions for this whitelabel
    const activeCompetitions = mockCompetitions.filter(comp => 
      comp.isActive && comp.whitelabel_id === user.whitelabel_id
    )

    return NextResponse.json(activeCompetitions)
  } catch (error) {
    console.error("Error fetching competitions:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}