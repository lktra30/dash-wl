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

    // Fetch all data in parallel
    const [
      { count: totalContacts },
      { data: contacts },
      { data: allContactsForMetrics },
      { data: dealsRaw, count: totalDeals },
      { data: teams }
    ] = await Promise.all([
      supabase.from("contacts").select("*", { count: "exact", head: true }).eq("whitelabel_id", whitelabelId),
      supabase.from("contacts").select("*").eq("whitelabel_id", whitelabelId).order("created_at", { ascending: false }).limit(5),
      supabase.from("contacts").select(`
        id,
        funnel_stage,
        pipeline_stages!stage_id (
          counts_as_meeting,
          counts_as_sale
        )
      `).eq("whitelabel_id", whitelabelId),
      supabase.from("deals").select("*", { count: "exact" }).eq("whitelabel_id", whitelabelId).order("created_at", { ascending: false }),
      supabase.from("teams").select(`
        *,
        team_members(user_id)
      `).eq("whitelabel_id", whitelabelId).order("created_at", { ascending: false })
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
      assignedTo: deal.assigned_to,
      sdrId: deal.sdr_id,
      closerId: deal.closer_id,
      expectedCloseDate: deal.expected_close_date,
      createdAt: deal.created_at,
      updatedAt: deal.updated_at,
    })) || []

    // Calculate analytics
    const totalRevenue = deals?.filter((d) => d.status === "won").reduce((sum, d) => sum + Number(d.value), 0) || 0
    const pipelineValue = deals?.filter((d) => d.status === "open").reduce((sum, d) => sum + Number(d.value), 0) || 0

    // Calculate aggregated meetings and sales across all pipelines
    // Note: All sales should count as meetings, but not all meetings are sales
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

    const analytics = {
      totalContacts: totalContacts || 0,
      totalDeals: totalDeals || 0,
      totalRevenue,
      pipelineValue,
      totalMeetings,
      totalSales,
    }

    // Calculate team stats
    const teamsWithStats = teams?.map((team) => {
      // Normalize team member user IDs for reliable comparisons
      const memberIds = (team.team_members?.map((tm: any) => tm.user_id).filter(Boolean) || []).map(String)

      // Match deals where any team member owns, sources, or closes it
      const teamDeals = (deals || []).filter((deal) => {
        if (memberIds.length === 0) return false

        const assignedId = deal.assignedTo != null ? String(deal.assignedTo) : null
        const sdrId = deal.sdrId != null ? String(deal.sdrId) : null
        const closerId = deal.closerId != null ? String(deal.closerId) : null

        return memberIds.some((memberId) => {
          return (
            (assignedId !== null && memberId === assignedId) ||
            (sdrId !== null && memberId === sdrId) ||
            (closerId !== null && memberId === closerId)
          )
        })
      })

      const totalRevenue = teamDeals.filter((d) => d.status === "won").reduce((sum, d) => sum + Number(d.value), 0)
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
    // For now, using mock data
    const adSpend = 5000 // Mock ad spend for current period

    // TODO: Calculate previous period data for trends
    // For now, using mock data
    const previousPeriodData = {
      totalSales: totalRevenue * 0.85, // Mock: 15% growth
      averageTicket: totalRevenue > 0 && deals ? (totalRevenue / deals.filter(d => d.status === "won").length) * 0.9 : 0,
      cac: 45, // Mock previous CAC
      roas: 2.5, // Mock previous ROAS
      adSpend: 4800,
    }

    return createSuccessResponse({
      analytics,
      contacts: contacts || [],
      deals: deals || [], // Return ALL deals for calculations
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
