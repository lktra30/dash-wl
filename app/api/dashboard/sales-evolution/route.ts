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

    // Calculate date range for last 12 months
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 12)

    // Get all deals with status "won" for the last 12 months
    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select("id, value, status, created_at")
      .eq("whitelabel_id", user.whitelabel_id)
      .eq("status", "won")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })

    if (dealsError) {
      console.error("Error fetching deals:", dealsError)
      return NextResponse.json({ error: "Failed to fetch deals" }, { status: 500 })
    }

    // Group deals by month
    const monthlyData = groupDealsByMonth(deals || [])

    return NextResponse.json({
      success: true,
      data: monthlyData,
    })
  } catch (error) {
    console.error("Error fetching sales evolution:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

interface Deal {
  id: string
  value: number
  status: string
  created_at: string
}

function groupDealsByMonth(deals: Deal[]): {
  date: string
  revenue: number
  count: number
}[] {
  const monthlyMap = new Map<string, { revenue: number; count: number }>()

  deals.forEach((deal) => {
    const date = new Date(deal.created_at)
    const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`

    const current = monthlyMap.get(sortKey) || { revenue: 0, count: 0 }
    monthlyMap.set(sortKey, {
      revenue: current.revenue + Number(deal.value || 0),
      count: current.count + 1,
    })
  })

  // Fill in missing months with zero values
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 12)

  const allMonths: { date: string; revenue: number; count: number }[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    const sortKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-01`
    const data = monthlyMap.get(sortKey) || { revenue: 0, count: 0 }

    allMonths.push({
      date: sortKey,
      revenue: parseFloat(data.revenue.toFixed(2)),
      count: data.count,
    })

    current.setMonth(current.getMonth() + 1)
  }

  return allMonths.sort((a, b) => a.date.localeCompare(b.date))
}
