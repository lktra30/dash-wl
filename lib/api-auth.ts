import { NextRequest } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: string
  whitelabel_id: string
}

export async function authenticateUser(request: NextRequest): Promise<{ user: AuthenticatedUser | null; error: string | null }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get the authenticated user from Supabase
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return { user: null, error: "Unauthorized - No valid session" }
    }

    // Get the user's profile and whitelabel information
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", authUser.email)
      .single()

    if (userError || !user) {
      return { user: null, error: "User profile not found" }
    }

    return { 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        whitelabel_id: user.whitelabel_id,
      }, 
      error: null 
    }
  } catch (error) {
    return { user: null, error: "Authentication failed" }
  }
}

export function createErrorResponse(message: string, status: number = 500) {
  return Response.json({ error: message }, { status })
}

export function createSuccessResponse(data: any) {
  return Response.json(data)
}