import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// GET /api/dashboard/pipelines/[id]/stages/[stageId] - Buscar stage específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; stageId: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Buscar stage
    const { data: stage, error: stageError } = await supabase
      .from("pipeline_stages")
      .select("*")
      .eq("id", params.stageId)
      .eq("pipeline_id", params.id)
      .single()

    if (stageError) {
      console.error("Error fetching stage:", stageError)
      return NextResponse.json({ error: stageError.message }, { status: 404 })
    }

    // Formatar resposta
    const formattedStage = {
      id: stage.id,
      pipelineId: stage.pipeline_id,
      name: stage.name,
      description: stage.description,
      orderPosition: stage.order_position,
      color: stage.color,
      countsAsMeeting: stage.counts_as_meeting,
      countsAsSale: stage.counts_as_sale,
      requiresSdr: stage.requires_sdr,
      requiresCloser: stage.requires_closer,
      requiresDealValue: stage.requires_deal_value,
      createdAt: stage.created_at,
      updatedAt: stage.updated_at,
    }

    return NextResponse.json(formattedStage)
  } catch (error: any) {
    console.error("Error in GET /api/dashboard/pipelines/[id]/stages/[stageId]:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/dashboard/pipelines/[id]/stages/[stageId] - Atualizar stage
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; stageId: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      orderPosition,
      color,
      countsAsMeeting,
      countsAsSale,
      requiresSdr,
      requiresCloser,
      requiresDealValue,
    } = body

    const updates: any = {}

    if (name !== undefined) {
      if (!name || name.trim() === "") {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
      }
      updates.name = name.trim()
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null
    }

    if (orderPosition !== undefined) {
      updates.order_position = orderPosition
    }

    if (color !== undefined) {
      updates.color = color
    }

    if (countsAsMeeting !== undefined) {
      updates.counts_as_meeting = countsAsMeeting
    }

    if (countsAsSale !== undefined) {
      updates.counts_as_sale = countsAsSale
    }

    if (requiresSdr !== undefined) {
      updates.requires_sdr = requiresSdr
    }

    if (requiresCloser !== undefined) {
      updates.requires_closer = requiresCloser
    }

    if (requiresDealValue !== undefined) {
      updates.requires_deal_value = requiresDealValue
    }

    // Atualizar stage
    const { data: stage, error: updateError } = await supabase
      .from("pipeline_stages")
      .update(updates)
      .eq("id", params.stageId)
      .eq("pipeline_id", params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating stage:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Formatar resposta
    const formattedStage = {
      id: stage.id,
      pipelineId: stage.pipeline_id,
      name: stage.name,
      description: stage.description,
      orderPosition: stage.order_position,
      color: stage.color,
      countsAsMeeting: stage.counts_as_meeting,
      countsAsSale: stage.counts_as_sale,
      requiresSdr: stage.requires_sdr,
      requiresCloser: stage.requires_closer,
      requiresDealValue: stage.requires_deal_value,
      createdAt: stage.created_at,
      updatedAt: stage.updated_at,
    }

    return NextResponse.json(formattedStage)
  } catch (error: any) {
    console.error("Error in PATCH /api/dashboard/pipelines/[id]/stages/[stageId]:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/dashboard/pipelines/[id]/stages/[stageId] - Deletar stage
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; stageId: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verificar se existem contatos neste stage
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("id")
      .eq("stage_id", params.stageId)
      .limit(1)

    if (contactsError) {
      console.error("Error checking contacts:", contactsError)
      return NextResponse.json({ error: contactsError.message }, { status: 500 })
    }

    if (contacts && contacts.length > 0) {
      return NextResponse.json(
        {
          error: `Não é possível deletar este estágio porque existem ${contacts.length} contato(s) nele. Por favor, mova os contatos para outro estágio primeiro.`
        },
        { status: 400 }
      )
    }

    // Deletar stage
    const { error: deleteError } = await supabase
      .from("pipeline_stages")
      .delete()
      .eq("id", params.stageId)
      .eq("pipeline_id", params.id)

    if (deleteError) {
      console.error("Error deleting stage:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in DELETE /api/dashboard/pipelines/[id]/stages/[stageId]:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
