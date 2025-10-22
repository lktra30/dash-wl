import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server"

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

export async function GET(request: NextRequest) {
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

    // Fetch all whitelabels
    const { data: whitelabels, error: whitelabelsError } = await supabase
      .from("whitelabels")
      .select("*")
      .order("created_at", { ascending: false })

    if (whitelabelsError) {
      console.error("Error fetching whitelabels:", whitelabelsError)
      return NextResponse.json(
        { error: "Error fetching whitelabels" },
        { status: 500 }
      )
    }

    return NextResponse.json({ whitelabels })
  } catch (error) {
    console.error("Error in GET /api/admin/whitelabels:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const { 
      name, 
      domain, 
      brand_color, 
      business_model, 
      meta_ads_account_id, 
      team_competition,
      admin_email,
      admin_name 
    } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    if (!admin_email || !admin_name) {
      return NextResponse.json(
        { error: "Administrator email and name are required" },
        { status: 400 }
      )
    }

    // Create new whitelabel
    const { data: whitelabel, error: createError } = await supabase
      .from("whitelabels")
      .insert({
        name,
        domain: domain || null,
        brand_color: brand_color || "#3b82f6",
        business_model: business_model || "MRR",
        meta_ads_account_id: meta_ads_account_id || null,
        team_competition: team_competition || false,
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating whitelabel:", createError)
      return NextResponse.json(
        { error: "Error creating whitelabel" },
        { status: 500 }
      )
    }

    // Create admin user in Supabase Auth
    try {
      // Use admin client for creating users
      const supabaseAdmin = getSupabaseAdminClient()
      
      const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.admin.createUser({
        email: admin_email,
        password: admin_email, // Senha inicial é o email
        email_confirm: true, // Auto-confirma o email
        user_metadata: {
          name: admin_name,
          whitelabel_id: whitelabel.id,
          role: 'admin'
        }
      })

      if (authUserError) {
        console.error("Error creating auth user:", authUserError)
        // Rollback: delete the whitelabel
        await supabase.from("whitelabels").delete().eq("id", whitelabel.id)
        return NextResponse.json(
          { error: `Error creating admin user: ${authUserError.message}` },
          { status: 500 }
        )
      }

      // Note: The user record in public.users is automatically created by the
      // on_auth_user_created trigger (see scripts/31-sync-users-auth-fixed.sql)
      // No need to insert manually here

      return NextResponse.json({
        whitelabel,
        admin: {
          id: authUserData.user.id,
          email: admin_email,
          name: admin_name
        }
      }, { status: 201 })

    } catch (error) {
      console.error("Error in user creation process:", error)
      // Rollback: delete the whitelabel
      await supabase.from("whitelabels").delete().eq("id", whitelabel.id)
      return NextResponse.json(
        { error: "Error creating admin user" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error in POST /api/admin/whitelabels:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
