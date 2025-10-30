import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// GET /api/dashboard/pipelines/[id]/stages - Listar stages de um pipeline
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

    // Buscar stages do pipeline
    const { data: stages, error: stagesError } = await supabase
      .from("pipeline_stages")
      .select("*")
      .eq("pipeline_id", params.id)
      .order("order_position", { ascending: true })

    if (stagesError) {
      console.error("Error fetching stages:", stagesError)
      return NextResponse.json({ error: stagesError.message }, { status: 500 })
    }

    // Formatar resposta
    const formattedStages = (stages || []).map((stage: any) => ({
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

    return NextResponse.json(formattedStages)
  } catch (error: any) {
    console.error("Error in GET /api/dashboard/pipelines/[id]/stages:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/dashboard/pipelines/[id]/stages - Criar novo stage
export async function POST(
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

    // Validação
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "O nome do estágio é obrigatório. Por favor, forneça um nome válido." },
        { status: 400 }
      )
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "O nome do estágio não pode ter mais de 100 caracteres." },
        { status: 400 }
      )
    }

    // Se orderPosition não foi fornecido, adicionar ao final
    let finalOrderPosition = orderPosition
    if (finalOrderPosition === undefined) {
      const { data: lastStage } = await supabase
        .from("pipeline_stages")
        .select("order_position")
        .eq("pipeline_id", params.id)
        .order("order_position", { ascending: false })
        .limit(1)
        .single()

      finalOrderPosition = lastStage ? lastStage.order_position + 1 : 1
    }

    // Criar stage
    const { data: stage, error: stageError } = await supabase
      .from("pipeline_stages")
      .insert({
        pipeline_id: params.id,
        name: name.trim(),
        description: description?.trim() || null,
        order_position: finalOrderPosition,
        color: color || "#6366f1",
        counts_as_meeting: countsAsMeeting || false,
        counts_as_sale: countsAsSale || false,
        requires_sdr: requiresSdr || false,
        requires_closer: requiresCloser || false,
        requires_deal_value: requiresDealValue || false,
      })
      .select()
      .single()

    if (stageError) {
      console.error("Error creating stage:", stageError)

      let errorMessage = "Erro ao criar estágio. "
      if (stageError.code === "23505") {
        errorMessage += "Já existe um estágio com esse nome ou posição neste pipeline. Por favor, escolha outro nome ou posição."
      } else if (stageError.code === "23503") {
        errorMessage += "Pipeline não encontrado."
      } else {
        errorMessage += stageError.message || "Por favor, tente novamente."
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 })
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

    return NextResponse.json(formattedStage, { status: 201 })
  } catch (error: any) {
    console.error("Error in POST /api/dashboard/pipelines/[id]/stages:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
