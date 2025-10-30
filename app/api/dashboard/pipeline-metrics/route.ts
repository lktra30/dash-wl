import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

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
      const pipelineContacts = (contacts || []).filter(
        (contact: any) => contact.pipeline_id === pipeline.id
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

      // Build funnel data - count contacts per stage
      const funnel = stages.map((stage: any, index: number) => {
        const stageContacts = pipelineContacts.filter(
          (contact: any) => contact.stage_id === stage.id
        )

        const count = stageContacts.length

        // Calculate conversion from previous stage
        let conversionFromPrevious: number | undefined = undefined
        if (index > 0) {
          const previousStage = stages[index - 1]
          const previousStageContacts = pipelineContacts.filter(
            (contact: any) => contact.stage_id === previousStage.id
          )
          const previousCount = previousStageContacts.length

          if (previousCount > 0) {
            conversionFromPrevious = (count / previousCount) * 100
          }
        }

        return {
          stageId: stage.id,
          stageName: stage.name,
          stageColor: stage.color,
          count,
          conversionFromPrevious,
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
