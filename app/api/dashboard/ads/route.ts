import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getMetaAdsCredentials } from "@/lib/supabase/meta-ads-credentials"

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get Meta API credentials from database
    const credentials = await getMetaAdsCredentials(supabase)

    if (!credentials) {
      return NextResponse.json(
        { 
          error: "Meta Ads não configurado", 
          message: "Configure o Access Token e Account ID nas Configurações"
        },
        { status: 400 }
      )
    }

    const { accessToken, accountId } = credentials

    // Get query parameters for date range
    const { searchParams } = new URL(request.url)
    const requestType = searchParams.get("type") || "cards" // 'cards' or 'chart'
    
    // Fields to request from Meta Ads API
    const fields = [
      "campaign_name",
      "campaign_id",
      "spend",
      "impressions",
      "clicks",
      "cpc",
      "cpm",
      "ctr",
      "reach",
      "frequency",
      "actions",
      "action_values",
      "cost_per_action_type",
      "purchase_roas",
      "date_start",
      "date_stop",
    ].join(",")

    let since: string
    let until: string
    let timeIncrement: string

    if (requestType === "chart") {
      // Chart: Show current month day by day
      const fromParam = searchParams.get("from")
      const toParam = searchParams.get("to")
      
      if (fromParam && toParam) {
        since = fromParam
        until = toParam
      } else {
        // Default to current month
        const today = new Date()
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        since = firstDay.toISOString().split('T')[0]
        until = today.toISOString().split('T')[0]
      }
      timeIncrement = "1" // Daily for chart
    } else {
      // Cards: Use date range from query params (filtered by page)
      const fromParam = searchParams.get("from")
      const toParam = searchParams.get("to")
      
      if (fromParam && toParam) {
        since = fromParam
        until = toParam
      } else {
        // Default to current month if no params
        const today = new Date()
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        since = firstDay.toISOString().split('T')[0]
        until = today.toISOString().split('T')[0]
      }
      timeIncrement = "1" // Daily for cards
    }

    // Call Meta Graph API v23.0 with correct time_range format
    const metaApiUrl = `https://graph.facebook.com/v23.0/${accountId}/insights?fields=${fields}&time_range[since]=${since}&time_range[until]=${until}&time_increment=${timeIncrement}&access_token=${accessToken}`

    const response = await fetch(metaApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Meta API Error:", errorData)
      return NextResponse.json(
        { error: "Failed to fetch Meta Ads data", details: errorData },
        { status: response.status }
      )
    }

    const metaData = await response.json()
    const insights = metaData.data || []

    // Get leads count from Supabase for the period
    const { count: leadsCount } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since)
      .lte("created_at", until)

    const totalLeads = leadsCount || 0

    // Get sales count from Supabase for the period (contacts in stages that count as sales)
    // Using contacts with stage_id referencing pipeline_stages where counts_as_sale = true
    const { data: salesData, error: salesError } = await supabase
      .from("contacts")
      .select(`
        id,
        stage_id,
        pipeline_stages!inner(counts_as_sale)
      `)
      .eq("pipeline_stages.counts_as_sale", true)
      .gte("created_at", since)
      .lte("created_at", until)

    if (salesError) {
      console.error("Error fetching sales count:", salesError)
    }

    const totalSales = salesData?.length || 0

    // Calculate aggregated metrics
    const metrics = calculateMetrics(insights, totalLeads, totalSales)

    // Transform data for time series
    const timeSeries = transformTimeSeriesData(insights, since, until)

    // Get campaign performance details
    const campaigns = transformCampaignData(insights)

    return NextResponse.json({
      success: true,
      metrics,
      timeSeries,
      campaigns,
      rawDataCount: insights.length,
    })
  } catch (error) {
    console.error("Error fetching Meta Ads data:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// Calculate aggregated metrics from insights data
function calculateMetrics(insights: any[], totalLeads: number = 0, totalSales: number = 0) {
  let totalSpend = 0
  let totalClicks = 0
  let totalImpressions = 0
  let totalPurchases = 0
  let totalRevenue = 0

  insights.forEach((insight) => {
    totalSpend += parseFloat(insight.spend || 0)
    totalClicks += parseInt(insight.clicks || 0)
    totalImpressions += parseInt(insight.impressions || 0)

    // Extract purchase actions and values
    if (insight.actions) {
      const purchaseAction = insight.actions.find(
        (action: any) => action.action_type === "purchase" || action.action_type === "omni_purchase"
      )
      if (purchaseAction) {
        totalPurchases += parseInt(purchaseAction.value || 0)
      }
    }

    if (insight.action_values) {
      const purchaseValue = insight.action_values.find(
        (action: any) => action.action_type === "purchase" || action.action_type === "omni_purchase"
      )
      if (purchaseValue) {
        totalRevenue += parseFloat(purchaseValue.value || 0)
      }
    }
  })

  // Calculate metrics
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0
  // CAC calculado usando vendas do sistema (contacts em estágios que contam como venda)
  const cac = totalSales > 0 ? totalSpend / totalSales : 0
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  return {
    totalSpend: parseFloat(totalSpend.toFixed(2)),
    totalClicks,
    totalImpressions,
    totalPurchases,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    roas: parseFloat(roas.toFixed(2)),
    roi: parseFloat(roi.toFixed(2)),
    cac: parseFloat(cac.toFixed(2)),
    cpc: parseFloat(cpc.toFixed(2)),
    ctr: parseFloat(ctr.toFixed(2)),
    totalLeads,
    totalSales,
  }
}

// Transform data for time series charts
function transformTimeSeriesData(insights: any[], since?: string, until?: string) {
  const timeSeriesMap = new Map<string, any>()

  // If date range is provided, initialize all days with zero values
  if (since && until) {
    const startDate = new Date(since)
    const endDate = new Date(until)
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0]
      timeSeriesMap.set(dateStr, {
        date: dateStr,
        spend: 0,
        revenue: 0,
        clicks: 0,
        impressions: 0,
        purchases: 0,
      })
    }
  }

  insights.forEach((insight) => {
    const date = insight.date_start || new Date().toISOString().split("T")[0]

    if (!timeSeriesMap.has(date)) {
      timeSeriesMap.set(date, {
        date,
        spend: 0,
        revenue: 0,
        clicks: 0,
        impressions: 0,
        purchases: 0,
      })
    }

    const entry = timeSeriesMap.get(date)!
    entry.spend += parseFloat(insight.spend || 0)
    entry.clicks += parseInt(insight.clicks || 0)
    entry.impressions += parseInt(insight.impressions || 0)

    if (insight.actions) {
      const purchaseAction = insight.actions.find(
        (action: any) => action.action_type === "purchase" || action.action_type === "omni_purchase"
      )
      if (purchaseAction) {
        entry.purchases += parseInt(purchaseAction.value || 0)
      }
    }

    if (insight.action_values) {
      const purchaseValue = insight.action_values.find(
        (action: any) => action.action_type === "purchase" || action.action_type === "omni_purchase"
      )
      if (purchaseValue) {
        entry.revenue += parseFloat(purchaseValue.value || 0)
      }
    }
  })

  // Convert map to array and calculate derived metrics for each date
  return Array.from(timeSeriesMap.values())
    .map((entry) => ({
      ...entry,
      spend: parseFloat(entry.spend.toFixed(2)),
      revenue: parseFloat(entry.revenue.toFixed(2)),
      roas: entry.spend > 0 ? parseFloat((entry.revenue / entry.spend).toFixed(2)) : 0,
      roi: entry.spend > 0 ? parseFloat((((entry.revenue - entry.spend) / entry.spend) * 100).toFixed(2)) : 0,
      cpc: entry.clicks > 0 ? parseFloat((entry.spend / entry.clicks).toFixed(2)) : 0,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

// Transform data for campaign performance table
function transformCampaignData(insights: any[]) {
  const campaignMap = new Map<string, any>()

  insights.forEach((insight) => {
    const campaignId = insight.campaign_id || "unknown"
    const campaignName = insight.campaign_name || "Unknown Campaign"

    if (!campaignMap.has(campaignId)) {
      campaignMap.set(campaignId, {
        id: campaignId,
        name: campaignName,
        spend: 0,
        clicks: 0,
        impressions: 0,
        purchases: 0,
        revenue: 0,
      })
    }

    const campaign = campaignMap.get(campaignId)!
    campaign.spend += parseFloat(insight.spend || 0)
    campaign.clicks += parseInt(insight.clicks || 0)
    campaign.impressions += parseInt(insight.impressions || 0)

    if (insight.actions) {
      const purchaseAction = insight.actions.find(
        (action: any) => action.action_type === "purchase" || action.action_type === "omni_purchase"
      )
      if (purchaseAction) {
        campaign.purchases += parseInt(purchaseAction.value || 0)
      }
    }

    if (insight.action_values) {
      const purchaseValue = insight.action_values.find(
        (action: any) => action.action_type === "purchase" || action.action_type === "omni_purchase"
      )
      if (purchaseValue) {
        campaign.revenue += parseFloat(purchaseValue.value || 0)
      }
    }
  })

  // Convert map to array and calculate metrics
  return Array.from(campaignMap.values()).map((campaign) => ({
    ...campaign,
    spend: parseFloat(campaign.spend.toFixed(2)),
    revenue: parseFloat(campaign.revenue.toFixed(2)),
    roas: campaign.spend > 0 ? parseFloat((campaign.revenue / campaign.spend).toFixed(2)) : 0,
    roi: campaign.spend > 0 ? parseFloat((((campaign.revenue - campaign.spend) / campaign.spend) * 100).toFixed(2)) : 0,
    cpc: campaign.clicks > 0 ? parseFloat((campaign.spend / campaign.clicks).toFixed(2)) : 0,
    ctr: campaign.impressions > 0 ? parseFloat(((campaign.clicks / campaign.impressions) * 100).toFixed(2)) : 0,
    cac: campaign.purchases > 0 ? parseFloat((campaign.spend / campaign.purchases).toFixed(2)) : 0,
  }))
}
