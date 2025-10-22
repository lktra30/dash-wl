import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { authenticateUser, createErrorResponse, createSuccessResponse } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser(request)
    
    if (error || !user) {
      return createErrorResponse(error || "Unauthorized", 401)
    }

    const supabase = await getSupabaseServerClient()
    const whitelabelId = user.whitelabel_id

    // Fetch deals with related data using joins
    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select(`
        id,
        title,
        value,
        status,
        expected_close_date,
        created_at,
        updated_at,
        contact_id,
        contacts (
          id,
          name,
          email,
          company
        ),
        sdr:employees!deals_sdr_id_fkey (
          id,
          name,
          email
        ),
        closer:employees!deals_closer_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq("whitelabel_id", whitelabelId)
      .order("created_at", { ascending: false })

    if (dealsError) {
      console.error("Error fetching deals:", dealsError)
      return createErrorResponse("Failed to fetch deals", 500)
    }

    // Calculate statistics
    const stats = {
      totalCount: deals?.length || 0,
      wonCount: deals?.filter((d) => d.status === "won").length || 0,
      lostCount: deals?.filter((d) => d.status === "lost").length || 0,
      openCount: deals?.filter((d) => d.status === "open").length || 0,
      totalValue: deals?.reduce((sum, d) => sum + Number(d.value || 0), 0) || 0,
      wonValue: deals?.filter((d) => d.status === "won").reduce((sum, d) => sum + Number(d.value || 0), 0) || 0,
      lostValue: deals?.filter((d) => d.status === "lost").reduce((sum, d) => sum + Number(d.value || 0), 0) || 0,
      openValue: deals?.filter((d) => d.status === "open").reduce((sum, d) => sum + Number(d.value || 0), 0) || 0,
      conversionRate: 0,
    }

    // Calculate conversion rate
    const closedCount = stats.wonCount + stats.lostCount
    stats.conversionRate = closedCount > 0 ? (stats.wonCount / closedCount) * 100 : 0

    return createSuccessResponse({
      deals: deals || [],
      stats,
    })
  } catch (error) {
    console.error("Error in deals API:", error)
    return createErrorResponse("Internal Server Error", 500)
  }
}
