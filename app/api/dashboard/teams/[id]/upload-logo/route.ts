import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(
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
      .select("*, whitelabel_id")
      .eq("email", authUser.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const teamId = params.id

    // Verify team belongs to user's whitelabel
    const { data: existingTeam, error: teamError } = await supabase
      .from("teams")
      .select("*, logo_url")
      .eq("id", teamId)
      .eq("whitelabel_id", user.whitelabel_id)
      .single()

    if (teamError || !existingTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Get the file from the request
    const formData = await request.formData()
    const file = formData.get("logo") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, SVG, and WebP are allowed" }, { status: 400 })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB" }, { status: 400 })
    }

    // Delete old logo if exists
    if (existingTeam.logo_url) {
      const oldLogoPath = existingTeam.logo_url.split('/').pop()
      if (oldLogoPath) {
        await supabase.storage
          .from("team-logos")
          .remove([oldLogoPath])
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${teamId}-${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("team-logos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Error uploading logo:", uploadError)
      return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("team-logos")
      .getPublicUrl(fileName)

    // Update team with new logo URL
    const { data: updatedTeam, error: updateError } = await supabase
      .from("teams")
      .update({ 
        logo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", teamId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating team with logo URL:", updateError)
      // Try to clean up uploaded file
      await supabase.storage.from("team-logos").remove([fileName])
      return NextResponse.json({ error: "Failed to update team with logo" }, { status: 500 })
    }

    return NextResponse.json({
      logoUrl: publicUrl,
      message: "Logo uploaded successfully",
    })
  } catch (error) {
    console.error("Error uploading team logo:", error)
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
      .select("*, whitelabel_id")
      .eq("email", authUser.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const teamId = params.id

    // Verify team belongs to user's whitelabel
    const { data: existingTeam, error: teamError } = await supabase
      .from("teams")
      .select("*, logo_url")
      .eq("id", teamId)
      .eq("whitelabel_id", user.whitelabel_id)
      .single()

    if (teamError || !existingTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    if (!existingTeam.logo_url) {
      return NextResponse.json({ error: "Team has no logo" }, { status: 404 })
    }

    // Delete logo from storage
    const logoPath = existingTeam.logo_url.split('/').pop()
    if (logoPath) {
      const { error: deleteError } = await supabase.storage
        .from("team-logos")
        .remove([logoPath])

      if (deleteError) {
        console.error("Error deleting logo from storage:", deleteError)
      }
    }

    // Update team to remove logo URL
    const { error: updateError } = await supabase
      .from("teams")
      .update({ 
        logo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", teamId)

    if (updateError) {
      console.error("Error updating team:", updateError)
      return NextResponse.json({ error: "Failed to remove logo from team" }, { status: 500 })
    }

    return NextResponse.json({ message: "Logo deleted successfully" })
  } catch (error) {
    console.error("Error deleting team logo:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
