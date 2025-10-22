import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { decrypt } from "@/lib/crypto"

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get user's whitelabel to retrieve Google Ads credentials
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("whitelabel_id")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Get whitelabel with encrypted Google Ads key
    const { data: whitelabelData, error: whitelabelError } = await supabase
      .from("whitelabels")
      .select("google_ads_key_encrypted")
      .eq("id", userData.whitelabel_id)
      .single()

    if (whitelabelError || !whitelabelData) {
      return NextResponse.json({ error: "Configuração não encontrada" }, { status: 404 })
    }

    // Check if Google Ads is configured
    if (!whitelabelData.google_ads_key_encrypted) {
      return NextResponse.json(
        {
          error: "Google Ads não configurado",
          message: "As credenciais do Google Ads não foram configuradas. Por favor, configure-as nas configurações do sistema.",
          configured: false,
        },
        { status: 400 }
      )
    }

    // Decrypt the Google Ads credentials
    let googleAdsCredentials
    try {
      const decrypted = decrypt(whitelabelData.google_ads_key_encrypted)
      googleAdsCredentials = JSON.parse(decrypted)
    } catch (decryptError) {
      console.error("Error decrypting Google Ads credentials:", decryptError)
      return NextResponse.json(
        {
          error: "Erro ao descriptografar credenciais",
          message: "Não foi possível acessar as credenciais do Google Ads. Entre em contato com o suporte.",
        },
        { status: 500 }
      )
    }

    // Validate required fields
    const { customerId, developerToken, refreshToken, clientId, clientSecret } = googleAdsCredentials
    if (!customerId || !developerToken || !refreshToken || !clientId || !clientSecret) {
      return NextResponse.json(
        {
          error: "Credenciais incompletas",
          message: "As credenciais do Google Ads estão incompletas. Por favor, reconfigure-as nas configurações.",
        },
        { status: 400 }
      )
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url)
    const datePreset = searchParams.get("date_preset") || "last_30d"

    // Calculate date range based on preset
    const dateRange = calculateDateRange(datePreset)

    // Get access token using refresh token
    let accessToken
    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      })

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text()
        console.error("Google OAuth Error:", errorData)
        return NextResponse.json(
          {
            error: "Falha na autenticação",
            message: "Não foi possível autenticar com o Google Ads. Verifique suas credenciais.",
          },
          { status: 401 }
        )
      }

      const tokenData = await tokenResponse.json()
      accessToken = tokenData.access_token
    } catch (tokenError) {
      console.error("Error getting access token:", tokenError)
      return NextResponse.json(
        {
          error: "Erro de autenticação",
          message: "Falha ao obter token de acesso do Google Ads.",
        },
        { status: 500 }
      )
    }

    // Build Google Ads API query
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        segments.date,
        metrics.cost_micros,
        metrics.clicks,
        metrics.impressions,
        metrics.conversions,
        metrics.conversions_value,
        metrics.average_cpc
      FROM campaign
      WHERE segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'
      ORDER BY segments.date
    `

    // Call Google Ads API
    try {
      const adsApiUrl = `https://googleads.googleapis.com/v15/customers/${customerId}/googleAds:searchStream`
      
      const response = await fetch(adsApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "developer-token": developerToken,
          "login-customer-id": customerId,
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Google Ads API Error:", errorData)
        
        // Parse error for better user feedback
        let errorMessage = "Falha ao buscar dados do Google Ads"
        try {
          const parsedError = JSON.parse(errorData)
          if (parsedError.error?.message) {
            errorMessage = parsedError.error.message
          }
        } catch (e) {
          // Keep default message
        }

        return NextResponse.json(
          {
            error: "Erro na API do Google Ads",
            message: errorMessage,
            details: errorData,
          },
          { status: response.status }
        )
      }

      const googleAdsData = await response.json()
      const results = googleAdsData[0]?.results || []

      // Transform the data
      const insights = results.map((result: any) => ({
        campaign_id: result.campaign?.id?.toString() || "unknown",
        campaign_name: result.campaign?.name || "Unknown Campaign",
        date: result.segments?.date || "",
        spend: (result.metrics?.costMicros || 0) / 1000000, // Convert micros to currency
        clicks: result.metrics?.clicks || 0,
        impressions: result.metrics?.impressions || 0,
        conversions: result.metrics?.conversions || 0,
        revenue: result.metrics?.conversionsValue || 0,
        avg_cpc: (result.metrics?.averageCpc || 0) / 1000000,
      }))

      // Calculate aggregated metrics
      const metrics = calculateMetrics(insights)

      // Transform data for time series
      const timeSeries = transformTimeSeriesData(insights)

      // Get campaign performance details
      const campaigns = transformCampaignData(insights)

      return NextResponse.json({
        success: true,
        metrics,
        timeSeries,
        campaigns,
        rawDataCount: insights.length,
      })
    } catch (apiError) {
      console.error("Error calling Google Ads API:", apiError)
      return NextResponse.json(
        {
          error: "Erro ao chamar API",
          message: "Ocorreu um erro ao buscar dados do Google Ads. Tente novamente mais tarde.",
          details: apiError instanceof Error ? apiError.message : "Unknown error",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error fetching Google Ads data:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: "Ocorreu um erro inesperado. Por favor, tente novamente.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Calculate date range based on preset
function calculateDateRange(preset: string): { startDate: string; endDate: string } {
  const today = new Date()
  const endDate = today.toISOString().split("T")[0]
  let startDate: string

  switch (preset) {
    case "today":
      startDate = endDate
      break
    case "yesterday":
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      startDate = yesterday.toISOString().split("T")[0]
      break
    case "last_7d":
      const week = new Date(today)
      week.setDate(week.getDate() - 7)
      startDate = week.toISOString().split("T")[0]
      break
    case "last_14d":
      const twoWeeks = new Date(today)
      twoWeeks.setDate(twoWeeks.getDate() - 14)
      startDate = twoWeeks.toISOString().split("T")[0]
      break
    case "last_30d":
      const month = new Date(today)
      month.setDate(month.getDate() - 30)
      startDate = month.toISOString().split("T")[0]
      break
    case "last_90d":
      const quarter = new Date(today)
      quarter.setDate(quarter.getDate() - 90)
      startDate = quarter.toISOString().split("T")[0]
      break
    case "this_month":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
      break
    case "last_month":
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
      startDate = lastMonth.toISOString().split("T")[0]
      break
    default:
      const defaultMonth = new Date(today)
      defaultMonth.setDate(defaultMonth.getDate() - 30)
      startDate = defaultMonth.toISOString().split("T")[0]
  }

  return { startDate, endDate }
}

// Calculate aggregated metrics from insights data
function calculateMetrics(insights: any[]) {
  let totalSpend = 0
  let totalClicks = 0
  let totalImpressions = 0
  let totalConversions = 0
  let totalRevenue = 0

  insights.forEach((insight) => {
    totalSpend += parseFloat(insight.spend || 0)
    totalClicks += parseInt(insight.clicks || 0)
    totalImpressions += parseInt(insight.impressions || 0)
    totalConversions += parseFloat(insight.conversions || 0)
    totalRevenue += parseFloat(insight.revenue || 0)
  })

  // Calculate metrics
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0
  const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0

  return {
    totalSpend: parseFloat(totalSpend.toFixed(2)),
    totalClicks,
    totalImpressions,
    totalConversions: parseFloat(totalConversions.toFixed(2)),
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    roas: parseFloat(roas.toFixed(2)),
    roi: parseFloat(roi.toFixed(2)),
    cpa: parseFloat(cpa.toFixed(2)),
    cpc: parseFloat(cpc.toFixed(2)),
    ctr: parseFloat(ctr.toFixed(2)),
    conversionRate: parseFloat(conversionRate.toFixed(2)),
    avgCpc: parseFloat(avgCpc.toFixed(2)),
  }
}

// Transform data for time series charts
function transformTimeSeriesData(insights: any[]) {
  const timeSeriesMap = new Map<string, any>()

  insights.forEach((insight) => {
    const date = insight.date || new Date().toISOString().split("T")[0]

    if (!timeSeriesMap.has(date)) {
      timeSeriesMap.set(date, {
        date,
        spend: 0,
        revenue: 0,
        clicks: 0,
        impressions: 0,
        conversions: 0,
      })
    }

    const entry = timeSeriesMap.get(date)!
    entry.spend += parseFloat(insight.spend || 0)
    entry.clicks += parseInt(insight.clicks || 0)
    entry.impressions += parseInt(insight.impressions || 0)
    entry.conversions += parseFloat(insight.conversions || 0)
    entry.revenue += parseFloat(insight.revenue || 0)
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
      conversionRate: entry.clicks > 0 ? parseFloat(((entry.conversions / entry.clicks) * 100).toFixed(2)) : 0,
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
        conversions: 0,
        revenue: 0,
      })
    }

    const campaign = campaignMap.get(campaignId)!
    campaign.spend += parseFloat(insight.spend || 0)
    campaign.clicks += parseInt(insight.clicks || 0)
    campaign.impressions += parseInt(insight.impressions || 0)
    campaign.conversions += parseFloat(insight.conversions || 0)
    campaign.revenue += parseFloat(insight.revenue || 0)
  })

  // Convert map to array and calculate metrics
  return Array.from(campaignMap.values()).map((campaign) => ({
    ...campaign,
    spend: parseFloat(campaign.spend.toFixed(2)),
    revenue: parseFloat(campaign.revenue.toFixed(2)),
    roas: campaign.spend > 0 ? parseFloat((campaign.revenue / campaign.spend).toFixed(2)) : 0,
    roi:
      campaign.spend > 0
        ? parseFloat((((campaign.revenue - campaign.spend) / campaign.spend) * 100).toFixed(2))
        : 0,
    cpc: campaign.clicks > 0 ? parseFloat((campaign.spend / campaign.clicks).toFixed(2)) : 0,
    ctr: campaign.impressions > 0 ? parseFloat(((campaign.clicks / campaign.impressions) * 100).toFixed(2)) : 0,
    cpa: campaign.conversions > 0 ? parseFloat((campaign.spend / campaign.conversions).toFixed(2)) : 0,
    conversionRate:
      campaign.clicks > 0 ? parseFloat(((campaign.conversions / campaign.clicks) * 100).toFixed(2)) : 0,
  }))
}
