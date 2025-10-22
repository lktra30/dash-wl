/**
 * Meta Ads Credentials Helper
 * Fetches and decrypts Meta Ads API credentials from the database
 */

import { decrypt } from "@/lib/crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface MetaAdsCredentials {
  accessToken: string
  accountId: string
}

/**
 * Fetches Meta Ads credentials from the database for the authenticated user's whitelabel
 * @param supabase - Supabase client instance (must be authenticated)
 * @returns Meta Ads credentials or null if not configured
 * @throws Error if user is not authenticated or credentials cannot be fetched
 */
export async function getMetaAdsCredentials(
  supabase: SupabaseClient
): Promise<MetaAdsCredentials | null> {
  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  // Get user profile to get whitelabel_id
  const { data: userProfile, error: userError } = await supabase
    .from("users")
    .select("whitelabel_id")
    .eq("email", user.email)
    .single()

  if (userError || !userProfile) {
    throw new Error("User profile not found")
  }

  // Get whitelabel with Meta Ads credentials
  const { data: whitelabel, error: whitelabelError } = await supabase
    .from("whitelabels")
    .select("meta_ads_key_encrypted, meta_ads_account_id")
    .eq("id", userProfile.whitelabel_id)
    .single()

  if (whitelabelError) {
    throw new Error("Failed to fetch whitelabel data")
  }

  // Check if credentials are configured
  if (!whitelabel.meta_ads_key_encrypted || !whitelabel.meta_ads_account_id) {
    return null
  }

  try {
    // Decrypt the access token
    const accessToken = decrypt(whitelabel.meta_ads_key_encrypted)
    
    return {
      accessToken,
      accountId: whitelabel.meta_ads_account_id,
    }
  } catch (error) {
    throw new Error("Failed to decrypt Meta Ads access token")
  }
}

/**
 * Checks if Meta Ads is configured for the authenticated user's whitelabel
 * @param supabase - Supabase client instance (must be authenticated)
 * @returns true if Meta Ads is configured, false otherwise
 */
export async function isMetaAdsConfigured(supabase: SupabaseClient): Promise<boolean> {
  try {
    const credentials = await getMetaAdsCredentials(supabase)
    return credentials !== null
  } catch {
    return false
  }
}
