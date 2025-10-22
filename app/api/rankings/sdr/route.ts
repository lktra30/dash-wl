import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's whitelabel_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("whitelabel_id")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get monthly goal target for SDRs
    const { data: commissionSettings } = await supabase
      .from("commissions_settings")
      .select("sdr_meetings_target")
      .eq("whitelabel_id", userData.whitelabel_id)
      .single()

    const monthlyTarget = commissionSettings?.sdr_meetings_target || 20

    // Count total active SDRs
    const { data: sdrEmployees, error: sdrCountError } = await supabase
      .from("employees")
      .select("id")
      .eq("whitelabel_id", userData.whitelabel_id)
      .eq("role", "sdr")

    if (sdrCountError) {
      console.error("Error counting SDRs:", sdrCountError)
    }

    const totalSDRs = sdrEmployees?.length || 1 // Avoid division by zero
    const individualTarget = Math.round((monthlyTarget / totalSDRs) * 100) / 100

    // Get SDR ranking based on contacts with stages: negotiation, won, or lost
    // These stages indicate meetings were held (reunião realizada)
    const { data: sdrRanking, error: rankingError } = await supabase
      .from("contacts")
      .select(`
        sdr_id,
        employees!contacts_sdr_id_fkey (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq("whitelabel_id", userData.whitelabel_id)
      .in("funnel_stage", ["negotiation", "won", "lost"])
      .not("sdr_id", "is", null)

    if (rankingError) {
      console.error("Error fetching SDR ranking:", rankingError)
      return NextResponse.json({ error: "Failed to fetch SDR ranking" }, { status: 500 })
    }

    // Count meetings per SDR
    const sdrCounts = new Map<string, {
      id: string
      name: string
      email: string
      avatarUrl: string | null
      meetingsCount: number
      goalTarget: number
      goalPercentage: number
    }>()

    sdrRanking.forEach((contact: any) => {
      if (contact.employees && contact.sdr_id) {
        const employee = contact.employees
        const existing = sdrCounts.get(contact.sdr_id)
        
        if (existing) {
          existing.meetingsCount++
        } else {
          sdrCounts.set(contact.sdr_id, {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            avatarUrl: employee.avatar_url,
            meetingsCount: 1,
            goalTarget: individualTarget,
            goalPercentage: 0, // Will be calculated below
          })
        }
      }
    })

    // Calculate goal percentage for each SDR
    sdrCounts.forEach((sdr) => {
      sdr.goalPercentage = individualTarget > 0 
        ? Math.round((sdr.meetingsCount / individualTarget) * 100 * 100) / 100
        : 0
    })

    // Convert to array and sort by meetingsCount
    const ranking = Array.from(sdrCounts.values())
      .sort((a, b) => b.meetingsCount - a.meetingsCount)
      .slice(0, limit)

    return NextResponse.json(ranking)
  } catch (error) {
    console.error("Error in SDR ranking API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
