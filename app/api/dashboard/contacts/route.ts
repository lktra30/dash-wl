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

    // Get contacts for this whitelabel
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("*")
      .eq("whitelabel_id", user.whitelabel_id)
      .order("created_at", { ascending: false })

    if (contactsError) {
      console.error("Error fetching contacts:", contactsError)
      return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
    }

    // Transform database fields to camelCase
    const transformedContacts = (contacts || []).map((contact: any) => ({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      status: contact.funnel_stage,
      leadSource: contact.lead_source,
      whitelabelId: contact.whitelabel_id,
      assignedTo: contact.assigned_to,
      dealValue: contact.deal_value,
      dealDuration: contact.deal_duration,
      sdrId: contact.sdr_id,
      closerId: contact.closer_id,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at,
    }))

    return NextResponse.json(transformedContacts)
  } catch (error) {
    console.error("Error fetching contacts:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // Validação: SDR e Closer são obrigatórios apenas para vendas realizadas (status "won")
    if (body.status === "won") {
      if (!body.sdrId) {
        return NextResponse.json({
          error: "SDR é obrigatório. Por favor, selecione um SDR para realizar a venda."
        }, { status: 400 })
      }

      if (!body.closerId) {
        return NextResponse.json({
          error: "Closer é obrigatório. Por favor, selecione um Closer para realizar a venda."
        }, { status: 400 })
      }
    }

    // Transform camelCase to database snake_case
    const contactData = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      funnel_stage: body.status,
      lead_source: body.leadSource,
      whitelabel_id: user.whitelabel_id,
      sdr_id: body.sdrId,
      closer_id: body.closerId,
    }

    // Create the contact
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .insert(contactData)
      .select()
      .single()

    if (contactError) {
      console.error("Error creating contact:", contactError)
      return NextResponse.json({ error: "Failed to create contact" }, { status: 500 })
    }

    // Transform back to camelCase
    const transformedContact = {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      status: contact.funnel_stage,
      leadSource: contact.lead_source,
      whitelabelId: contact.whitelabel_id,
      assignedTo: contact.assigned_to,
      sdrId: contact.sdr_id,
      closerId: contact.closer_id,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at,
    }

    return NextResponse.json(transformedContact, { status: 201 })
  } catch (error) {
    console.error("Error creating contact:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Contact ID is required" }, { status: 400 })
    }

    // Validação: SDR e Closer são obrigatórios apenas para vendas realizadas (status "won")
    if (updates.status === "won") {
      if (!updates.sdrId) {
        return NextResponse.json({
          error: "SDR é obrigatório. Por favor, selecione um SDR para realizar a venda."
        }, { status: 400 })
      }

      if (!updates.closerId) {
        return NextResponse.json({
          error: "Closer é obrigatório. Por favor, selecione um Closer para realizar a venda."
        }, { status: 400 })
      }
    }

    // Transform camelCase to database snake_case
    const updateData: any = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.email !== undefined) updateData.email = updates.email
    if (updates.phone !== undefined) updateData.phone = updates.phone
    if (updates.company !== undefined) updateData.company = updates.company
    if (updates.status !== undefined) updateData.funnel_stage = updates.status
    if (updates.leadSource !== undefined) updateData.lead_source = updates.leadSource
    if (updates.dealValue !== undefined) updateData.deal_value = updates.dealValue
    if (updates.dealDuration !== undefined) updateData.deal_duration = updates.dealDuration
    if (updates.sdrId !== undefined) updateData.sdr_id = updates.sdrId
    if (updates.closerId !== undefined) updateData.closer_id = updates.closerId

    // Update the contact
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .update(updateData)
      .eq("id", id)
      .eq("whitelabel_id", user.whitelabel_id)
      .select()
      .single()

    if (contactError) {
      console.error("Error updating contact:", contactError)
      return NextResponse.json({ error: "Failed to update contact" }, { status: 500 })
    }

    // Transform back to camelCase
    const transformedContact = {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      status: contact.funnel_stage,
      leadSource: contact.lead_source,
      whitelabelId: contact.whitelabel_id,
      assignedTo: contact.assigned_to,
      dealValue: contact.deal_value,
      dealDuration: contact.deal_duration,
      sdrId: contact.sdr_id,
      closerId: contact.closer_id,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at,
    }

    return NextResponse.json(transformedContact)
  } catch (error) {
    console.error("Error updating contact:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
