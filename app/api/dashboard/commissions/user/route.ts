import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { authenticateUser, createErrorResponse } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser(request)
    
    if (error || !user) {
      return createErrorResponse(error || "Unauthorized", 401)
    }

    const supabase = await getSupabaseServerClient()
    const whitelabelId = user.whitelabel_id

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    // Build query - users can see their own, admins/managers can see all
    let query = supabase
      .from("user_commissions")
      .select("*")
      .eq("whitelabel_id", whitelabelId)

    // Apply filters if provided
    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (month) {
      query = query.eq('period_month', parseInt(month))
    }

    if (year) {
      query = query.eq('period_year', parseInt(year))
    }

    const { data: commissions, error: fetchError } = await query
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })

    if (fetchError) {
      return createErrorResponse(fetchError.message, 500)
    }

    // Convert to camelCase
    const formattedCommissions = (commissions || []).map(c => ({
      id: c.id,
      whitelabelId: c.whitelabel_id,
      userId: c.user_id,
      periodMonth: c.period_month,
      periodYear: c.period_year,
      userRole: c.user_role,
      meetingsHeld: c.meetings_held,
      meetingsConverted: c.meetings_converted,
      totalSales: c.total_sales ? Number(c.total_sales) : undefined,
      salesCount: c.sales_count,
      baseCommission: Number(c.base_commission),
      checkpointTier: c.checkpoint_tier,
      checkpointMultiplier: Number(c.checkpoint_multiplier),
      finalCommission: Number(c.final_commission),
      targetAchievementPercent: Number(c.target_achievement_percent),
      createdAt: c.created_at,
      updatedAt: c.updated_at
    }))

    return NextResponse.json(formattedCommissions)
  } catch (err) {
    console.error("Error fetching user commissions:", err)
    return createErrorResponse("Internal server error", 500)
  }
}
