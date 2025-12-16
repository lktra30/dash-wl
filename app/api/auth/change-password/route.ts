import { NextRequest, NextResponse } from "next/server"
import { applySupabaseCookies, createSupabaseRouteHandlerClient, getSupabaseAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const intermediateResponse = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, intermediateResponse)

  try {
    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { currentPassword, newPassword } = body

    // Validate required fields
    if (!currentPassword || !newPassword) {
      const errorResponse = NextResponse.json(
        { error: "Senha atual e nova senha são obrigatórias" },
        { status: 400 }
      )
      applySupabaseCookies(intermediateResponse, errorResponse)
      return errorResponse
    }

    // Validate new password length
    if (newPassword.length < 6) {
      const errorResponse = NextResponse.json(
        { error: "A nova senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      )
      applySupabaseCookies(intermediateResponse, errorResponse)
      return errorResponse
    }

    // Check if passwords are the same
    if (currentPassword === newPassword) {
      const errorResponse = NextResponse.json(
        { error: "A nova senha deve ser diferente da senha atual" },
        { status: 400 }
      )
      applySupabaseCookies(intermediateResponse, errorResponse)
      return errorResponse
    }

    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser || !authUser.email) {
      const unauthorizedResponse = NextResponse.json(
        { error: "Não autorizado - faça login novamente" },
        { status: 401 }
      )
      applySupabaseCookies(intermediateResponse, unauthorizedResponse)
      return unauthorizedResponse
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password: currentPassword,
    })

    if (signInError) {
      const errorResponse = NextResponse.json(
        { error: "Senha atual incorreta" },
        { status: 401 }
      )
      applySupabaseCookies(intermediateResponse, errorResponse)
      return errorResponse
    }

    // Update password using admin client (to bypass RLS and ensure update works)
    const adminSupabase = getSupabaseAdminClient()
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
      authUser.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error("Error updating password:", updateError)
      const errorResponse = NextResponse.json(
        { error: "Erro ao atualizar a senha. Tente novamente." },
        { status: 500 }
      )
      applySupabaseCookies(intermediateResponse, errorResponse)
      return errorResponse
    }

    // Success response
    const successResponse = NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso"
    })
    applySupabaseCookies(intermediateResponse, successResponse)
    return successResponse

  } catch (error) {
    console.error("Error in change-password:", error)
    const errorResponse = NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
    applySupabaseCookies(intermediateResponse, errorResponse)
    return errorResponse
  }
}
