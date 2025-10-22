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
      .select("funnel_stage")
      .eq("whitelabel_id", user.whitelabel_id)

    if (contactsError) {
      console.error("Error fetching contacts:", contactsError)
      return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
    }

    // Process CUMULATIVE funnel statistics:
    // Um lead persiste em todas as etapas que ele passou
    // 
    // Lógica cumulativa:
    // 1. Novo Lead = TODOS os contatos (independente do status)
    // 2. Em Contato = contacted + meeting + negotiation + won + lost
    // 3. Reunião = meeting + negotiation + won + lost
    // 4. Fechado = won
    // 5. Perdido = lost
    
    const totalLeads = contacts?.length || 0
    
    // Em Contato: todos que avançaram da etapa inicial
    const emContato = contacts?.filter(c => 
      c.funnel_stage === 'contacted' || 
      c.funnel_stage === 'meeting' || 
      c.funnel_stage === 'negotiation' || 
      c.funnel_stage === 'won' || 
      c.funnel_stage === 'lost'
    ).length || 0
    
    // Reunião: todos que chegaram à etapa de reunião (incluindo os que avançaram além)
    const reuniao = contacts?.filter(c => 
      c.funnel_stage === 'meeting' || 
      c.funnel_stage === 'negotiation' || 
      c.funnel_stage === 'won' || 
      c.funnel_stage === 'lost'
    ).length || 0
    
    // Fechado: apenas os que ganharam
    const fechado = contacts?.filter(c => c.funnel_stage === 'won').length || 0
    
    // Perdido: apenas os que perderam
    const perdido = contacts?.filter(c => c.funnel_stage === 'lost').length || 0
    
    const funnelStats = {
      // Total de leads no sistema
      novoLead: totalLeads,
      
      // Leads que foram contatados (cumulativo)
      emContato: emContato,
      
      // Leads que chegaram à reunião (cumulativo)
      reuniao: reuniao,
      
      // Negócios ganhos
      fechado: fechado,
      
      // Negócios perdidos
      perdido: perdido,
    }

    return NextResponse.json(funnelStats)
  } catch (error) {
    console.error("Error calculating funnel stats:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
