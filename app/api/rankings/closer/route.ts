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

    // Get whitelabel settings including business model
    const { data: whitelabel, error: whitelabelError } = await supabase
      .from("whitelabels")
      .select("business_model")
      .eq("id", userData.whitelabel_id)
      .single()

    if (whitelabelError) {
      console.error("Error fetching whitelabel:", whitelabelError)
      return NextResponse.json({ error: "Failed to fetch whitelabel settings" }, { status: 500 })
    }

    const businessModel = whitelabel?.business_model || "TCV"

    // Get monthly goal target for Closers (in sales value)
    const { data: commissionSettings } = await supabase
      .from("commissions_settings")
      .select("closer_sales_target")
      .eq("whitelabel_id", userData.whitelabel_id)
      .single()

    const monthlyTarget = commissionSettings?.closer_sales_target || 10000

    // Count total active Closers (role = 'sales')
    const { data: closerEmployees, error: closerCountError } = await supabase
      .from("employees")
      .select("id")
      .eq("whitelabel_id", userData.whitelabel_id)
      .eq("role", "sales")

    if (closerCountError) {
      console.error("Error counting Closers:", closerCountError)
    }

    const totalClosers = closerEmployees?.length || 1 // Avoid division by zero
    const individualTarget = Math.round((monthlyTarget / totalClosers) * 100) / 100

    // Get Closer ranking based on deals with status 'won'
    const { data: closerRanking, error: rankingError } = await supabase
      .from("deals")
      .select(`
        closer_id,
        value,
        duration,
        employees!deals_closer_id_fkey (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq("whitelabel_id", userData.whitelabel_id)
      .eq("status", "won")
      .not("closer_id", "is", null)

    if (rankingError) {
      console.error("Error fetching Closer ranking:", rankingError)
      return NextResponse.json({ error: "Failed to fetch Closer ranking" }, { status: 500 })
    }

    // Count closed deals and total revenue per Closer
    const closerCounts = new Map<string, {
      id: string
      name: string
      email: string
      avatarUrl: string | null
      closedDealsCount: number
      totalRevenue: number
      goalTarget: number
      goalPercentage: number
    }>()

    closerRanking.forEach((deal: any) => {
      if (deal.employees && deal.closer_id) {
        const employee = deal.employees
        const existing = closerCounts.get(deal.closer_id)
        
        // Calculate revenue based on business model
        let dealRevenue = 0
        if (businessModel === "MRR") {
          const value = Number(deal.value) || 0
          const duration = Number(deal.duration) || 0
          // Only include deals with valid duration > 0 for MRR
          if (duration > 0) {
            dealRevenue = value / duration
          }
        } else {
          // TCV: use total value
          dealRevenue = Number(deal.value) || 0
        }
        
        if (existing) {
          existing.closedDealsCount++
          existing.totalRevenue += dealRevenue
        } else {
          closerCounts.set(deal.closer_id, {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            avatarUrl: employee.avatar_url,
            closedDealsCount: 1,
            totalRevenue: dealRevenue,
            goalTarget: individualTarget,
            goalPercentage: 0, // Will be calculated below
          })
        }
      }
    })

    // Calculate goal percentage for each Closer based on total revenue
    closerCounts.forEach((closer) => {
      closer.goalPercentage = individualTarget > 0 
        ? Math.round((closer.totalRevenue / individualTarget) * 100 * 100) / 100
        : 0
    })

    // Convert to array and sort by closedDealsCount (primary) and totalRevenue (secondary)
    const ranking = Array.from(closerCounts.values())
      .sort((a, b) => {
        if (b.closedDealsCount !== a.closedDealsCount) {
          return b.closedDealsCount - a.closedDealsCount
        }
        return b.totalRevenue - a.totalRevenue
      })
      .slice(0, limit)

    return NextResponse.json({ ranking, businessModel })
  } catch (error) {
    console.error("Error in Closer ranking API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
