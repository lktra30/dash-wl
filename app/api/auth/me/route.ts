import { NextRequest, NextResponse } from "next/server"
import { applySupabaseCookies, createSupabaseRouteHandlerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const intermediateResponse = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, intermediateResponse)

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    const unauthorizedResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    applySupabaseCookies(intermediateResponse, unauthorizedResponse)
    return unauthorizedResponse
  }

  const { data: userProfile, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("email", authUser.email)
    .single()

  if (userError || !userProfile) {
    const notFoundResponse = NextResponse.json({ error: "User profile not found" }, { status: 404 })
    applySupabaseCookies(intermediateResponse, notFoundResponse)
    return notFoundResponse
  }

  const { data: whitelabel, error: whitelabelError } = await supabase
    .from("whitelabels")
    .select("*")
    .eq("id", userProfile.whitelabel_id)
    .single()

  if (whitelabelError) {
    const errorResponse = NextResponse.json({ error: "Failed to load whitelabel" }, { status: 500 })
    applySupabaseCookies(intermediateResponse, errorResponse)
    return errorResponse
  }

  // Filter sensitive whitelabel data - only send safe fields to frontend
  const safeWhitelabelData = {
    name: whitelabel.name,
    domain: whitelabel.domain,
    brandColor: whitelabel.brand_color,
    logoUrl: whitelabel.logo_url,
    businessModel: whitelabel.business_model || 'MRR',
    // API key status (boolean only, never the actual keys)
    metaAdsConfigured: !!whitelabel.meta_ads_key_encrypted,
    googleAdsConfigured: !!whitelabel.google_ads_key_encrypted,
    metaAdsAccountId: whitelabel.meta_ads_account_id,
    teamCompetition: whitelabel.team_competition || false,
    // Explicitly exclude: id, created_at, updated_at, encrypted keys
  }

  const successResponse = NextResponse.json({ 
    user: userProfile, 
    whitelabel: safeWhitelabelData 
  })
  applySupabaseCookies(intermediateResponse, successResponse)
  return successResponse
}
