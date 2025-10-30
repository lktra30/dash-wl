import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// GET /api/dashboard/pipelines/[id] - Buscar pipeline específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Buscar pipeline com suas stages
    const { data: pipeline, error: pipelineError } = await supabase
      .from("pipelines")
      .select(`
        id,
        whitelabel_id,
        name,
        description,
        is_default,
        color,
        created_at,
        updated_at,
        pipeline_stages (
          id,
          pipeline_id,
          name,
          description,
          order_position,
          color,
          counts_as_meeting,
          counts_as_sale,
          requires_sdr,
          requires_closer,
          requires_deal_value,
          created_at,
          updated_at
        )
      `)
      .eq("id", params.id)
      .single()

    if (pipelineError) {
      console.error("Error fetching pipeline:", pipelineError)
      return NextResponse.json({ error: pipelineError.message }, { status: 404 })
    }

    // Formatar resposta
    const formattedPipeline = {
      id: pipeline.id,
      whitelabelId: pipeline.whitelabel_id,
      name: pipeline.name,
      description: pipeline.description,
      isDefault: pipeline.is_default,
      color: pipeline.color,
      createdAt: pipeline.created_at,
      updatedAt: pipeline.updated_at,
      stages: (pipeline.pipeline_stages || [])
        .map((stage: any) => ({
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
        }))
        .sort((a: any, b: any) => a.orderPosition - b.orderPosition)
    }

    return NextResponse.json(formattedPipeline)
  } catch (error: any) {
    console.error("Error in GET /api/dashboard/pipelines/[id]:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/dashboard/pipelines/[id] - Atualizar pipeline
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Buscar whitelabel do usuário
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("whitelabel_id")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, isDefault, color } = body

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

    if (color !== undefined) {
      updates.color = color
    }

    if (isDefault !== undefined) {
      updates.is_default = isDefault

      // Se marcando como default, remover default dos outros
      if (isDefault) {
        await supabase
          .from("pipelines")
          .update({ is_default: false })
          .eq("whitelabel_id", userData.whitelabel_id)
          .neq("id", params.id)
      }
    }

    // Atualizar pipeline
    const { data: pipeline, error: updateError } = await supabase
      .from("pipelines")
      .update(updates)
      .eq("id", params.id)
      .eq("whitelabel_id", userData.whitelabel_id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating pipeline:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Buscar pipeline completo com stages
    const { data: fullPipeline, error: fetchError } = await supabase
      .from("pipelines")
      .select(`
        id,
        whitelabel_id,
        name,
        description,
        is_default,
        color,
        created_at,
        updated_at,
        pipeline_stages (
          id,
          pipeline_id,
          name,
          description,
          order_position,
          color,
          counts_as_meeting,
          counts_as_sale,
          requires_sdr,
          requires_closer,
          requires_deal_value,
          created_at,
          updated_at
        )
      `)
      .eq("id", params.id)
      .single()

    if (fetchError) {
      console.error("Error fetching updated pipeline:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Formatar resposta
    const formattedPipeline = {
      id: fullPipeline.id,
      whitelabelId: fullPipeline.whitelabel_id,
      name: fullPipeline.name,
      description: fullPipeline.description,
      isDefault: fullPipeline.is_default,
      color: fullPipeline.color,
      createdAt: fullPipeline.created_at,
      updatedAt: fullPipeline.updated_at,
      stages: (fullPipeline.pipeline_stages || [])
        .map((stage: any) => ({
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
        }))
        .sort((a: any, b: any) => a.orderPosition - b.orderPosition)
    }

    return NextResponse.json(formattedPipeline)
  } catch (error: any) {
    console.error("Error in PATCH /api/dashboard/pipelines/[id]:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/dashboard/pipelines/[id] - Deletar pipeline
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Buscar whitelabel do usuário
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("whitelabel_id")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verificar se é o pipeline padrão
    const { data: pipeline, error: checkError } = await supabase
      .from("pipelines")
      .select("is_default")
      .eq("id", params.id)
      .eq("whitelabel_id", userData.whitelabel_id)
      .single()

    if (checkError) {
      return NextResponse.json({ error: "Pipeline not found" }, { status: 404 })
    }

    if (pipeline.is_default) {
      return NextResponse.json(
        { error: "Não é possível deletar o pipeline padrão. Por favor, defina outro pipeline como padrão primeiro." },
        { status: 400 }
      )
    }

    // Deletar pipeline (cascade delete vai remover stages)
    const { error: deleteError } = await supabase
      .from("pipelines")
      .delete()
      .eq("id", params.id)
      .eq("whitelabel_id", userData.whitelabel_id)

    if (deleteError) {
      console.error("Error deleting pipeline:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in DELETE /api/dashboard/pipelines/[id]:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
