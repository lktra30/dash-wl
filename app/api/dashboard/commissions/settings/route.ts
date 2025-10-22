import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { authenticateUser, createErrorResponse } from "@/lib/api-auth"
import { getUserRoleWithFallback, hasCommissionViewAccess, hasCommissionEditAccess } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser(request)
    
    if (error || !user) {
      return createErrorResponse(error || "Unauthorized", 401)
    }

    // Get user role with fallback (employee table or users table)
    const userRole = await getUserRoleWithFallback(user.email, user)

    // Verify permission to view commission settings (admin, gestor, or SuperAdmin)
    if (!hasCommissionViewAccess(userRole)) {
      return createErrorResponse("Acesso negado. Você não tem permissão para visualizar configurações de comissões.", 403)
    }

    const supabase = await getSupabaseServerClient()
    const whitelabelId = user.whitelabel_id

    // Fetch commission settings for this whitelabel
    const { data: records, error: fetchError } = await supabase
      .from("commissions_settings")
      .select("*")
      .eq("whitelabel_id", whitelabelId)

    if (fetchError) {
      return createErrorResponse(fetchError.message, 500)
    }

    if (!records || records.length === 0) {
      return NextResponse.json(null)
    }

    if (records.length > 1) {
      console.error(
        "[Commissions Settings] Multiple records detected for whitelabel",
        whitelabelId,
        "IDs:",
        records.map((record) => record.id),
      )
      return createErrorResponse(
        "Multiple commission settings entries exist for this whitelabel. Please contact support to resolve duplicates.",
        500,
      )
    }

    const settings = records[0]

    // Convert snake_case to camelCase
    const formattedSettings = {
      id: settings.id,
      whitelabelId: settings.whitelabel_id,
      checkpoint1Percent: Number(settings.checkpoint_1_percent),
      checkpoint2Percent: Number(settings.checkpoint_2_percent),
      checkpoint3Percent: Number(settings.checkpoint_3_percent),
      checkpoint1CommissionPercent: Number(settings.checkpoint_1_commission_percent),
      checkpoint2CommissionPercent: Number(settings.checkpoint_2_commission_percent),
      checkpoint3CommissionPercent: Number(settings.checkpoint_3_commission_percent),
      sdrMeetingCommission: Number(settings.sdr_meeting_commission),
      sdrMeetingsTarget: settings.sdr_meetings_target,
      sdrBonusClosedMeeting: Number(settings.sdr_bonus_closed_meeting),
      closerCommissionPercent: Number(settings.closer_commission_percent),
      closerSalesTarget: Number(settings.closer_sales_target),
      closerFixedCommission:
        settings.closer_fixed_commission !== null && settings.closer_fixed_commission !== undefined
          ? Number(settings.closer_fixed_commission)
          : 0,
      closerPerSaleCommission:
        settings.closer_per_sale_commission !== null && settings.closer_per_sale_commission !== undefined
          ? Number(settings.closer_per_sale_commission)
          : 0,
      createdAt: settings.created_at,
      updatedAt: settings.updated_at
    }

    return NextResponse.json(formattedSettings)
  } catch (err) {
    console.error("Error fetching commission settings:", err)
    return createErrorResponse("Internal server error", 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser(request)
    
    if (error || !user) {
      return createErrorResponse(error || "Unauthorized", 401)
    }

    // Get user role with fallback (employee table or users table)
    const userRole = await getUserRoleWithFallback(user.email, user)

    // Verify permission to edit commission settings (admin or SuperAdmin only)
    if (!hasCommissionEditAccess(userRole)) {
      return createErrorResponse("Acesso negado. Apenas administradores podem alterar configurações de comissões.", 403)
    }

    const supabase = await getSupabaseServerClient()
    const whitelabelId = user.whitelabel_id
    const updates = await request.json()

    // Convert camelCase to snake_case for database
    const dbUpdates: any = {}
    
    if (updates.checkpoint1Percent !== undefined) dbUpdates.checkpoint_1_percent = updates.checkpoint1Percent
    if (updates.checkpoint2Percent !== undefined) dbUpdates.checkpoint_2_percent = updates.checkpoint2Percent
    if (updates.checkpoint3Percent !== undefined) dbUpdates.checkpoint_3_percent = updates.checkpoint3Percent
    if (updates.checkpoint1CommissionPercent !== undefined) dbUpdates.checkpoint_1_commission_percent = updates.checkpoint1CommissionPercent
    if (updates.checkpoint2CommissionPercent !== undefined) dbUpdates.checkpoint_2_commission_percent = updates.checkpoint2CommissionPercent
    if (updates.checkpoint3CommissionPercent !== undefined) dbUpdates.checkpoint_3_commission_percent = updates.checkpoint3CommissionPercent
    if (updates.sdrMeetingCommission !== undefined) dbUpdates.sdr_meeting_commission = updates.sdrMeetingCommission
    if (updates.sdrMeetingsTarget !== undefined) dbUpdates.sdr_meetings_target = updates.sdrMeetingsTarget
    if (updates.sdrBonusClosedMeeting !== undefined) dbUpdates.sdr_bonus_closed_meeting = updates.sdrBonusClosedMeeting
    if (updates.closerCommissionPercent !== undefined) dbUpdates.closer_commission_percent = updates.closerCommissionPercent
    if (updates.closerSalesTarget !== undefined) dbUpdates.closer_sales_target = updates.closerSalesTarget
    if (updates.closerFixedCommission !== undefined) dbUpdates.closer_fixed_commission = updates.closerFixedCommission
    if (updates.closerPerSaleCommission !== undefined) dbUpdates.closer_per_sale_commission = updates.closerPerSaleCommission

    // Try to update first
    const { data: existingSettingsRecords, error: fetchExistingError } = await supabase
      .from("commissions_settings")
      .select("id")
      .eq("whitelabel_id", whitelabelId)

    if (fetchExistingError) {
      return createErrorResponse(fetchExistingError.message, 500)
    }

    if (existingSettingsRecords && existingSettingsRecords.length > 1) {
      console.error(
        "[Commissions Settings] Multiple records detected for whitelabel during update",
        whitelabelId,
        "IDs:",
        existingSettingsRecords.map((record) => record.id),
        "Payload:",
        dbUpdates,
      )
      return createErrorResponse(
        "Multiple commission settings entries exist for this whitelabel. Resolve duplicates before saving.",
        500,
      )
    }

    const existingSettings = existingSettingsRecords?.[0] ?? null

    let data, updateError

    if (existingSettings) {
      // Update existing settings using whitelabel_id to identify the row
      const result = await supabase
        .from("commissions_settings")
        .update(dbUpdates)
        .eq("whitelabel_id", whitelabelId)
        .select()
        .maybeSingle()
      
      data = result.data
      updateError = result.error
    } else {
      // Insert new settings
      const result = await supabase
        .from("commissions_settings")
        .insert({
          ...dbUpdates,
          whitelabel_id: whitelabelId
        })
        .select()
        .maybeSingle()
      
      data = result.data
      updateError = result.error
    }

    if (updateError) {
      return createErrorResponse(updateError.message, 500)
    }

    if (!data) {
      return createErrorResponse("Commission settings row not found after update.", 404)
    }

    // Convert back to camelCase
    const formattedSettings = {
      id: data.id,
      whitelabelId: data.whitelabel_id,
      checkpoint1Percent: Number(data.checkpoint_1_percent),
      checkpoint2Percent: Number(data.checkpoint_2_percent),
      checkpoint3Percent: Number(data.checkpoint_3_percent),
      checkpoint1CommissionPercent: Number(data.checkpoint_1_commission_percent),
      checkpoint2CommissionPercent: Number(data.checkpoint_2_commission_percent),
      checkpoint3CommissionPercent: Number(data.checkpoint_3_commission_percent),
      sdrMeetingCommission: Number(data.sdr_meeting_commission),
      sdrMeetingsTarget: data.sdr_meetings_target,
      sdrBonusClosedMeeting: Number(data.sdr_bonus_closed_meeting),
      closerCommissionPercent: Number(data.closer_commission_percent),
      closerSalesTarget: Number(data.closer_sales_target),
      closerFixedCommission:
        data.closer_fixed_commission !== null && data.closer_fixed_commission !== undefined
          ? Number(data.closer_fixed_commission)
          : 0,
      closerPerSaleCommission:
        data.closer_per_sale_commission !== null && data.closer_per_sale_commission !== undefined
          ? Number(data.closer_per_sale_commission)
          : 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    return NextResponse.json(formattedSettings)
  } catch (err) {
    console.error("Error updating commission settings:", err)
    return createErrorResponse("Internal server error", 500)
  }
}
