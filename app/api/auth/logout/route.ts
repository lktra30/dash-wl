import { NextRequest, NextResponse } from "next/server"
import { applySupabaseCookies, createSupabaseRouteHandlerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const intermediateResponse = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, intermediateResponse)

  const { error } = await supabase.auth.signOut()

  if (error) {
    const errorResponse = NextResponse.json({ error: error.message }, { status: 400 })
    applySupabaseCookies(intermediateResponse, errorResponse)
    return errorResponse
  }

  const successResponse = NextResponse.json({ success: true })
  applySupabaseCookies(intermediateResponse, successResponse)
  return successResponse
}
