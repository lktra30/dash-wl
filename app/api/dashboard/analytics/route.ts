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

    // Get analytics data
    const whitelabelId = user.whitelabel_id

    // Get contacts count
    const { count: totalContacts } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("whitelabel_id", whitelabelId)

    // Get deals count and data
    const { data: deals, count: totalDeals } = await supabase
      .from("deals")
      .select("*", { count: "exact" })
      .eq("whitelabel_id", whitelabelId)

    // Calculate revenue metrics
    const totalRevenue = deals?.filter((d) => d.status === "won").reduce((sum, d) => sum + Number(d.value), 0) || 0
    const pipelineValue = deals?.filter((d) => d.status === "open").reduce((sum, d) => sum + Number(d.value), 0) || 0

    const analytics = {
      totalContacts: totalContacts || 0,
      totalDeals: totalDeals || 0,
      totalRevenue,
      pipelineValue,
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}