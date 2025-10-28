import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getFacebookCredentialsByPageId } from "@/lib/supabase/facebook-credentials"

// GET - Facebook webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  console.log("Facebook webhook verification:", { mode, token, challenge })

  if (mode === "subscribe" && token) {
    // For now, accept any token (we'll validate against stored token if needed)
    // You can enhance this to check against the stored facebook_webhook_verify_token
    console.log("Webhook verified successfully")
    return new NextResponse(challenge, { status: 200 })
  }

  console.error("Webhook verification failed")
  return NextResponse.json({ error: "Verification failed" }, { status: 403 })
}

// POST - Receive leads from Facebook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Facebook webhook received:", JSON.stringify(body, null, 2))

    if (body.object !== "page") {
      console.log("Not a page object, ignoring")
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Use service role client for webhook operations (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    for (const entry of body.entry) {
      const pageId = entry.id
      console.log("Processing entry for page:", pageId)

      // Get whitelabel credentials for this page
      const result = await getFacebookCredentialsByPageId(supabase, pageId)
      if (!result) {
        console.error("No whitelabel found for page:", pageId)
        continue
      }

      console.log("Found whitelabel:", result.whitelabelId)

      for (const change of entry.changes) {
        if (change.field === "leadgen") {
          console.log("Processing leadgen change:", change.value)
          await processLead(
            supabase,
            result.whitelabelId,
            change.value,
            result.credentials.accessToken
          )
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Webhook error:", error)
    // Always return 200 to Facebook to avoid retry storms
    return NextResponse.json({ success: true }, { status: 200 })
  }
}

async function processLead(
  supabase: any,
  whitelabelId: string,
  leadData: any,
  accessToken: string
) {
  try {
    console.log("Fetching full lead data from Facebook:", leadData.leadgen_id)

    // Fetch full lead data from Facebook Graph API
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${leadData.leadgen_id}?access_token=${accessToken}`
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Facebook API error: ${response.status} ${errorText}`)
    }

    const fullData = await response.json()
    console.log("Full lead data from Facebook:", JSON.stringify(fullData, null, 2))

    // Extract fields from form data
    const fields: Record<string, string> = {}
    fullData.field_data?.forEach((f: any) => {
      const fieldName = f.name.toLowerCase().replace(/\s+/g, '_')
      fields[fieldName] = f.values[0]
    })

    console.log("Extracted fields:", fields)

    // Determine name from various possible field names
    const name =
      fields['full_name'] ||
      fields['nome_completo'] ||
      fields['nome'] ||
      fields['name'] ||
      'Lead sem nome'

    // Determine phone from various possible field names
    const phone =
      fields['phone'] ||
      fields['telefone'] ||
      fields['celular'] ||
      fields['whatsapp'] ||
      null

    // Determine email
    const email = fields['email'] || fields['e-mail'] || null

    // Determine company
    const company =
      fields['company'] ||
      fields['empresa'] ||
      fields['company_name'] ||
      null

    console.log("Creating contact with:", { name, email, phone, company })

    // Create contact with fixed rules: funnel_stage = "new_lead", lead_source = "inbound"
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .insert({
        whitelabel_id: whitelabelId,
        name,
        email,
        phone,
        company,
        funnel_stage: "new_lead",  // Fixed status
        lead_source: "inbound",    // Fixed source
      })
      .select()
      .single()

    if (contactError) {
      console.error("Error creating contact:", contactError)
      throw contactError
    }

    console.log("Contact created successfully:", contact.id)

    // Save to facebook_leads tracking table
    const { error: trackingError } = await supabase
      .from("facebook_leads")
      .insert({
        whitelabel_id: whitelabelId,
        contact_id: contact?.id,
        facebook_lead_id: fullData.id,
        page_id: leadData.page_id,
        form_id: leadData.form_id,
        ad_id: leadData.ad_id,
        form_data: fields,
        processed: true,
        processed_at: new Date().toISOString(),
      })

    if (trackingError) {
      console.error("Error saving to facebook_leads:", trackingError)
      // Don't throw - contact was created successfully
    } else {
      console.log("Facebook lead tracked successfully")
    }

  } catch (error: any) {
    console.error("Error processing lead:", error)

    // Save error to facebook_leads table
    try {
      await supabase.from("facebook_leads").insert({
        whitelabel_id: whitelabelId,
        facebook_lead_id: leadData.leadgen_id,
        page_id: leadData.page_id,
        form_id: leadData.form_id,
        ad_id: leadData.ad_id,
        processed: false,
        error_message: error.message || String(error),
      })
    } catch (trackingError) {
      console.error("Error saving error to facebook_leads:", trackingError)
    }
  }
}
