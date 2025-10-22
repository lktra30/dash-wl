"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2 } from "lucide-react"
import { LogoUpload } from "./logo-upload"

interface BusinessSettingsCardProps {
  whitelabelName: string
  onWhitelabelNameChange: (name: string) => void
  businessModel: "TCV" | "MRR"
  onBusinessModelChange: (model: "TCV" | "MRR") => void
  logoUrl?: string | null
  onLogoChange: (logoUrl: string | null) => void
}

export function BusinessSettingsCard({ 
  whitelabelName, 
  onWhitelabelNameChange,
  businessModel, 
  onBusinessModelChange,
  logoUrl,
  onLogoChange
}: BusinessSettingsCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Configurações do Negócio
        </CardTitle>
        <CardDescription>Configure seu negócio e modelo de receita</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload */}
        <LogoUpload 
          currentLogoUrl={logoUrl}
          onLogoChange={onLogoChange}
        />

        {/* Dashboard Name */}
        <div className="space-y-2">
          <Label htmlFor="whitelabel-name">Nome do Dashboard</Label>
          <Input
            id="whitelabel-name"
            value={whitelabelName}
            onChange={(e) => onWhitelabelNameChange(e.target.value)}
            placeholder="Digite o nome do seu dashboard"
          />
        </div>

        {/* Business Model */}
        <div className="space-y-3">
          <Label>Modelo de Negócio</Label>
          <div className="grid grid-cols-2 gap-3">
            {/* MRR Option */}
            <div
              onClick={() => onBusinessModelChange("MRR")}
              className={`
                relative flex flex-col gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all
                ${
                  businessModel === "MRR"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                }
              `}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${businessModel === "MRR" ? "border-primary" : "border-muted-foreground"}
                  `}
                >
                  {businessModel === "MRR" && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <Label className="font-semibold cursor-pointer text-sm">MRR</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Receita Recorrente Mensal
              </p>
            </div>

            {/* TCV Option */}
            <div
              onClick={() => onBusinessModelChange("TCV")}
              className={`
                relative flex flex-col gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all
                ${
                  businessModel === "TCV"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                }
              `}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${businessModel === "TCV" ? "border-primary" : "border-muted-foreground"}
                  `}
                >
                  {businessModel === "TCV" && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <Label className="font-semibold cursor-pointer text-sm">TCV</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Valor Total do Contrato
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
            <strong>Nota:</strong> Esta configuração afeta como as métricas de receita são calculadas em todo o dashboard.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
