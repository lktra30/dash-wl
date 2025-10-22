import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getUserRoleWithFallback, hasSettingsAccess } from "@/lib/permissions"

// Image dimension constraints
const MIN_DIMENSION = 200 // Minimum 200x200px
const MAX_DIMENSION = 1024 // Maximum 1024x1024px

/**
 * Validates image dimensions from buffer (for PNG and JPEG)
 * Returns { valid: boolean, width?: number, height?: number, error?: string }
 */
async function validateImageDimensions(file: File): Promise<{ valid: boolean; width?: number; height?: number; error?: string }> {
  // SVG files don't need dimension validation
  if (file.type === "image/svg+xml") {
    return { valid: true }
  }

  try {
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)

    let width = 0
    let height = 0

    // Parse PNG dimensions
    if (file.type === "image/png") {
      // PNG signature: 89 50 4E 47 0D 0A 1A 0A
      // IHDR chunk starts at byte 16, width at 16-19, height at 20-23
      if (uint8Array.length > 24) {
        width = (uint8Array[16] << 24) | (uint8Array[17] << 16) | (uint8Array[18] << 8) | uint8Array[19]
        height = (uint8Array[20] << 24) | (uint8Array[21] << 16) | (uint8Array[22] << 8) | uint8Array[23]
      }
    }
    // Parse JPEG dimensions
    else if (file.type === "image/jpeg") {
      let offset = 2 // Skip SOI marker
      while (offset < uint8Array.length) {
        // Check for SOF marker (0xFFC0 - 0xFFC3)
        if (uint8Array[offset] === 0xFF && (uint8Array[offset + 1] >= 0xC0 && uint8Array[offset + 1] <= 0xC3)) {
          height = (uint8Array[offset + 5] << 8) | uint8Array[offset + 6]
          width = (uint8Array[offset + 7] << 8) | uint8Array[offset + 8]
          break
        }
        // Skip to next marker
        if (uint8Array[offset] === 0xFF) {
          const markerLength = (uint8Array[offset + 2] << 8) | uint8Array[offset + 3]
          offset += markerLength + 2
        } else {
          offset++
        }
      }
    }
    // Parse WebP dimensions
    else if (file.type === "image/webp") {
      // WebP format is more complex, skip validation for now
      // In production, use a proper image processing library like sharp
      return { valid: true }
    }

    if (width === 0 || height === 0) {
      return { valid: false, error: "Could not read image dimensions" }
    }

    // Check if image is square
    if (width !== height) {
      return {
        valid: false,
        width,
        height,
        error: `Image must be square. Current dimensions: ${width}x${height}px`
      }
    }

    // Check minimum dimensions
    if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
      return {
        valid: false,
        width,
        height,
        error: `Image is too small. Minimum: ${MIN_DIMENSION}x${MIN_DIMENSION}px. Current: ${width}x${height}px`
      }
    }

    // Check maximum dimensions
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      return {
        valid: false,
        width,
        height,
        error: `Image is too large. Maximum: ${MAX_DIMENSION}x${MAX_DIMENSION}px. Current: ${width}x${height}px`
      }
    }

    return { valid: true, width, height }
  } catch (error) {
    console.error("[ValidateImageDimensions] Error:", error)
    return { valid: false, error: "Failed to validate image dimensions" }
  }
}

// POST - Upload logo
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
      .select("*, whitelabel_id")
      .eq("email", authUser.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user role with fallback (employee table or users table)
    const userRole = await getUserRoleWithFallback(authUser.email!, user)

    // Verify permission to upload logo (admin or SuperAdmin only)
    if (!hasSettingsAccess(userRole)) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem alterar o logo." }, 
        { status: 403 }
      )
    }

    // Get the whitelabel
    const { data: whitelabel, error: whitelabelError } = await supabase
      .from("whitelabels")
      .select("id, logo_url")
      .eq("id", user.whitelabel_id)
      .single()

    if (whitelabelError || !whitelabel) {
      return NextResponse.json({ error: "Whitelabel not found" }, { status: 404 })
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
      return NextResponse.json({ 
        error: "Invalid file type. Only JPEG, PNG, SVG, and WebP are allowed" 
      }, { status: 400 })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 5MB" 
      }, { status: 400 })
    }

    // Validate image dimensions (square format required)
    const dimensionValidation = await validateImageDimensions(file)
    if (!dimensionValidation.valid) {
      return NextResponse.json({ 
        error: dimensionValidation.error || "Invalid image dimensions" 
      }, { status: 400 })
    }

    // Generate filename - always use 'logo' as the base name
    // Structure: Images/{whitelabel_id}/logo.{ext}
    // Each whitelabel has only ONE logo, so we use a fixed name
    // The upsert option will automatically replace the old logo
    const fileExt = file.name.split('.').pop()
    const fileName = `logo.${fileExt}`
    const filePath = `${whitelabel.id}/${fileName}`

    // Upload to Supabase Storage with upsert to replace existing logo
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("Images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true, // Replace existing logo if it exists
      })

    if (uploadError) {
      console.error("[UploadLogo] Error uploading logo:", uploadError)
      return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("Images")
      .getPublicUrl(filePath)

    // Update whitelabel with new logo URL
    const { error: updateError } = await supabase
      .from("whitelabels")
      .update({
        logo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", whitelabel.id)

    if (updateError) {
      console.error("[UploadLogo] Error updating whitelabel:", updateError)
      
      // Try to cleanup uploaded file
      await supabase.storage
        .from("Images")
        .remove([filePath])
      
      return NextResponse.json({ error: "Failed to update whitelabel" }, { status: 500 })
    }

    console.log("[UploadLogo] Successfully uploaded logo for whitelabel:", whitelabel.id)

    return NextResponse.json({ 
      logoUrl: publicUrl,
      message: "Logo uploaded successfully" 
    })
  } catch (error) {
    console.error("[UploadLogo] Unexpected error:", error)
    return NextResponse.json({ 
      error: "An unexpected error occurred" 
    }, { status: 500 })
  }
}

// DELETE - Remove logo
export async function DELETE(request: NextRequest) {
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

    // Get user role with fallback (employee table or users table)
    const userRole = await getUserRoleWithFallback(authUser.email!, user)

    // Verify permission to delete logo (admin or SuperAdmin only)
    if (!hasSettingsAccess(userRole)) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem remover o logo." }, 
        { status: 403 }
      )
    }

    // Get the whitelabel
    const { data: whitelabel, error: whitelabelError } = await supabase
      .from("whitelabels")
      .select("id, logo_url")
      .eq("id", user.whitelabel_id)
      .single()

    if (whitelabelError || !whitelabel) {
      return NextResponse.json({ error: "Whitelabel not found" }, { status: 404 })
    }

    if (!whitelabel.logo_url) {
      return NextResponse.json({ error: "No logo to remove" }, { status: 400 })
    }

    // Delete logo from storage
    const urlParts = whitelabel.logo_url.split('/storage/v1/object/public/Images/')
    if (urlParts.length > 1) {
      const logoPath = urlParts[1]
      const { error: deleteError } = await supabase.storage
        .from("Images")
        .remove([logoPath])

      if (deleteError) {
        console.error("[RemoveLogo] Error deleting logo:", deleteError)
        // Continue even if deletion fails
      }
    }

    // Update whitelabel to remove logo URL
    const { error: updateError } = await supabase
      .from("whitelabels")
      .update({
        logo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", whitelabel.id)

    if (updateError) {
      console.error("[RemoveLogo] Error updating whitelabel:", updateError)
      return NextResponse.json({ error: "Failed to update whitelabel" }, { status: 500 })
    }

    console.log("[RemoveLogo] Successfully removed logo for whitelabel:", whitelabel.id)

    return NextResponse.json({ 
      message: "Logo removed successfully" 
    })
  } catch (error) {
    console.error("[RemoveLogo] Unexpected error:", error)
    return NextResponse.json({ 
      error: "An unexpected error occurred" 
    }, { status: 500 })
  }
}
