import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const employeeId = params.id

    // Get the employee
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .eq("whitelabel_id", user.whitelabel_id)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error("Error fetching employee:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const employeeId = params.id
    const body = await request.json()
    const { name, email, phone, role, department, hire_date, status, avatar_url, user_role } = body

    // Verify employee belongs to user's whitelabel
    const { data: existingEmployee, error: checkError } = await supabase
      .from("employees")
      .select("id")
      .eq("id", employeeId)
      .eq("whitelabel_id", user.whitelabel_id)
      .single()

    if (checkError || !existingEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) updates.name = name
    if (email !== undefined) updates.email = email
    if (phone !== undefined) updates.phone = phone
    if (role !== undefined) updates.role = role
    if (department !== undefined) updates.department = department
    if (hire_date !== undefined) updates.hire_date = hire_date
    if (status !== undefined) updates.status = status
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (user_role !== undefined) updates.user_role = user_role

    // Update the employee
    const { data: employee, error: updateError } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", employeeId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating employee:", updateError)
      return NextResponse.json({ error: "Failed to update employee" }, { status: 500 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error("Error updating employee:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const employeeId = params.id

    // Verify employee belongs to user's whitelabel
    const { data: existingEmployee, error: checkError } = await supabase
      .from("employees")
      .select("id")
      .eq("id", employeeId)
      .eq("whitelabel_id", user.whitelabel_id)
      .single()

    if (checkError || !existingEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Delete the employee
    const { error: deleteError } = await supabase
      .from("employees")
      .delete()
      .eq("id", employeeId)

    if (deleteError) {
      console.error("Error deleting employee:", deleteError)
      return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 })
    }

    return NextResponse.json({ message: "Employee deleted successfully" })
  } catch (error) {
    console.error("Error deleting employee:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
