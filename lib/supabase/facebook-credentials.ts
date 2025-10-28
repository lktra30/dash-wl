/**
 * Facebook Lead Ads Credentials Helper
 * Fetches and decrypts Facebook credentials from the database
 */

import { decrypt } from "@/lib/crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface FacebookCredentials {
  pageId: string
  accessToken: string
}

/**
 * Fetches Facebook credentials by Page ID (used in webhooks)
 * @param supabase - Supabase client instance
 * @param pageId - Facebook Page ID
 * @returns Whitelabel ID and credentials, or null if not configured
 */
export async function getFacebookCredentialsByPageId(
  supabase: SupabaseClient,
  pageId: string
): Promise<{ whitelabelId: string; credentials: FacebookCredentials } | null> {
  const { data, error } = await supabase
    .from("whitelabels")
    .select("id, facebook_page_id, facebook_access_token_encrypted")
    .eq("facebook_page_id", pageId)
    .single()

  if (error || !data?.facebook_access_token_encrypted) {
    return null
  }

  try {
    return {
      whitelabelId: data.id,
      credentials: {
        pageId: data.facebook_page_id,
        accessToken: decrypt(data.facebook_access_token_encrypted),
      }
    }
  } catch {
    return null
  }
}

/**
 * Fetches Facebook credentials for the authenticated user's whitelabel
 * @param supabase - Supabase client instance (must be authenticated)
 * @returns Facebook credentials or null if not configured
 * @throws Error if user is not authenticated or credentials cannot be fetched
 */
export async function getFacebookCredentials(
  supabase: SupabaseClient
): Promise<FacebookCredentials | null> {
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

  // Get whitelabel with Facebook credentials
  const { data: whitelabel, error: whitelabelError } = await supabase
    .from("whitelabels")
    .select("facebook_page_id, facebook_access_token_encrypted")
    .eq("id", userProfile.whitelabel_id)
    .single()

  if (whitelabelError) {
    throw new Error("Failed to fetch whitelabel data")
  }

  // Check if credentials are configured
  if (!whitelabel.facebook_access_token_encrypted || !whitelabel.facebook_page_id) {
    return null
  }

  try {
    // Decrypt the access token
    const accessToken = decrypt(whitelabel.facebook_access_token_encrypted)

    return {
      pageId: whitelabel.facebook_page_id,
      accessToken,
    }
  } catch (error) {
    throw new Error("Failed to decrypt Facebook access token")
  }
}

/**
 * Checks if Facebook Lead Ads is configured for the authenticated user's whitelabel
 * @param supabase - Supabase client instance (must be authenticated)
 * @returns true if Facebook Lead Ads is configured, false otherwise
 */
export async function isFacebookConfigured(supabase: SupabaseClient): Promise<boolean> {
  try {
    const credentials = await getFacebookCredentials(supabase)
    return credentials !== null
  } catch {
    return false
  }
}
