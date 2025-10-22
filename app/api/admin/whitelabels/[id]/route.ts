import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

async function checkSuperAdmin(supabase: any, authUserId: string) {
  const { data: user, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUserId)
    .single()

  if (error || !user || user.role !== "SuperAdmin") {
    return false
  }

  return true
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Check if user is SuperAdmin
    const isSuperAdmin = await checkSuperAdmin(supabase, authUser.id)
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden - SuperAdmin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, domain, brand_color, business_model, meta_ads_account_id, team_competition } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Update whitelabel
    const { data: whitelabel, error: updateError } = await supabase
      .from("whitelabels")
      .update({
        name,
        domain: domain || null,
        brand_color: brand_color || "#3b82f6",
        business_model: business_model || "MRR",
        meta_ads_account_id: meta_ads_account_id || null,
        team_competition: team_competition || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating whitelabel:", updateError)
      return NextResponse.json(
        { error: "Error updating whitelabel" },
        { status: 500 }
      )
    }

    return NextResponse.json({ whitelabel })
  } catch (error) {
    console.error("Error in PUT /api/admin/whitelabels/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Check if user is SuperAdmin
    const isSuperAdmin = await checkSuperAdmin(supabase, authUser.id)
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden - SuperAdmin access required" },
        { status: 403 }
      )
    }

    // Delete whitelabel
    const { error: deleteError } = await supabase
      .from("whitelabels")
      .delete()
      .eq("id", params.id)

    if (deleteError) {
      console.error("Error deleting whitelabel:", deleteError)
      return NextResponse.json(
        { error: "Error deleting whitelabel" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/admin/whitelabels/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
