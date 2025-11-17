import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

/**
 * Pipeline Metrics API - Uses pipeline_stage_metrics view
 * Returns aggregated metrics per pipeline stage (count, avg value, time, conversion)
 */
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
      .select("whitelabel_id, id")
      .eq("email", authUser.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const whitelabelId = user.whitelabel_id

    // Get pipeline metrics from view (OPTIMIZED - pre-aggregated)
    const { data: metrics, error: metricsError } = await supabase
      .from("pipeline_stage_metrics")
      .select("*")
      .eq("whitelabel_id", whitelabelId)
      .order("order_position", { ascending: true })

    if (metricsError) {
      console.error("Error fetching pipeline metrics:", metricsError)
      return NextResponse.json({ error: "Failed to fetch pipeline metrics" }, { status: 500 })
    }

    // Transform to camelCase for frontend
    const response = metrics?.map((metric: any) => ({
      stageId: metric.stage_id,
      pipelineId: metric.pipeline_id,
      whitelabelId: metric.whitelabel_id,
      stageName: metric.stage_name,
      orderPosition: metric.order_position,
      color: metric.color,
      countsAsMeeting: metric.counts_as_meeting,
      countsAsSale: metric.counts_as_sale,
      
      // Metrics
      contactsCount: metric.contacts_count || 0,
      avgDealValue: Number(metric.avg_deal_value) || 0,
      totalDealValue: Number(metric.total_deal_value) || 0,
      avgDaysInStage: Number(metric.avg_days_in_stage) || 0,
      conversionRatePercent: Number(metric.conversion_rate_percent) || 0,
    })) || []

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching pipeline metrics:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
