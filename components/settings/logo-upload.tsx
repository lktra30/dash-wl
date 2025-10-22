"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"
import Image from "next/image"

interface LogoUploadProps {
  currentLogoUrl?: string | null
  onLogoChange: (logoUrl: string | null) => void
  disabled?: boolean
}

// Recommended dimensions for logo
const MIN_DIMENSION = 200 // Minimum 200x200px
const MAX_DIMENSION = 1024 // Maximum 1024x1024px
const RECOMMENDED_DIMENSION = 512 // Recommended 512x512px

/**
 * Validates image dimensions
 * Returns Promise with validation result
 */
const validateImageDimensions = (file: File): Promise<{ valid: boolean; width: number; height: number; error?: string }> => {
  return new Promise((resolve) => {
    // SVG files don't need dimension validation (vector graphics)
    if (file.type === "image/svg+xml") {
      resolve({ valid: true, width: 0, height: 0 })
      return
    }

    const img = new window.Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img

      // Check if image is square
      if (width !== height) {
        resolve({
          valid: false,
          width,
          height,
          error: `A imagem deve ser quadrada. Dimensões atuais: ${width}x${height}px`
        })
        return
      }

      // Check minimum dimensions
      if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        resolve({
          valid: false,
          width,
          height,
          error: `A imagem é muito pequena. Mínimo: ${MIN_DIMENSION}x${MIN_DIMENSION}px. Dimensões atuais: ${width}x${height}px`
        })
        return
      }

      // Check maximum dimensions
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        resolve({
          valid: false,
          width,
          height,
          error: `A imagem é muito grande. Máximo: ${MAX_DIMENSION}x${MAX_DIMENSION}px. Dimensões atuais: ${width}x${height}px`
        })
        return
      }

      resolve({ valid: true, width, height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({
        valid: false,
        width: 0,
        height: 0,
        error: "Não foi possível ler as dimensões da imagem"
      })
    }

    img.src = url
  })
}

export function LogoUpload({ currentLogoUrl, onLogoChange, disabled }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"]
    if (!validTypes.includes(file.type)) {
      alert("Tipo de arquivo inválido. Use apenas JPEG, PNG, SVG ou WebP")
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert("Arquivo muito grande. O tamanho máximo é 5MB")
      return
    }

    // Validate image dimensions (except for SVG)
    const dimensionValidation = await validateImageDimensions(file)
    if (!dimensionValidation.valid) {
      alert(dimensionValidation.error || "Dimensões da imagem inválidas")
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("logo", file)

      const response = await fetch("/api/settings/whitelabel/upload-logo", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao fazer upload da logo")
      }

      const { logoUrl } = await response.json()
      setPreviewUrl(logoUrl)
      onLogoChange(logoUrl)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Falha ao fazer upload da logo")
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveLogo = async () => {
    if (!previewUrl) return

    setIsUploading(true)

    try {
      const response = await fetch("/api/settings/whitelabel/upload-logo", {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao remover a logo")
      }

      setPreviewUrl(null)
      onLogoChange(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Falha ao remover a logo")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Label>Logo do Negócio</Label>
      
      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="flex-shrink-0">
          <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden">
            {previewUrl ? (
              <div className="relative w-full h-full">
                <Image
                  src={previewUrl}
                  alt="Logo preview"
                  fill
                  className="object-contain p-2"
                  unoptimized={previewUrl.endsWith('.svg')}
                />
              </div>
            ) : (
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Faça upload da logo do seu negócio em formato quadrado.
            </p>
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 space-y-1">
              <p><strong>Formatos aceitos:</strong> JPEG, PNG, SVG, WebP</p>
              <p><strong>Tamanho máximo:</strong> 5MB</p>
              <p><strong>Formato:</strong> Quadrado (mesma largura e altura)</p>
              <p><strong>Resolução mínima:</strong> {MIN_DIMENSION}x{MIN_DIMENSION}px</p>
              <p><strong>Resolução máxima:</strong> {MAX_DIMENSION}x{MAX_DIMENSION}px</p>
              <p className="text-primary"><strong>Recomendado:</strong> {RECOMMENDED_DIMENSION}x{RECOMMENDED_DIMENSION}px para melhor qualidade</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fazendo upload...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {previewUrl ? "Alterar Logo" : "Fazer Upload"}
                </>
              )}
            </Button>

            {previewUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveLogo}
                disabled={disabled || isUploading}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Remover
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/svg+xml,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}
