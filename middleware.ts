import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import { applySupabaseCookies, resolveSupabaseConfig } from "@/lib/supabase/server"

export async function middleware(request: NextRequest) {
  let supabaseConfig: { supabaseUrl: string; supabaseAnonKey: string } | null = null

  try {
    supabaseConfig = resolveSupabaseConfig()
  } catch (error) {
    console.warn("[v0] Supabase environment variables not configured. Authentication is disabled.", error)
    return NextResponse.next()
  }

  const { supabaseUrl, supabaseAnonKey } = supabaseConfig

  const sessionResponse = NextResponse.next()

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value
      },
      set(name, value, options) {
        sessionResponse.cookies.set({ name, value, ...options })
      },
      remove(name, options) {
        sessionResponse.cookies.set({ name, value: "", ...options, expires: new Date(0) })
      },
    },
  })

  // Use getSession() instead of getUser() - it's faster as it only validates the JWT locally
  // instead of making a network request to Supabase
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Require authentication for dashboard and admin routes
  if ((request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/admin")) && !session) {
    const redirectResponse = NextResponse.redirect(new URL("/", request.url))
    applySupabaseCookies(sessionResponse, redirectResponse)
    return redirectResponse
  }

  if (request.nextUrl.pathname === "/" && session) {
    const redirectResponse = NextResponse.redirect(new URL("/dashboard", request.url))
    applySupabaseCookies(sessionResponse, redirectResponse)
    return redirectResponse
  }

  return sessionResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
