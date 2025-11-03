import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// Helper function to identify negative final stages (Lost, Disqualified)
function isNegativeFinalStage(stage: any): boolean {
  const stageName = stage.name.toLowerCase()
  return (
    stageName.includes('perdido') ||
    stageName.includes('lost') ||
    stageName.includes('desqualificado') ||
    stageName.includes('disqualified') ||
    stageName.includes('cancelado') ||
    stageName.includes('cancelled')
  )
}

// Helper function to check if a contact belongs to a specific stage
// Supports both new system (stage_id) and legacy system (funnel_stage)
function shouldContactBeInStage(contact: any, stage: any, allStages: any[]): boolean {
  // Priority 1: Use stage_id if available
  if (contact.stage_id) {
    return contact.stage_id === stage.id
  }

  // Priority 2: Fallback to funnel_stage mapping for legacy contacts
  const funnelStage = contact.funnel_stage
  if (!funnelStage) {
    return false
  }

  // Map legacy funnel_stage to new stages based on order_position and flags
  const stageName = stage.name.toLowerCase()
  const orderPosition = stage.order_position

  // Map based on funnel_stage value
  switch (funnelStage) {
    case 'new_lead':
      // First stage or stage with "novo"/"new" in name
      return orderPosition === 1 ||
             stageName.includes('novo') ||
             stageName.includes('new') ||
             stageName.includes('lead')

    case 'contacted':
      // Second stage or stage with "contato"/"contacted" in name
      return orderPosition === 2 ||
             stageName.includes('contato') ||
             stageName.includes('contacted') ||
             stageName.includes('contact')

    case 'meeting':
    case 'reuniao':
      // Third stage, stage with counts_as_meeting flag, or stage with "reunião"/"meeting" in name
      return orderPosition === 3 ||
             stage.counts_as_meeting === true ||
             stageName.includes('reunião') ||
             stageName.includes('reuniao') ||
             stageName.includes('meeting') ||
             stageName.includes('agendada')

    case 'negotiation':
    case 'negociacao':
      // Fourth stage or stage with "negociação"/"negotiation" in name
      return orderPosition === 4 ||
             stageName.includes('negociação') ||
             stageName.includes('negociacao') ||
             stageName.includes('negotiation')

    case 'won':
    case 'closed':
      // Stage with counts_as_sale flag or stage with "ganho"/"won"/"fechado" in name
      return stage.counts_as_sale === true ||
             stageName.includes('ganho') ||
             stageName.includes('won') ||
             stageName.includes('fechado') ||
             stageName.includes('venda')

    case 'lost':
    case 'perdido':
      // Stage with "perdido"/"lost" in name
      return stageName.includes('perdido') ||
             stageName.includes('lost')

    case 'disqualified':
    case 'desqualificado':
      // Stage with "desqualificado"/"disqualified" in name
      return stageName.includes('desqualificado') ||
             stageName.includes('disqualified')

    default:
      return false
  }
}

export async function GET(request: NextRequest) {
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

    // Fetch all pipelines with their stages
    const { data: pipelines, error: pipelinesError } = await supabase
      .from("pipelines")
      .select(`
        id,
        name,
        color,
        is_default,
        pipeline_stages (
          id,
          name,
          color,
          order_position,
          counts_as_meeting,
          counts_as_sale
        )
      `)
      .eq("whitelabel_id", user.whitelabel_id)
      .order("created_at", { ascending: true })

    if (pipelinesError) {
      console.error("Error fetching pipelines:", pipelinesError)
      return NextResponse.json({ error: "Failed to fetch pipelines" }, { status: 500 })
    }

    if (!pipelines || pipelines.length === 0) {
      return NextResponse.json([])
    }

    // Fetch all contacts with their stage information
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select(`
        id,
        pipeline_id,
        stage_id,
        funnel_stage,
        pipeline_stages!stage_id (
          id,
          counts_as_meeting,
          counts_as_sale
        )
      `)
      .eq("whitelabel_id", user.whitelabel_id)

    if (contactsError) {
      console.error("Error fetching contacts:", contactsError)
      return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
    }

    // Process metrics for each pipeline
    const result = pipelines.map((pipeline: any) => {
      // Order stages by position
      const stages = (pipeline.pipeline_stages || []).sort(
        (a: any, b: any) => a.order_position - b.order_position
      )

      // Filter contacts for this pipeline
      // Include contacts with matching pipeline_id OR legacy contacts (no pipeline_id) if this is the default pipeline
      const pipelineContacts = (contacts || []).filter(
        (contact: any) => {
          // Direct match by pipeline_id
          if (contact.pipeline_id === pipeline.id) {
            return true
          }

          // Include legacy contacts (no pipeline_id) in the default pipeline if they have funnel_stage
          if (!contact.pipeline_id && pipeline.is_default && contact.funnel_stage) {
            return true
          }

          return false
        }
      )

      const totalContacts = pipelineContacts.length

      // Count meetings (prioritize flag, fallback to stage name)
      // Note: All sales should count as meetings, but not all meetings are sales
      const meetingContacts = pipelineContacts.filter((contact: any) => {
        return (
          contact.pipeline_stages?.counts_as_meeting === true ||
          contact.pipeline_stages?.counts_as_sale === true ||
          contact.funnel_stage === 'meeting' ||
          contact.funnel_stage === 'reuniao' ||
          contact.funnel_stage === 'won'
        )
      })

      // Count sales (prioritize flag, fallback to status)
      const salesContacts = pipelineContacts.filter((contact: any) => {
        return (
          contact.pipeline_stages?.counts_as_sale === true ||
          contact.funnel_stage === 'won'
        )
      })

      const totalMeetings = meetingContacts.length
      const totalSales = salesContacts.length

      // Calculate metrics
      const meetingRate = totalContacts > 0 ? (totalMeetings / totalContacts) * 100 : 0
      const finalConversion = totalContacts > 0 ? (totalSales / totalContacts) * 100 : 0
      const meetingsPerSale = totalSales > 0 ? totalMeetings / totalSales : 0

      // Build funnel data - count contacts per stage (CUMULATIVE)
      const funnel = stages.map((stage: any, index: number) => {
        let count: number

        // Check if this is a final stage (won/sale or negative outcome)
        const isFinalStage = stage.counts_as_sale || isNegativeFinalStage(stage)

        if (isFinalStage) {
          // Final stages: count only contacts currently in this stage
          const stageContacts = pipelineContacts.filter(
            (contact: any) => shouldContactBeInStage(contact, stage, stages)
          )
          count = stageContacts.length
        } else {
          // Intermediate stages: count contacts in this stage OR any later stage (except negative final stages)
          // This creates a cumulative funnel showing how many reached or passed this stage
          const eligibleStages = stages.filter((s: any) => {
            // Include current stage and all stages with higher order_position
            const isCurrentOrLater = s.order_position >= stage.order_position
            // Exclude negative final stages (lost, disqualified) from cumulative count
            const isNegativeFinal = isNegativeFinalStage(s)
            return isCurrentOrLater && !isNegativeFinal
          })

          const cumulativeContacts = pipelineContacts.filter((contact: any) => {
            return eligibleStages.some((s: any) => shouldContactBeInStage(contact, s, stages))
          })

          count = cumulativeContacts.length
        }

        return {
          stageId: stage.id,
          stageName: stage.name,
          stageColor: stage.color,
          count,
          countsAsMeeting: stage.counts_as_meeting || false,
          countsAsSale: stage.counts_as_sale || false,
        }
      })

      return {
        pipelineId: pipeline.id,
        name: pipeline.name,
        color: pipeline.color,
        metrics: {
          meetingRate: Math.round(meetingRate * 10) / 10, // 1 decimal place
          finalConversion: Math.round(finalConversion * 10) / 10,
          meetingsPerSale: Math.round(meetingsPerSale * 10) / 10,
          totalContacts,
          totalMeetings,
          totalSales,
        },
        funnel,
      }
    })

    // Add cache header for 5 minutes
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error("Error in pipeline metrics API:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
