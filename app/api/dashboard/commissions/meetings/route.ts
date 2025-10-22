import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { authenticateUser, createErrorResponse } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser(request)
    
    if (error || !user) {
      return createErrorResponse(error || "Unauthorized", 401)
    }

    const supabase = await getSupabaseServerClient()
    const whitelabelId = user.whitelabel_id

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const sdrId = searchParams.get('sdrId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const status = searchParams.get('status')

    // Build query
    let query = supabase
      .from("meetings")
      .select("*")
      .eq("whitelabel_id", whitelabelId)

    if (sdrId) {
      query = query.eq('sdr_id', sdrId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Filter by month/year if provided
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      
      query = query
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())
    }

    const { data: meetings, error: fetchError } = await query.order('scheduled_at', { ascending: false })

    if (fetchError) {
      return createErrorResponse(fetchError.message, 500)
    }

    // Convert to camelCase
    const formattedMeetings = (meetings || []).map(m => ({
      id: m.id,
      whitelabelId: m.whitelabel_id,
      sdrId: m.sdr_id,
      contactId: m.contact_id,
      dealId: m.deal_id,
      title: m.title,
      scheduledAt: m.scheduled_at,
      completedAt: m.completed_at,
      status: m.status,
      convertedToSale: m.converted_to_sale,
      notes: m.notes,
      createdAt: m.created_at,
      updatedAt: m.updated_at
    }))

    return NextResponse.json(formattedMeetings)
  } catch (err) {
    console.error("Error fetching meetings:", err)
    return createErrorResponse("Internal server error", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser(request)
    
    if (error || !user) {
      return createErrorResponse(error || "Unauthorized", 401)
    }

    const supabase = await getSupabaseServerClient()
    const whitelabelId = user.whitelabel_id
    const meetingData = await request.json()

    // Convert camelCase to snake_case
    const dbData = {
      whitelabel_id: whitelabelId,
      sdr_id: meetingData.sdrId || user.id,
      contact_id: meetingData.contactId,
      deal_id: meetingData.dealId,
      title: meetingData.title,
      scheduled_at: meetingData.scheduledAt,
      completed_at: meetingData.completedAt,
      status: meetingData.status || 'scheduled',
      converted_to_sale: meetingData.convertedToSale || false,
      notes: meetingData.notes
    }

    const { data, error: insertError } = await supabase
      .from("meetings")
      .insert(dbData)
      .select()
      .single()

    if (insertError) {
      return createErrorResponse(insertError.message, 500)
    }

    // Convert back to camelCase
    const formattedMeeting = {
      id: data.id,
      whitelabelId: data.whitelabel_id,
      sdrId: data.sdr_id,
      contactId: data.contact_id,
      dealId: data.deal_id,
      title: data.title,
      scheduledAt: data.scheduled_at,
      completedAt: data.completed_at,
      status: data.status,
      convertedToSale: data.converted_to_sale,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    return NextResponse.json(formattedMeeting)
  } catch (err) {
    console.error("Error creating meeting:", err)
    return createErrorResponse("Internal server error", 500)
  }
}
