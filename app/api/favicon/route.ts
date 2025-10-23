import { NextRequest, NextResponse } from "next/server"
import { createSupabaseRouteHandlerClient, applySupabaseCookies } from "@/lib/supabase/server"

/**
 * GET /api/favicon
 * Returns dynamic favicon based on domain's whitelabel logo
 * Falls back to default favicon if no logo is configured
 */
export async function GET(request: NextRequest) {
  const intermediateResponse = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, intermediateResponse)

  try {
    // Get the host from headers
    const host = request.headers.get("host") || ""

    // Extract the main domain (remove port if present)
    const domain = host.split(":")[0]

    // Query whitelabel by domain
    const { data: whitelabel, error } = await supabase
      .from("whitelabels")
      .select("logo_url")
      .eq("domain", domain)
      .single()

    if (error || !whitelabel || !whitelabel.logo_url) {
      // No logo found, redirect to default favicon
      return NextResponse.redirect(new URL("/favicon.ico", request.url))
    }

    // Redirect to the logo URL (stored in Supabase Storage)
    return NextResponse.redirect(whitelabel.logo_url)
  } catch (error) {
    console.error("[Favicon API Error]", error)
    // Fallback to default favicon on error
    return NextResponse.redirect(new URL("/favicon.ico", request.url))
  }
}
