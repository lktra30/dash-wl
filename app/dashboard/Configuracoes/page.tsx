"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "@/hooks/use-theme"
import { useState, useEffect } from "react"
import { Save, Loader2, User, Building2, Plug, Palette, CheckCircle2, AlertCircle } from "lucide-react"
import {
  UserProfileCard,
  BrandCustomizationCard,
  ApiKeysCard,
  BusinessSettingsCard,
  ChangePasswordCard,
} from "@/components/settings"

export default function SettingsPage() {
  const { user, whitelabel } = useAuth()
  const { brandColor, setBrandColor } = useTheme()
  
  // State
  const [whitelabelName, setWhitelabelName] = useState("")
  const [domain, setDomain] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [tempBrandColor, setTempBrandColor] = useState(brandColor)
  const [businessModel, setBusinessModel] = useState<"TCV" | "MRR">("MRR")
  const [metaAdsKey, setMetaAdsKey] = useState("")
  const [googleAdsKey, setGoogleAdsKey] = useState("")
  const [metaAdsAccountId, setMetaAdsAccountId] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (whitelabel) {
      setWhitelabelName(whitelabel.name)
      setDomain((whitelabel as any).domain || "")
      setLogoUrl(whitelabel.logoUrl || null)
      setTempBrandColor(whitelabel.brandColor || brandColor)
      setBusinessModel(whitelabel.businessModel || "MRR")
      setMetaAdsAccountId(whitelabel.metaAdsAccountId || "")
    }
  }, [whitelabel, brandColor])

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const response = await fetch("/api/settings/whitelabel", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: whitelabelName,
          domain: domain,
          brandColor: tempBrandColor,
          businessModel,
          metaAdsAccountId,
          ...(metaAdsKey && { metaAdsKey }),
          ...(googleAdsKey && { googleAdsKey }),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao salvar configurações")
      }

      // Update the brand color in the theme
      setBrandColor(tempBrandColor)

      // Clear API key inputs after successful save
      setMetaAdsKey("")
      setGoogleAdsKey("")

      // Reload to get updated whitelabel data
      window.location.reload()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Falha ao salvar configurações")
    } finally {
      setIsSaving(false)
    }
  }

  if (!user || !whitelabel) return null

  // Count configured integrations
  const integrationsConfigured = [
    whitelabel.metaAdsConfigured,
    whitelabel.googleAdsConfigured,
    whitelabel.facebookConfigured,
  ].filter(Boolean).length

  const totalIntegrations = 3

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <DashboardHeader 
          title="Configurações" 
          description="Gerencie as configurações do seu dashboard e integrações"
        />

        <div className="flex-1 overflow-hidden p-6">
          <div className="h-full flex flex-col gap-6 max-w-6xl mx-auto overflow-x-hidden">
            <Tabs defaultValue="perfil" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                <TabsTrigger value="perfil" className="flex items-center gap-2 py-3">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Perfil</span>
                </TabsTrigger>
                <TabsTrigger value="negocio" className="flex items-center gap-2 py-3">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Negócio</span>
                </TabsTrigger>
                <TabsTrigger value="integracoes" className="flex items-center gap-2 py-3">
                  <Plug className="h-4 w-4" />
                  <span className="hidden sm:inline">Integrações</span>
                  {integrationsConfigured > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {integrationsConfigured}/{totalIntegrations}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="personalizacao" className="flex items-center gap-2 py-3">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Personalização</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-auto mt-6">
                <TabsContent value="perfil" className="m-0 h-full overflow-x-hidden">
                  <div className="max-w-3xl mx-auto space-y-6">
                    <UserProfileCard user={user} />
                    <ChangePasswordCard />
                  </div>
                </TabsContent>

                <TabsContent value="negocio" className="m-0 h-full overflow-x-hidden">
                  <div className="max-w-3xl mx-auto">
                    <BusinessSettingsCard
                      whitelabelName={whitelabelName}
                      onWhitelabelNameChange={setWhitelabelName}
                      domain={domain}
                      onDomainChange={setDomain}
                      businessModel={businessModel}
                      onBusinessModelChange={setBusinessModel}
                      logoUrl={logoUrl}
                      onLogoChange={setLogoUrl}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="integracoes" className="m-0 h-full overflow-x-hidden">
                  <div className="max-w-4xl mx-auto space-y-4">
                    {/* Status Header */}
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
                      {integrationsConfigured === totalIntegrations ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">Todas as integrações configuradas</p>
                            <p className="text-sm text-muted-foreground">
                              Suas APIs estão conectadas e funcionando
                            </p>
                          </div>
                        </>
                      ) : integrationsConfigured > 0 ? (
                        <>
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="font-medium">
                              {integrationsConfigured} de {totalIntegrations} integrações configuradas
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Configure as APIs restantes para aproveitar todos os recursos
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="font-medium">Nenhuma integração configurada</p>
                            <p className="text-sm text-muted-foreground">
                              Conecte suas contas de anúncios para visualizar métricas
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <ApiKeysCard
                      metaAdsConfigured={whitelabel.metaAdsConfigured || false}
                      googleAdsConfigured={whitelabel.googleAdsConfigured || false}
                      facebookConfigured={whitelabel.facebookConfigured || false}
                      metaAdsAccountId={metaAdsAccountId}
                      facebookPageId={whitelabel.facebookPageId}
                      onMetaAdsKeyChange={setMetaAdsKey}
                      onGoogleAdsKeyChange={setGoogleAdsKey}
                      onMetaAdsAccountIdChange={setMetaAdsAccountId}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="personalizacao" className="m-0 h-full overflow-x-hidden">
                  <div className="max-w-3xl mx-auto">
                    <BrandCustomizationCard 
                      brandColor={tempBrandColor}
                      onBrandColorChange={setTempBrandColor}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {/* Save Button - Fixed at bottom with better styling */}
            <div className="flex items-center justify-between p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <p className="text-sm text-muted-foreground">
                Não se esqueça de salvar suas alterações
              </p>
              <Button 
                onClick={handleSave} 
                disabled={isSaving} 
                size="lg"
                className="gap-2 min-w-[160px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
