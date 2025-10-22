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
      .select("whitelabel_id")
      .eq("email", authUser.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const status = searchParams.get("status") || "active"

    // Build the query with team information
    let query = supabase
      .from("employees")
      .select(`
        id, 
        name, 
        email, 
        phone, 
        role, 
        department, 
        status, 
        avatar_url, 
        team_id,
        user_role,
        hire_date,
        current_team:teams(id, name, color)
      `)
      .eq("whitelabel_id", user.whitelabel_id)
      .eq("status", status)
      .order("name", { ascending: true })

    // Filter by role if provided
    // Handle "SDR/Closer" format - if filtering by SDR or Closer, include employees with "SDR/Closer"
    if (role) {
      if (role === "SDR" || role === "Closer") {
        query = query.or(`role.eq.${role},role.eq.SDR/Closer`)
      } else {
        query = query.eq("role", role)
      }
    }

    const { data: employees, error: employeesError } = await query

    if (employeesError) {
      console.error("Error fetching employees:", employeesError)
      return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
    }

    return NextResponse.json(employees || [])
  } catch (error) {
    console.error("Error fetching employees:", error)
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

    // Get the user's information
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("whitelabel_id, role")
      .eq("email", authUser.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, email, phone, role, department, hire_date, status, avatar_url, user_role } = body

    if (!name || !email || !role || !department) {
      return NextResponse.json({ error: "Name, email, role, and department are required" }, { status: 400 })
    }

    // Create the employee
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .insert({
        whitelabel_id: user.whitelabel_id,
        name,
        email,
        phone: phone || null,
        role,
        department,
        hire_date: hire_date || new Date().toISOString().split("T")[0],
        status: status || "active",
        avatar_url: avatar_url || null,
        user_role: user_role || "colaborador",
      })
      .select()
      .single()

    if (employeeError) {
      console.error("Error creating employee:", employeeError)
      return NextResponse.json({ error: "Failed to create employee" }, { status: 500 })
    }

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error("Error creating employee:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
