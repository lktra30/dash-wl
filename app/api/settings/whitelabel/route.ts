import { NextRequest, NextResponse } from "next/server"
import { applySupabaseCookies, createSupabaseRouteHandlerClient } from "@/lib/supabase/server"
import { encrypt, isEncryptionConfigured } from "@/lib/crypto"
import { getUserRoleWithFallback, hasSettingsAccess } from "@/lib/permissions"

/**
 * PUT /api/settings/whitelabel
 * Updates whitelabel settings including business model and encrypted API keys
 * Requires authentication - only admin and SuperAdmin can update settings
 */
export async function PUT(request: NextRequest) {
  const intermediateResponse = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, intermediateResponse)

  // Authenticate user
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    const unauthorizedResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    applySupabaseCookies(intermediateResponse, unauthorizedResponse)
    return unauthorizedResponse
  }

  // Get user profile to access whitelabel_id
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

  // Get user role with fallback (employee table or users table)
  const userRole = await getUserRoleWithFallback(authUser.email!, userProfile)

  // Verify permission to edit whitelabel settings (admin or SuperAdmin only)
  if (!hasSettingsAccess(userRole)) {
    const forbiddenResponse = NextResponse.json(
      { error: "Acesso negado. Apenas administradores podem alterar configurações do sistema." }, 
      { status: 403 }
    )
    applySupabaseCookies(intermediateResponse, forbiddenResponse)
    return forbiddenResponse
  }

  // Parse request body
  let body: {
    name?: string
    domain?: string
    brandColor?: string
    businessModel?: "TCV" | "MRR"
    metaAdsKey?: string
    googleAdsKey?: string
    metaAdsAccountId?: string
    facebookAccessToken?: string
    facebookPageId?: string
  }

  try {
    body = await request.json()
  } catch {
    const badRequestResponse = NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    applySupabaseCookies(intermediateResponse, badRequestResponse)
    return badRequestResponse
  }

  // Validate business model if provided
  if (body.businessModel && !["TCV", "MRR"].includes(body.businessModel)) {
    const badRequestResponse = NextResponse.json(
      { error: "Business model must be either 'TCV' or 'MRR'" },
      { status: 400 }
    )
    applySupabaseCookies(intermediateResponse, badRequestResponse)
    return badRequestResponse
  }

  // Prepare update object
  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  // Add simple fields
  if (body.name !== undefined) updateData.name = body.name
  if (body.domain !== undefined) updateData.domain = body.domain || null
  if (body.brandColor !== undefined) updateData.brand_color = body.brandColor
  if (body.businessModel !== undefined) updateData.business_model = body.businessModel
  if (body.metaAdsAccountId !== undefined) updateData.meta_ads_account_id = body.metaAdsAccountId || null
  if (body.facebookPageId !== undefined) updateData.facebook_page_id = body.facebookPageId || null

  // Encrypt API keys if provided
  if (body.metaAdsKey !== undefined) {
    if (!isEncryptionConfigured()) {
      const errorResponse = NextResponse.json(
        { error: "Encryption not configured. Please set ENCRYPTION_KEY environment variable." },
        { status: 500 }
      )
      applySupabaseCookies(intermediateResponse, errorResponse)
      return errorResponse
    }

    try {
      // Only encrypt if not empty, otherwise set to null to remove key
      updateData.meta_ads_key_encrypted = body.metaAdsKey ? encrypt(body.metaAdsKey) : null
    } catch (error) {
      const errorResponse = NextResponse.json(
        { error: "Failed to encrypt Meta Ads key" },
        { status: 500 }
      )
      applySupabaseCookies(intermediateResponse, errorResponse)
      return errorResponse
    }
  }

  if (body.googleAdsKey !== undefined) {
    if (!isEncryptionConfigured()) {
      const errorResponse = NextResponse.json(
        { error: "Encryption not configured. Please set ENCRYPTION_KEY environment variable." },
        { status: 500 }
      )
      applySupabaseCookies(intermediateResponse, errorResponse)
      return errorResponse
    }

    try {
      // Only encrypt if not empty, otherwise set to null to remove key
      updateData.google_ads_key_encrypted = body.googleAdsKey ? encrypt(body.googleAdsKey) : null
    } catch (error) {
      console.error("[Google Ads Key Encryption Error]", error)
      const errorResponse = NextResponse.json(
        { error: "Failed to encrypt Google Ads key" },
        { status: 500 }
      )
      applySupabaseCookies(intermediateResponse, errorResponse)
      return errorResponse
    }
  }

  if (body.facebookAccessToken !== undefined) {
    if (!isEncryptionConfigured()) {
      const errorResponse = NextResponse.json(
        { error: "Encryption not configured. Please set ENCRYPTION_KEY environment variable." },
        { status: 500 }
      )
      applySupabaseCookies(intermediateResponse, errorResponse)
      return errorResponse
    }

    try {
      // Only encrypt if not empty, otherwise set to null to remove key
      updateData.facebook_access_token_encrypted = body.facebookAccessToken ? encrypt(body.facebookAccessToken) : null
    } catch (error) {
      console.error("[Facebook Access Token Encryption Error]", error)
      const errorResponse = NextResponse.json(
        { error: "Failed to encrypt Facebook access token" },
        { status: 500 }
      )
      applySupabaseCookies(intermediateResponse, errorResponse)
      return errorResponse
    }
  }

  // Update whitelabel in database
  const { data: updatedWhitelabel, error: updateError } = await supabase
    .from("whitelabels")
    .update(updateData)
    .eq("id", userProfile.whitelabel_id)
    .select()
    .single()

  if (updateError) {
    console.error("[Whitelabel Update Error]", updateError)
    const errorResponse = NextResponse.json(
      { error: "Failed to update whitelabel settings" },
      { status: 500 }
    )
    applySupabaseCookies(intermediateResponse, errorResponse)
    return errorResponse
  }

  // Return success with safe data (no encrypted keys)
  const successResponse = NextResponse.json({
    success: true,
    whitelabel: {
      name: updatedWhitelabel.name,
      domain: updatedWhitelabel.domain,
      brandColor: updatedWhitelabel.brand_color,
      businessModel: updatedWhitelabel.business_model,
      metaAdsConfigured: !!updatedWhitelabel.meta_ads_key_encrypted,
      googleAdsConfigured: !!updatedWhitelabel.google_ads_key_encrypted,
      facebookConfigured: !!updatedWhitelabel.facebook_access_token_encrypted,
      metaAdsAccountId: updatedWhitelabel.meta_ads_account_id,
      facebookPageId: updatedWhitelabel.facebook_page_id,
    },
  })
  applySupabaseCookies(intermediateResponse, successResponse)
  return successResponse
}
