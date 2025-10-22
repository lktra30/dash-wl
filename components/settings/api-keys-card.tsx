"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Key, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

interface ApiKeysCardProps {
  metaAdsConfigured: boolean
  googleAdsConfigured: boolean
  metaAdsAccountId?: string
  onMetaAdsKeyChange: (key: string) => void
  onGoogleAdsKeyChange: (key: string) => void
  onMetaAdsAccountIdChange: (accountId: string) => void
}

export function ApiKeysCard({
  metaAdsConfigured,
  googleAdsConfigured,
  metaAdsAccountId,
  onMetaAdsKeyChange,
  onGoogleAdsKeyChange,
  onMetaAdsAccountIdChange,
}: ApiKeysCardProps) {
  const [metaAdsKey, setMetaAdsKey] = useState("")
  const [googleAdsKey, setGoogleAdsKey] = useState("")
  const [accountId, setAccountId] = useState(metaAdsAccountId || "")
  const [showMetaKey, setShowMetaKey] = useState(false)
  const [showGoogleKey, setShowGoogleKey] = useState(false)

  const handleMetaAdsUpdate = () => {
    if (metaAdsKey.trim()) {
      onMetaAdsKeyChange(metaAdsKey)
      setMetaAdsKey("") // Clear input after update
    }
  }

  const handleGoogleAdsUpdate = () => {
    if (googleAdsKey.trim()) {
      onGoogleAdsKeyChange(googleAdsKey)
      setGoogleAdsKey("") // Clear input after update
    }
  }

  const handleMetaAdsRemove = () => {
    onMetaAdsKeyChange("") // Empty string signals removal
    setMetaAdsKey("")
  }

  const handleGoogleAdsRemove = () => {
    onGoogleAdsKeyChange("") // Empty string signals removal
    setGoogleAdsKey("")
  }

  const handleAccountIdUpdate = () => {
    onMetaAdsAccountIdChange(accountId.trim())
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Chaves de API
        </CardTitle>
        <CardDescription>
          Configure suas chaves de API para a plataforma de anúncios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Notice */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            <strong>🔒 Segurança:</strong> Todas as chaves de API são criptografadas antes do armazenamento.
          </p>
        </div>

        {/* Meta Ads API Key */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="meta-ads-account-id" className="text-sm font-medium">
              Meta Ads Account ID
            </Label>
          </div>
          
          <div className="flex gap-2">
            <Input
              id="meta-ads-account-id"
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="act_1234567890"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            O Account ID do Meta Ads (formato: act_1234567890). Este ID é usado para buscar dados de campanhas.
          </p>
        </div>

        {/* Meta Ads Access Token */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="meta-ads-key" className="text-sm font-medium">
              Meta Ads Access Token
            </Label>
            {metaAdsConfigured ? (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                <span>Configured</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3 w-3" />
                <span>Not configured</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="meta-ads-key"
                type={showMetaKey ? "text" : "password"}
                value={metaAdsKey}
                onChange={(e) => setMetaAdsKey(e.target.value)}
                placeholder={metaAdsConfigured ? "Enter new token to update" : "Enter Meta Ads access token"}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowMetaKey(!showMetaKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showMetaKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              onClick={handleMetaAdsUpdate}
              disabled={!metaAdsKey.trim()}
              size="sm"
              className="cursor-pointer"
            >
              {metaAdsConfigured ? "Update" : "Save"}
            </Button>
            {metaAdsConfigured && (
              <Button
                onClick={handleMetaAdsRemove}
                variant="destructive"
                size="sm"
                className="cursor-pointer"
              >
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Used for fetching Meta/Facebook advertising campaign data and metrics.
          </p>
        </div>

        {/* Warning */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
          <p className="text-xs text-amber-900 dark:text-amber-100">
            <strong>⚠️ Importante:</strong> As chaves são salvas imediatamente quando você clica em Salvar/Atualizar.
            Certifique-se de testar suas integrações após atualizar as chaves.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
