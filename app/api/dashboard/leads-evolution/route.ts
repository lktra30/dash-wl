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

    // Calculate date 12 months ago
    const now = new Date()
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    // Fetch all contacts from the last 12 months with their stage information
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select(`
        id,
        created_at,
        funnel_stage,
        stage_id,
        pipeline_stages!stage_id (
          id,
          name,
          counts_as_meeting,
          counts_as_sale
        )
      `)
      .eq("whitelabel_id", user.whitelabel_id)
      .gte("created_at", twelveMonthsAgo.toISOString())
      .order("created_at", { ascending: true })

    if (contactsError) {
      console.error("Error fetching contacts:", contactsError)
      return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
    }

    // Group contacts by month and count meetings/sales
    const monthlyData: { [key: string]: { meetings: number; sales: number } } = {}

    contacts?.forEach((contact: any) => {
      const date = new Date(contact.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { meetings: 0, sales: 0 }
      }

      // Check if it's a sale
      const isSale =
        contact.pipeline_stages?.counts_as_sale === true ||
        contact.funnel_stage === 'won'

      // Check if it's a meeting (including sales - all sales count as meetings)
      const isMeeting =
        contact.pipeline_stages?.counts_as_meeting === true ||
        contact.pipeline_stages?.counts_as_sale === true ||
        contact.funnel_stage === 'meeting' ||
        contact.funnel_stage === 'reuniao' ||
        contact.funnel_stage === 'won'

      if (isMeeting) {
        monthlyData[monthKey].meetings++
      }

      if (isSale) {
        monthlyData[monthKey].sales++
      }
    })

    // Fill in missing months with zeros and sort
    const result: { date: string; meetings: number; sales: number }[] = []
    const currentDate = new Date(twelveMonthsAgo)

    while (currentDate <= now) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

      result.push({
        date: monthKey,
        meetings: monthlyData[monthKey]?.meetings || 0,
        sales: monthlyData[monthKey]?.sales || 0,
      })

      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    // Add cache header for 5 minutes
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error("Error in leads evolution API:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
