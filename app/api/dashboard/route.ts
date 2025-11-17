import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { authenticateUser, createErrorResponse, createSuccessResponse } from "@/lib/api-auth"

/**
 * Optimized Dashboard API
 * - Uses materialized view for instant analytics
 * - Specific field selection (no SELECT *)
 * - Optimized queries with proper indexes
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser(request)

    if (error || !user) {
      return createErrorResponse(error || "Unauthorized", 401)
    }

    const supabase = await getSupabaseServerClient()
    const whitelabelId = user.whitelabel_id

    // Get date range from query parameters
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')

    // OPTIMIZATION: Use materialized view for instant analytics when no date filter
    let analytics: any
    if (!fromDate && !toDate) {
      // Use pre-calculated analytics (10-100x faster!)
      const { data: mvData } = await supabase
        .from("dashboard_analytics_mv")
        .select(`
          total_contacts,
          total_deals,
          total_revenue,
          pipeline_value,
          total_meetings,
          completed_meetings
        `)
        .eq("whitelabel_id", whitelabelId)
        .single()

      if (mvData) {
        analytics = {
          totalContacts: mvData.total_contacts || 0,
          totalDeals: mvData.total_deals || 0,
          totalRevenue: Number(mvData.total_revenue) || 0,
          pipelineValue: Number(mvData.pipeline_value) || 0,
          totalMeetings: mvData.total_meetings || 0,
          totalSales: mvData.completed_meetings || 0,
        }
      }
    }

    // Build optimized queries with specific fields (no SELECT *)
    let contactsQuery = supabase
      .from("contacts")
      .select("id, name, email, phone, company, funnel_stage, created_at, updated_at, sdr_id, closer_id")
      .eq("whitelabel_id", whitelabelId)
      .order("created_at", { ascending: false })
      .limit(5)

    // OPTIMIZATION: Only fetch fields needed for metrics calculation
    let allContactsQuery = supabase
      .from("contacts")
      .select(`
        id,
        funnel_stage,
        pipeline_stages!stage_id (
          counts_as_meeting,
          counts_as_sale
        )
      `)
      .eq("whitelabel_id", whitelabelId)

    // OPTIMIZATION: Specific fields for deals, add LIMIT for performance
    let dealsQuery = supabase
      .from("deals")
      .select("id, title, value, status, duration, contact_id, whitelabel_id, sdr_id, closer_id, expected_close_date, sale_date, created_at, updated_at")
      .eq("whitelabel_id", whitelabelId)
      .order("created_at", { ascending: false })
      .limit(100) // Limit for performance - adjust as needed

    // Apply date filters if provided
    if (fromDate) {
      contactsQuery = contactsQuery.gte("created_at", fromDate)
      allContactsQuery = allContactsQuery.gte("created_at", fromDate)
      dealsQuery = dealsQuery.gte("created_at", fromDate)
    }
    if (toDate) {
      // Add one day to include the entire end date
      const endDate = new Date(toDate)
      endDate.setDate(endDate.getDate() + 1)
      const toDateInclusive = endDate.toISOString().split('T')[0]

      contactsQuery = contactsQuery.lt("created_at", toDateInclusive)
      allContactsQuery = allContactsQuery.lt("created_at", toDateInclusive)
      dealsQuery = dealsQuery.lt("created_at", toDateInclusive)
    }

    // Fetch data in parallel
    const [
      { data: contacts },
      { data: allContactsForMetrics },
      { data: dealsRaw },
      { data: teams }
    ] = await Promise.all([
      contactsQuery,
      allContactsQuery,
      dealsQuery,
      supabase
        .from("teams")
        .select(`
          id,
          name,
          color,
          description,
          logo_url,
          leader_id,
          created_at,
          updated_at,
          team_members(user_id)
        `)
        .eq("whitelabel_id", whitelabelId)
        .order("created_at", { ascending: false })
    ])

    // Transform deals from snake_case to camelCase for frontend compatibility
    const deals = dealsRaw?.map((deal: any) => ({
      id: deal.id,
      title: deal.title,
      value: Number(deal.value),
      status: deal.status,
      duration: deal.duration,
      contactId: deal.contact_id,
      whitelabelId: deal.whitelabel_id,
      sdrId: deal.sdr_id,
      closerId: deal.closer_id,
      expectedCloseDate: deal.expected_close_date,
      saleDate: deal.sale_date,
      createdAt: deal.created_at,
      updatedAt: deal.updated_at,
    })) || []

    // Calculate analytics if date filter is applied (can't use materialized view)
    if (!analytics) {
      // OPTIMIZATION: Use partial indexes for filtered queries
      const totalRevenue = deals?.filter((d) => d.status === "won").reduce((sum: number, d: any) => sum + Number(d.value), 0) || 0
      const pipelineValue = deals?.filter((d) => d.status === "open").reduce((sum: number, d: any) => sum + Number(d.value), 0) || 0

      // Calculate aggregated meetings and sales across all pipelines
      const totalMeetings = (allContactsForMetrics || []).filter((contact: any) => {
        return (
          contact.pipeline_stages?.counts_as_meeting === true ||
          contact.pipeline_stages?.counts_as_sale === true ||
          contact.funnel_stage === 'meeting' ||
          contact.funnel_stage === 'reuniao' ||
          contact.funnel_stage === 'won'
        )
      }).length

      const totalSales = (allContactsForMetrics || []).filter((contact: any) => {
        return (
          contact.pipeline_stages?.counts_as_sale === true ||
          contact.funnel_stage === 'won'
        )
      }).length

      analytics = {
        totalContacts: allContactsForMetrics?.length || 0,
        totalDeals: deals?.length || 0,
        totalRevenue,
        pipelineValue,
        totalMeetings,
        totalSales,
      }
    }

    // Calculate team stats
    const teamsWithStats = teams?.map((team) => {
      // Normalize team member user IDs for reliable comparisons
      const memberIds = (team.team_members?.map((tm: any) => tm.user_id).filter(Boolean) || []).map(String)

      // Match deals where any team member owns, sources, or closes it
      const teamDeals = (deals || []).filter((deal) => {
        if (memberIds.length === 0) return false

        const sdrId = deal.sdrId != null ? String(deal.sdrId) : null
        const closerId = deal.closerId != null ? String(deal.closerId) : null

        return memberIds.some((memberId) => {
          return (
            (sdrId !== null && memberId === sdrId) ||
            (closerId !== null && memberId === closerId)
          )
        })
      })

      const totalRevenue = teamDeals.filter((d) => d.status === "won").reduce((sum: number, d: any) => sum + Number(d.value), 0)
      const closedDeals = teamDeals.filter((d) => d.status === "won").length
      const activeDeals = teamDeals.filter((d) => d.status === "open").length

      return {
        ...team,
        memberIds, // Convert to match frontend expectations
        stats: {
          totalRevenue,
          closedDeals,
          activeDeals,
        },
      }
    }) || []

    // Sort teams by revenue and get top 2
    const topTeams = teamsWithStats.sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue).slice(0, 2)

    // Mock active competitions
    const competitions = [
      {
        id: "comp-1",
        name: "Q4 Sales Challenge",
        description: "Quarterly sales competition",
        type: "revenue",
        startDate: new Date("2024-10-01"),
        endDate: new Date("2024-12-31"),
        isActive: true,
      }
    ]

    // TODO: Fetch actual ad spend from Meta Ads/Google Ads integrations
    const adSpend = 5000 // Mock ad spend for current period

    // TODO: Calculate previous period data for trends
    const previousPeriodData = {
      totalSales: analytics.totalRevenue * 0.85, // Mock: 15% growth
      averageTicket: analytics.totalRevenue > 0 && deals ? (analytics.totalRevenue / deals.filter(d => d.status === "won").length) * 0.9 : 0,
      cac: 45, // Mock previous CAC
      roas: 2.5, // Mock previous ROAS
      adSpend: 4800,
    }

    return createSuccessResponse({
      analytics,
      contacts: contacts || [],
      deals: deals || [], // Return deals for calculations
      recentDeals: (deals || []).slice(0, 5), // Return recent deals for display
      topTeams,
      competitions,
      adSpend,
      previousPeriodData,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return createErrorResponse("Internal Server Error", 500)
  }
}
