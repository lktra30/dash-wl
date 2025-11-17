import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

/**
 * Optimized Analytics API - Uses materialized view for instant metrics
 * Previously: Fetched all deals and calculated in JavaScript
 * Now: Uses dashboard_analytics_mv for pre-calculated metrics (10-100x faster)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's whitelabel information (optimized query with specific fields)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("whitelabel_id, id, email")
      .eq("email", authUser.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const whitelabelId = user.whitelabel_id

    // Use materialized view for instant analytics (OPTIMIZED!)
    const { data: analytics, error: analyticsError } = await supabase
      .from("dashboard_analytics_mv")
      .select("*")
      .eq("whitelabel_id", whitelabelId)
      .single()

    if (analyticsError) {
      console.error("Error fetching analytics from materialized view:", analyticsError)
      // Fallback to manual calculation if view fails
      return await getFallbackAnalytics(supabase, whitelabelId)
    }

    // Transform to frontend-expected format
    const response = {
      totalContacts: analytics.total_contacts || 0,
      totalDeals: analytics.total_deals || 0,
      totalRevenue: Number(analytics.total_revenue) || 0,
      pipelineValue: Number(analytics.pipeline_value) || 0,
      avgDealValue: Number(analytics.avg_deal_value) || 0,
      
      // Additional metrics from materialized view
      openDeals: analytics.open_deals_count || 0,
      wonDeals: analytics.won_deals_count || 0,
      lostDeals: analytics.lost_deals_count || 0,
      
      newLeads: analytics.new_leads_count || 0,
      contactedLeads: analytics.contacted_count || 0,
      meetingsScheduled: analytics.meeting_count || 0,
      inNegotiation: analytics.negotiation_count || 0,
      wonContacts: analytics.won_contacts_count || 0,
      lostContacts: analytics.lost_count || 0,
      
      totalMeetings: analytics.total_meetings || 0,
      completedMeetings: analytics.completed_meetings || 0,
      convertedMeetings: analytics.converted_meetings || 0,
      
      totalEmployees: analytics.total_employees || 0,
      activeEmployees: analytics.active_employees || 0,
      totalTeams: analytics.total_teams || 0,
      
      lastUpdated: analytics.last_updated,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * Fallback function for when materialized view is not available
 * Uses optimized queries with partial indexes
 */
async function getFallbackAnalytics(supabase: any, whitelabelId: string) {
  try {
    // Optimized: Only count, don't fetch data
    const { count: totalContacts } = await supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("whitelabel_id", whitelabelId)

    // Optimized: Use partial indexes for won/open deals
    const { data: wonDeals } = await supabase
      .from("deals")
      .select("value")
      .eq("whitelabel_id", whitelabelId)
      .eq("status", "won")

    const { data: openDeals } = await supabase
      .from("deals")
      .select("value")
      .eq("whitelabel_id", whitelabelId)
      .eq("status", "open")

    const { count: totalDeals } = await supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("whitelabel_id", whitelabelId)

    const totalRevenue = wonDeals?.reduce((sum: number, d: any) => sum + Number(d.value), 0) || 0
    const pipelineValue = openDeals?.reduce((sum: number, d: any) => sum + Number(d.value), 0) || 0

    return NextResponse.json({
      totalContacts: totalContacts || 0,
      totalDeals: totalDeals || 0,
      totalRevenue,
      pipelineValue,
    })
  } catch (error) {
    console.error("Error in fallback analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}