"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "@/hooks/use-theme"
import { useState, useEffect } from "react"
import { Save, Loader2 } from "lucide-react"
import {
  UserProfileCard,
  BrandCustomizationCard,
  ApiKeysCard,
  BusinessSettingsCard,
} from "@/components/settings"

export default function SettingsPage() {
  const { user, whitelabel } = useAuth()
  const { brandColor, setBrandColor } = useTheme()
  
  // State
  const [whitelabelName, setWhitelabelName] = useState("")
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
          brandColor: tempBrandColor,
          businessModel,
          metaAdsAccountId,
          ...(metaAdsKey && { metaAdsKey }),
          ...(googleAdsKey && { googleAdsKey }),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save settings")
      }

      // Update the brand color in the theme
      setBrandColor(tempBrandColor)

      // Clear API key inputs after successful save
      setMetaAdsKey("")
      setGoogleAdsKey("")

      // Reload to get updated whitelabel data
      window.location.reload()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (!user || !whitelabel) return null

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <DashboardHeader title="Configurações" description="Gerencie sua conta e configuração de whitelabel" />

        <div className="flex-1 overflow-auto p-5">
          <div className="h-full flex flex-col gap-4">
            {/* Two Column Grid */}
            <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
                {/* Left Column */}
                <div className="flex flex-col gap-4 overflow-y-auto pr-2">
                  <UserProfileCard user={user} />
                  <ApiKeysCard
                    metaAdsConfigured={whitelabel.metaAdsConfigured || false}
                    googleAdsConfigured={whitelabel.googleAdsConfigured || false}
                    metaAdsAccountId={metaAdsAccountId}
                    onMetaAdsKeyChange={setMetaAdsKey}
                    onGoogleAdsKeyChange={setGoogleAdsKey}
                    onMetaAdsAccountIdChange={setMetaAdsAccountId}
                  />
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-4 overflow-y-auto pr-2">
                  <BusinessSettingsCard
                    whitelabelName={whitelabelName}
                    onWhitelabelNameChange={setWhitelabelName}
                    businessModel={businessModel}
                    onBusinessModelChange={setBusinessModel}
                    logoUrl={logoUrl}
                    onLogoChange={setLogoUrl}
                  />
                  <BrandCustomizationCard 
                    brandColor={tempBrandColor}
                    onBrandColorChange={setTempBrandColor}
                  />
                </div>
              </div>

              {/* Save Button - Fixed at bottom */}
              <div className="flex justify-end pt-2 border-t">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
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
