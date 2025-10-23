"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Key, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

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
  const [isSavingMeta, setIsSavingMeta] = useState(false)
  const [isSavingGoogle, setIsSavingGoogle] = useState(false)

  useEffect(() => {
    setAccountId(metaAdsAccountId || "")
  }, [metaAdsAccountId])

  const handleMetaAdsUpdate = async () => {
    if (!metaAdsKey.trim() && !accountId.trim()) {
      toast.error("Por favor, preencha o Account ID e o Access Token")
      return
    }

    setIsSavingMeta(true)
    try {
      const response = await fetch("/api/settings/whitelabel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          metaAdsKey: metaAdsKey.trim(),
          metaAdsAccountId: accountId.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao salvar chave do Meta Ads")
      }

      setMetaAdsKey("")
      toast.success("Chave do Meta Ads salva com sucesso!")

      // Reload to update the configured status
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar chave")
    } finally {
      setIsSavingMeta(false)
    }
  }

  const handleGoogleAdsUpdate = async () => {
    if (!googleAdsKey.trim()) {
      toast.error("Por favor, preencha o Access Token")
      return
    }

    setIsSavingGoogle(true)
    try {
      const response = await fetch("/api/settings/whitelabel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          googleAdsKey: googleAdsKey.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao salvar chave do Google Ads")
      }

      setGoogleAdsKey("")
      toast.success("Chave do Google Ads salva com sucesso!")

      // Reload to update the configured status
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar chave")
    } finally {
      setIsSavingGoogle(false)
    }
  }

  const handleMetaAdsRemove = async () => {
    setIsSavingMeta(true)
    try {
      const response = await fetch("/api/settings/whitelabel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          metaAdsKey: "",
          metaAdsAccountId: "",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao remover chave do Meta Ads")
      }

      setMetaAdsKey("")
      setAccountId("")
      toast.success("Chave do Meta Ads removida com sucesso!")

      // Reload to update the configured status
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover chave")
    } finally {
      setIsSavingMeta(false)
    }
  }

  const handleGoogleAdsRemove = async () => {
    setIsSavingGoogle(true)
    try {
      const response = await fetch("/api/settings/whitelabel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          googleAdsKey: "",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao remover chave do Google Ads")
      }

      setGoogleAdsKey("")
      toast.success("Chave do Google Ads removida com sucesso!")

      // Reload to update the configured status
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover chave")
    } finally {
      setIsSavingGoogle(false)
    }
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
              disabled={isSavingMeta || (!metaAdsKey.trim() && !accountId.trim())}
              size="sm"
              className="cursor-pointer"
            >
              {isSavingMeta ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Salvando...
                </>
              ) : (
                metaAdsConfigured ? "Atualizar" : "Salvar"
              )}
            </Button>
            {metaAdsConfigured && (
              <Button
                onClick={handleMetaAdsRemove}
                variant="destructive"
                size="sm"
                className="cursor-pointer"
                disabled={isSavingMeta}
              >
                {isSavingMeta ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Removendo...
                  </>
                ) : (
                  "Remover"
                )}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Used for fetching Meta/Facebook advertising campaign data and metrics.
          </p>
        </div>

        {/* Info Notice */}
        <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
          <p className="text-xs text-green-900 dark:text-green-100">
            <strong>✓ Salvamento Automático:</strong> As chaves são criptografadas e salvas no banco de dados imediatamente quando você clica em "Salvar" ou "Atualizar". A página será recarregada automaticamente após o salvamento.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
