import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { mapStageToFunnelStage } from "@/lib/stage-mapping"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's whitelabel information
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*, whitelabel_id")
      .eq("email", authUser.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Contact ID is required" }, { status: 400 })
    }

    // Build update object
    const updates: any = {}

    if (body.stageId !== undefined) {
      updates.stage_id = body.stageId
    }

    if (body.status !== undefined) {
      updates.funnel_stage = body.status
    }

    if (body.name !== undefined) {
      updates.name = body.name
    }

    if (body.email !== undefined) {
      updates.email = body.email
    }

    if (body.phone !== undefined) {
      updates.phone = body.phone
    }

    if (body.company !== undefined) {
      updates.company = body.company
    }

    if (body.sdrId !== undefined) {
      updates.sdr_id = body.sdrId
    }

    if (body.closerId !== undefined) {
      updates.closer_id = body.closerId
    }

    if (body.dealValue !== undefined) {
      updates.deal_value = body.dealValue
    }

    if (body.pipelineId !== undefined) {
      updates.pipeline_id = body.pipelineId
    }

    // Sync funnel_stage when stageId changes
    if (body.stageId !== undefined) {
      // Fetch stage information to determine the appropriate funnel_stage
      const { data: stageInfo } = await supabase
        .from("pipeline_stages")
        .select("counts_as_meeting, counts_as_sale, order_position, name")
        .eq("id", body.stageId)
        .single()

      // Map stage to funnel_stage to keep both fields in sync
      updates.funnel_stage = mapStageToFunnelStage(stageInfo)
    }

    // Always update the updated_at timestamp
    updates.updated_at = new Date().toISOString()

    // Update the contact
    const { data: updatedContact, error: updateError } = await supabase
      .from("contacts")
      .update(updates)
      .eq("id", id)
      .eq("whitelabel_id", user.whitelabel_id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating contact:", updateError)
      return NextResponse.json({ error: "Failed to update contact" }, { status: 500 })
    }

    // Transform response to camelCase for consistency with GET route
    const transformedContact = {
      id: updatedContact.id,
      name: updatedContact.name,
      email: updatedContact.email,
      phone: updatedContact.phone,
      company: updatedContact.company,
      status: updatedContact.funnel_stage,
      pipelineId: updatedContact.pipeline_id,
      stageId: updatedContact.stage_id,
      leadSource: updatedContact.lead_source,
      whitelabelId: updatedContact.whitelabel_id,
      assignedTo: updatedContact.assigned_to,
      dealValue: updatedContact.deal_value,
      dealDuration: updatedContact.deal_duration,
      sdrId: updatedContact.sdr_id,
      closerId: updatedContact.closer_id,
      createdAt: updatedContact.created_at,
      updatedAt: updatedContact.updated_at,
    }

    return NextResponse.json(transformedContact)
  } catch (error) {
    console.error("Error updating contact:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's whitelabel information
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*, whitelabel_id")
      .eq("email", authUser.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Contact ID is required" }, { status: 400 })
    }

    // Delete the contact (only if it belongs to the user's whitelabel)
    const { error: deleteError } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id)
      .eq("whitelabel_id", user.whitelabel_id)

    if (deleteError) {
      console.error("Error deleting contact:", deleteError)
      return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Contact deleted successfully" })
  } catch (error) {
    console.error("Error deleting contact:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
