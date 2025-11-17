import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

/**
 * Refresh Analytics API - Manually triggers materialized view refresh
 * Use this after bulk data imports or when real-time accuracy is needed
 * 
 * POST /api/dashboard/analytics/refresh
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's information to check permissions
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("whitelabel_id, id, role")
      .eq("email", authUser.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Optional: Only allow admins to refresh (uncomment if needed)
    // if (user.role !== 'admin' && user.role !== 'SuperAdmin') {
    //   return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 })
    // }

    // Call the refresh function in the database
    const { error: refreshError } = await supabase.rpc('refresh_dashboard_analytics')

    if (refreshError) {
      console.error("Error refreshing analytics:", refreshError)
      return NextResponse.json({ 
        error: "Failed to refresh analytics",
        details: refreshError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: "Analytics refreshed successfully",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error in refresh endpoint:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * GET endpoint to check last refresh time
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
      .select("whitelabel_id")
      .eq("email", authUser.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get last update time from materialized view
    const { data: analytics, error: analyticsError } = await supabase
      .from("dashboard_analytics_mv")
      .select("last_updated")
      .eq("whitelabel_id", user.whitelabel_id)
      .single()

    if (analyticsError) {
      return NextResponse.json({ 
        lastUpdated: null,
        error: "Analytics view not found" 
      })
    }

    return NextResponse.json({ 
      lastUpdated: analytics?.last_updated,
      whitelabelId: user.whitelabel_id
    })
  } catch (error) {
    console.error("Error getting refresh status:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
