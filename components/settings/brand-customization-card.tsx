"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ColorPicker } from "@/components/color-picker"
import { Separator } from "@/components/ui/separator"
import { Palette, Eye, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BrandCustomizationCardProps {
  brandColor: string
  onBrandColorChange: (color: string) => void
}

export function BrandCustomizationCard({ brandColor, onBrandColorChange }: BrandCustomizationCardProps) {
  const presetColors = [
    { name: "Azul", value: "#3b82f6" },
    { name: "Roxo", value: "#8b5cf6" },
    { name: "Rosa", value: "#ec4899" },
    { name: "Verde", value: "#10b981" },
    { name: "Laranja", value: "#f59e0b" },
    { name: "Vermelho", value: "#ef4444" },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          <CardTitle>Personalização de Marca</CardTitle>
        </div>
        <CardDescription>Personalize a aparência do seu dashboard</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Picker */}
        <div className="space-y-4">
          <ColorPicker 
            label="Cor Principal da Marca" 
            value={brandColor} 
            onChange={onBrandColorChange} 
          />
          
          {/* Preset Colors */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Cores Predefinidas
            </Label>
            <div className="grid grid-cols-6 gap-3">
              {presetColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onBrandColorChange(color.value)}
                  className={`
                    relative group h-12 rounded-lg border-2 transition-all hover:scale-105
                    ${brandColor === color.value ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
                  `}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {brandColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full border-2 border-white shadow-lg" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Preview Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-3.5 w-3.5" />
            Pré-visualização
          </Label>
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            {/* Button Preview */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Botões:</p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  style={{ backgroundColor: brandColor }}
                  className="pointer-events-none"
                >
                  Botão Primary
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="pointer-events-none"
                  style={{ borderColor: brandColor, color: brandColor }}
                >
                  Botão Outline
                </Button>
              </div>
            </div>
            
            {/* Link Preview */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Links e destaques:</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: brandColor }} />
                <span className="text-sm" style={{ color: brandColor }}>
                  Links e elementos interativos usarão esta cor
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
          <p className="text-xs text-amber-900 dark:text-amber-100">
            <strong>💡 Dica:</strong> Escolha uma cor que combine com a identidade visual da sua marca. As alterações serão aplicadas imediatamente após salvar.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function Label({ children, className, ...props }: React.ComponentPropsWithoutRef<"label">) {
  return (
    <label className={className} {...props}>
      {children}
    </label>
  )
}
