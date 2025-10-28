"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ColorPicker } from "@/components/color-picker"
import { Palette } from "lucide-react"

interface BrandCustomizationCardProps {
  brandColor: string
  onBrandColorChange: (color: string) => void
}

export function BrandCustomizationCard({ brandColor, onBrandColorChange }: BrandCustomizationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Personalização de Marca
        </CardTitle>
        <CardDescription>Personalize a aparência do seu CRM</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ColorPicker label="Cor da Marca" value={brandColor} onChange={onBrandColorChange} />
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground mb-2">Pré-visualização:</p>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: brandColor }} />
            <span className="text-sm">Esta cor será usada para botões, links e destaques</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
