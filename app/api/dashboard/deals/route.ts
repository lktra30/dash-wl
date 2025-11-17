import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

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
      .select("*, whitelabel_id")
      .eq("email", authUser.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get deals for this whitelabel
    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select("*")
      .eq("whitelabel_id", user.whitelabel_id)
      .order("created_at", { ascending: false })

    if (dealsError) {
      console.error("Error fetching deals:", dealsError)
      return NextResponse.json({ error: "Failed to fetch deals" }, { status: 500 })
    }

    // Mapear campos do banco (snake_case) para o frontend (camelCase)
    const mappedDeals = (deals || []).map(deal => ({
      id: deal.id,
      title: deal.title,
      value: parseFloat(deal.value),
      status: deal.status,
      duration: deal.duration,
      contactId: deal.contact_id,
      whitelabelId: deal.whitelabel_id,
      assignedTo: deal.assigned_to,
      sdrId: deal.sdr_id,
      closerId: deal.closer_id,
      expectedCloseDate: deal.expected_close_date,
      saleDate: deal.sale_date,
      createdAt: deal.created_at,
      updatedAt: deal.updated_at
    }))

    console.log('[API Deals] Retornando deals:', {
      total: mappedDeals.length,
      wonDeals: mappedDeals.filter(d => d.status === 'won').length,
      withSDR: mappedDeals.filter(d => d.sdrId).length,
      withCloser: mappedDeals.filter(d => d.closerId).length
    })

    return NextResponse.json(mappedDeals)
  } catch (error) {
    console.error("Error fetching deals:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}