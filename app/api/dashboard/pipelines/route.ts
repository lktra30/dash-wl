import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// GET /api/dashboard/pipelines - Listar todos os pipelines do whitelabel
export async function GET(request: NextRequest) {
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

    // Buscar pipelines com suas stages
    const { data: pipelines, error: pipelinesError } = await supabase
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
      .eq("whitelabel_id", userData.whitelabel_id)
      .order("created_at", { ascending: false })

    if (pipelinesError) {
      console.error("Error fetching pipelines:", pipelinesError)
      return NextResponse.json({ error: pipelinesError.message }, { status: 500 })
    }

    // Formatar resposta com camelCase
    const formattedPipelines = (pipelines || []).map((pipeline: any) => ({
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
    }))

    return NextResponse.json(formattedPipelines)
  } catch (error: any) {
    console.error("Error in GET /api/dashboard/pipelines:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/dashboard/pipelines - Criar novo pipeline
export async function POST(request: NextRequest) {
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
    const { name, description, isDefault, color, stages } = body

    // Validação
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "O nome do pipeline é obrigatório. Por favor, forneça um nome válido." },
        { status: 400 }
      )
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "O nome do pipeline não pode ter mais de 100 caracteres." },
        { status: 400 }
      )
    }

    // Se isDefault é true, remover o default de outros pipelines
    if (isDefault) {
      await supabase
        .from("pipelines")
        .update({ is_default: false })
        .eq("whitelabel_id", userData.whitelabel_id)
    }

    // Criar pipeline
    const { data: pipeline, error: pipelineError } = await supabase
      .from("pipelines")
      .insert({
        whitelabel_id: userData.whitelabel_id,
        name: name.trim(),
        description: description?.trim() || null,
        is_default: isDefault || false,
        color: color || "#3b82f6",
      })
      .select()
      .single()

    if (pipelineError) {
      console.error("Error creating pipeline:", pipelineError)

      // Mensagem de erro mais amigável
      let errorMessage = "Erro ao criar pipeline. "
      if (pipelineError.code === "23505") {
        errorMessage += "Já existe um pipeline com esse nome. Por favor, escolha outro nome."
      } else {
        errorMessage += pipelineError.message || "Por favor, tente novamente."
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    // Se stages foram fornecidos, criar stages
    if (stages && Array.isArray(stages) && stages.length > 0) {
      // Validar stages
      const invalidStage = stages.find((stage: any) => !stage.name || stage.name.trim() === "")
      if (invalidStage) {
        await supabase.from("pipelines").delete().eq("id", pipeline.id)
        return NextResponse.json(
          { error: "Todos os estágios devem ter um nome válido." },
          { status: 400 }
        )
      }

      const stagesData = stages.map((stage: any, index: number) => ({
        pipeline_id: pipeline.id,
        name: stage.name,
        description: stage.description || null,
        order_position: stage.orderPosition !== undefined ? stage.orderPosition : index + 1,
        color: stage.color || "#6366f1",
        counts_as_meeting: stage.countsAsMeeting || false,
        counts_as_sale: stage.countsAsSale || false,
        requires_sdr: stage.requiresSdr || false,
        requires_closer: stage.requiresCloser || false,
        requires_deal_value: stage.requiresDealValue || false,
      }))

      const { error: stagesError } = await supabase
        .from("pipeline_stages")
        .insert(stagesData)

      if (stagesError) {
        console.error("Error creating stages:", stagesError)
        // Reverter criação do pipeline
        await supabase.from("pipelines").delete().eq("id", pipeline.id)

        let errorMessage = "Erro ao criar estágios do pipeline. "
        if (stagesError.code === "23505") {
          errorMessage += "Existem estágios duplicados. Verifique os nomes e posições."
        } else {
          errorMessage += stagesError.message || "Por favor, tente novamente."
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 })
      }
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
      .eq("id", pipeline.id)
      .single()

    if (fetchError) {
      console.error("Error fetching created pipeline:", fetchError)
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

    return NextResponse.json(formattedPipeline, { status: 201 })
  } catch (error: any) {
    console.error("Error in POST /api/dashboard/pipelines:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
