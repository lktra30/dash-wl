"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Building2, Globe, TrendingUp, Image as ImageIcon } from "lucide-react"
import { LogoUpload } from "./logo-upload"

interface BusinessSettingsCardProps {
  whitelabelName: string
  onWhitelabelNameChange: (name: string) => void
  domain: string
  onDomainChange: (domain: string) => void
  businessModel: "TCV" | "MRR"
  onBusinessModelChange: (model: "TCV" | "MRR") => void
  logoUrl?: string | null
  onLogoChange: (logoUrl: string | null) => void
}

export function BusinessSettingsCard({
  whitelabelName,
  onWhitelabelNameChange,
  domain,
  onDomainChange,
  businessModel,
  onBusinessModelChange,
  logoUrl,
  onLogoChange
}: BusinessSettingsCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          <CardTitle>Configurações do Negócio</CardTitle>
        </div>
        <CardDescription>Configure sua empresa e modelo de receita</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="h-3.5 w-3.5" />
            Logo da Empresa
          </Label>
          <LogoUpload 
            currentLogoUrl={logoUrl}
            onLogoChange={onLogoChange}
          />
        </div>

        <Separator />

        {/* Business Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whitelabel-name" className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" />
              Nome do Dashboard
            </Label>
            <Input
              id="whitelabel-name"
              value={whitelabelName}
              onChange={(e) => onWhitelabelNameChange(e.target.value)}
              placeholder="Digite o nome do seu dashboard"
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              Este nome aparecerá no título e cabeçalho do dashboard
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain" className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              Domínio Personalizado
            </Label>
            <Input
              id="domain"
              value={domain}
              onChange={(e) => onDomainChange(e.target.value)}
              placeholder="dashboard.seusite.com"
              className="font-mono text-sm"
            />
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>💡 Dica:</strong> Configure o DNS apontando para o Vercel após salvar. Este domínio será usado para o favicon dinâmico.
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Business Model Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            Modelo de Negócio
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* MRR Option */}
            <div
              onClick={() => onBusinessModelChange("MRR")}
              className={`
                relative flex flex-col gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all
                ${
                  businessModel === "MRR"
                    ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                }
              `}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                    ${businessModel === "MRR" ? "border-primary bg-primary" : "border-muted-foreground"}
                  `}
                >
                  {businessModel === "MRR" && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="font-semibold text-sm">MRR</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Receita Recorrente Mensal - ideal para modelos de assinatura
              </p>
            </div>

            {/* TCV Option */}
            <div
              onClick={() => onBusinessModelChange("TCV")}
              className={`
                relative flex flex-col gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all
                ${
                  businessModel === "TCV"
                    ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                }
              `}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                    ${businessModel === "TCV" ? "border-primary bg-primary" : "border-muted-foreground"}
                  `}
                >
                  {businessModel === "TCV" && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="font-semibold text-sm">TCV</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Valor Total do Contrato - ideal para vendas únicas de alto valor
              </p>
            </div>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg border">
            <p className="text-xs text-muted-foreground">
              <strong>📊 Importante:</strong> Esta configuração afeta como as métricas de receita são calculadas em todo o dashboard.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
