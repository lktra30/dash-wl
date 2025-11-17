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

    console.log('========================================')
    console.log('📅 [MEETINGS API] GET Request Started')
    console.log('========================================')
    console.log('👤 User ID:', user.id)
    console.log('🏢 User WhitelabelId:', whitelabelId)
    console.log('📧 User Email:', user.email)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const sdrId = searchParams.get('sdrId')
    const closerId = searchParams.get('closerId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const status = searchParams.get('status')

    console.log('🔍 Query Filters:', { sdrId, closerId, month, year, status })

    // Build query - meetings table references users, not employees
    // We'll fetch the data and then join with employees separately
    let query = supabase
      .from("meetings")
      .select("*")
      .eq("whitelabel_id", whitelabelId)

    console.log('✅ Query filtering by whitelabel_id:', whitelabelId)

    if (sdrId) {
      query = query.eq('sdr_id', sdrId)
    }

    if (closerId) {
      // Note: meetings table doesn't have closer_id yet, so this filter won't work
      // We'll need to add this column via migration later
      console.log('⚠️  Closer filter not yet supported - meetings table needs closer_id column')
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Filter by month/year if provided
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      
      console.log('📆 Date range filter:', {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      })
      
      query = query
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())
    }

    const { data: meetings, error: fetchError } = await query.order('scheduled_at', { ascending: false })

    if (fetchError) {
      console.error('❌ [MEETINGS API] Database Error:', fetchError)
      console.log('========================================')
      return createErrorResponse(fetchError.message, 500)
    }

    // Fetch employee names separately for meetings
    const meetingSdrIds = meetings?.map(m => m.sdr_id).filter(Boolean) || []
    const { data: meetingEmployees } = await supabase
      .from('employees')
      .select('id, name')
      .in('id', meetingSdrIds.length > 0 ? meetingSdrIds : ['00000000-0000-0000-0000-000000000000'])

    // Create a map of employee id to name
    const employeeMap = new Map(meetingEmployees?.map(e => [e.id, e.name]) || [])

    // Also check users table for backward compatibility
    const { data: meetingUsers } = await supabase
      .from('users')
      .select('id, name')
      .in('id', meetingSdrIds.length > 0 ? meetingSdrIds : ['00000000-0000-0000-0000-000000000000'])
    
    const userMap = new Map(meetingUsers?.map(u => [u.id, u.name]) || [])

    // Also fetch contacts with meeting dates
    let contactsQuery = supabase
      .from("contacts")
      .select(`
        *,
        sdr:employees!contacts_sdr_id_fkey(name),
        closer:employees!contacts_closer_id_fkey(name)
      `)
      .eq("whitelabel_id", whitelabelId)
      .not("meeting_date", "is", null)

    if (sdrId) {
      contactsQuery = contactsQuery.eq('sdr_id', sdrId)
    }

    if (closerId) {
      contactsQuery = contactsQuery.eq('closer_id', closerId)
    }

    // Filter by month/year if provided
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      
      contactsQuery = contactsQuery
        .gte('meeting_date', startDate.toISOString())
        .lte('meeting_date', endDate.toISOString())
    }

    const { data: contacts, error: contactsError } = await contactsQuery.order('meeting_date', { ascending: false })

    if (contactsError) {
      console.error('❌ [MEETINGS API] Contacts Query Error:', contactsError)
    }

    console.log('----------------------------------------')
    console.log('📊 Query Results:')
    console.log('   Total Meetings Found:', meetings?.length || 0)
    console.log('   Total Contacts with Meeting Dates:', contacts?.length || 0)
    
    if (meetings && meetings.length > 0) {
      console.log('----------------------------------------')
      console.log('📋 Meetings Details:')
      meetings.forEach((m, idx) => {
        const scheduledDate = new Date(m.scheduled_at).toLocaleDateString('pt-BR')
        const scheduledTime = new Date(m.scheduled_at).toLocaleTimeString('pt-BR')
        console.log(`  ${idx + 1}. "${m.title}"`)
        console.log(`     📅 ${scheduledDate} às ${scheduledTime}`)
        console.log(`     🏢 Whitelabel: ${m.whitelabel_id === whitelabelId ? '✅ MATCH' : '❌ MISMATCH'}`)
        console.log(`     📍 Status: ${m.status}`)
        console.log(`     👤 SDR: ${m.sdr_id || 'N/A'}`)
        console.log('     ---')
      })
    }

    if (contacts && contacts.length > 0) {
      console.log('----------------------------------------')
      console.log('📞 Contacts with Meeting Dates:')
      contacts.forEach((c, idx) => {
        const meetingDate = new Date(c.meeting_date).toLocaleDateString('pt-BR')
        const meetingTime = new Date(c.meeting_date).toLocaleTimeString('pt-BR')
        console.log(`  ${idx + 1}. "${c.name}"`)
        console.log(`     📅 ${meetingDate} às ${meetingTime}`)
        console.log(`     🏢 Whitelabel: ${c.whitelabel_id === whitelabelId ? '✅ MATCH' : '❌ MISMATCH'}`)
        console.log(`     📍 Stage: ${c.funnel_stage || 'N/A'}`)
        console.log(`     👤 SDR: ${c.sdr_id || 'N/A'}`)
        console.log('     ---')
      })
    }
    
    if ((!meetings || meetings.length === 0) && (!contacts || contacts.length === 0)) {
      console.log('⚠️  No meetings or contacts with meeting dates found')
      console.log('   This could mean:')
      console.log('   - No meetings/contacts created yet')
      console.log('   - All meetings/contacts filtered out by query params')
      console.log('   - RLS policy blocking access')
    }
    console.log('========================================\n')

    // Convert meetings to camelCase with employee names
    const formattedMeetings = (meetings || []).map(m => ({
      id: m.id,
      whitelabelId: m.whitelabel_id,
      sdrId: m.sdr_id,
      sdrName: employeeMap.get(m.sdr_id) || userMap.get(m.sdr_id),
      closerId: undefined, // meetings table doesn't have closer_id yet
      closerName: undefined,
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

    // Convert contacts with meeting dates to Meeting format
    const formattedContactMeetings = (contacts || []).map(c => ({
      id: `contact-${c.id}`, // Prefix to avoid ID conflicts
      whitelabelId: c.whitelabel_id,
      sdrId: c.sdr_id || '',
      sdrName: c.sdr?.name,
      closerId: c.closer_id,
      closerName: c.closer?.name,
      contactId: c.id,
      dealId: undefined,
      title: `Reunião com ${c.name}${c.company ? ` - ${c.company}` : ''}`,
      scheduledAt: c.meeting_date,
      completedAt: undefined,
      status: 'scheduled' as const,
      convertedToSale: false,
      notes: c.notes,
      createdAt: c.created_at,
      updatedAt: c.updated_at
    }))

    // Merge both sources and sort by date
    const allMeetings = [...formattedMeetings, ...formattedContactMeetings]
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())

    return NextResponse.json(allMeetings)
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
