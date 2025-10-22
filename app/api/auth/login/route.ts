import { NextRequest, NextResponse } from "next/server"
import { applySupabaseCookies, createSupabaseRouteHandlerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const { email, password } = await request.json().catch(() => ({ email: "", password: "" }))

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }

  const intermediateResponse = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, intermediateResponse)

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const errorResponse = NextResponse.json({ error: error.message }, { status: 401 })
    applySupabaseCookies(intermediateResponse, errorResponse)
    return errorResponse
  }

  const successResponse = NextResponse.json({ success: true })
  applySupabaseCookies(intermediateResponse, successResponse)
  return successResponse
}
