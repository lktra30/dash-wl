"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Key, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, Facebook, Circle } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface ApiKeysCardProps {
  metaAdsConfigured: boolean
  googleAdsConfigured: boolean
  facebookConfigured?: boolean
  metaAdsAccountId?: string
  facebookPageId?: string
  onMetaAdsKeyChange: (key: string) => void
  onGoogleAdsKeyChange: (key: string) => void
  onMetaAdsAccountIdChange: (accountId: string) => void
}

export function ApiKeysCard({
  metaAdsConfigured,
  googleAdsConfigured,
  facebookConfigured,
  metaAdsAccountId,
  facebookPageId,
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

  // Facebook Lead Ads states
  const [facebookPageIdInput, setFacebookPageIdInput] = useState(facebookPageId || "")
  const [facebookAccessToken, setFacebookAccessToken] = useState("")
  const [showFacebookToken, setShowFacebookToken] = useState(false)
  const [isSavingFacebook, setIsSavingFacebook] = useState(false)

  useEffect(() => {
    setAccountId(metaAdsAccountId || "")
  }, [metaAdsAccountId])

  useEffect(() => {
    setFacebookPageIdInput(facebookPageId || "")
  }, [facebookPageId])

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

  const handleFacebookUpdate = async () => {
    if (!facebookPageIdInput.trim() || !facebookAccessToken.trim()) {
      toast.error("Por favor, preencha o Page ID e o Access Token")
      return
    }

    setIsSavingFacebook(true)
    try {
      const response = await fetch("/api/settings/whitelabel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          facebookPageId: facebookPageIdInput.trim(),
          facebookAccessToken: facebookAccessToken.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao salvar configurações do Facebook")
      }

      setFacebookAccessToken("")
      toast.success("Configurações do Facebook salvas com sucesso!")

      // Reload to update the configured status
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar configurações")
    } finally {
      setIsSavingFacebook(false)
    }
  }

  const handleFacebookRemove = async () => {
    setIsSavingFacebook(true)
    try {
      const response = await fetch("/api/settings/whitelabel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          facebookPageId: "",
          facebookAccessToken: "",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao remover configurações do Facebook")
      }

      setFacebookPageIdInput("")
      setFacebookAccessToken("")
      toast.success("Configurações do Facebook removidas com sucesso!")

      // Reload to update the configured status
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover configurações")
    } finally {
      setIsSavingFacebook(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          <CardTitle>Integrações de Anúncios</CardTitle>
        </div>
        <CardDescription>
          Configure suas plataformas de anúncios para rastreamento de métricas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Notice */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg">
          <p className="text-xs text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span><strong>Segurança:</strong> Todas as chaves de API são criptografadas antes do armazenamento.</span>
          </p>
        </div>

        <Accordion type="multiple" defaultValue={["meta-ads", "facebook"]} className="w-full">
          {/* Meta Ads Integration */}
          <AccordionItem value="meta-ads">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Facebook className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">Meta Ads (Facebook/Instagram)</h3>
                    <p className="text-xs text-muted-foreground">Rastreie campanhas e métricas de anúncios</p>
                  </div>
                </div>
                {metaAdsConfigured ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Configurado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Pendente
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              {/* Account ID */}
              <div className="space-y-2">
                <Label htmlFor="meta-ads-account-id" className="text-sm font-medium">
                  Account ID
                </Label>
                <Input
                  id="meta-ads-account-id"
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="act_1234567890"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Formato: <code className="bg-muted px-1 py-0.5 rounded">act_1234567890</code>
                </p>
              </div>

              {/* Access Token */}
              <div className="space-y-2">
                <Label htmlFor="meta-ads-key" className="text-sm font-medium">
                  Token de Acesso
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="meta-ads-key"
                      type={showMetaKey ? "text" : "password"}
                      value={metaAdsKey}
                      onChange={(e) => setMetaAdsKey(e.target.value)}
                      placeholder={metaAdsConfigured ? "Digite novo token para atualizar" : "Digite o token de acesso"}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMetaKey(!showMetaKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showMetaKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
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
                    variant="outline"
                    size="sm"
                    className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
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
            </AccordionContent>
          </AccordionItem>

          <Separator className="my-2" />

          {/* Facebook Lead Ads Integration */}
          <AccordionItem value="facebook">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Facebook className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">Facebook Lead Ads</h3>
                    <p className="text-xs text-muted-foreground">Capture leads automaticamente</p>
                  </div>
                </div>
                {facebookConfigured ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Configurado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Pendente
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              {/* Page ID */}
              <div className="space-y-2">
                <Label htmlFor="facebook-page-id" className="text-sm font-medium">
                  ID da Página do Facebook
                </Label>
                <Input
                  id="facebook-page-id"
                  type="text"
                  value={facebookPageIdInput}
                  onChange={(e) => setFacebookPageIdInput(e.target.value)}
                  placeholder="123456789012345"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  ID numérico da sua página do Facebook
                </p>
              </div>

              {/* Access Token */}
              <div className="space-y-2">
                <Label htmlFor="facebook-access-token" className="text-sm font-medium">
                  Token de Acesso da Página
                </Label>
                <div className="relative flex-1">
                  <Input
                    id="facebook-access-token"
                    type={showFacebookToken ? "text" : "password"}
                    value={facebookAccessToken}
                    onChange={(e) => setFacebookAccessToken(e.target.value)}
                    placeholder={facebookConfigured ? "Digite novo token para atualizar" : "Digite o token de acesso"}
                    className="pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFacebookToken(!showFacebookToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showFacebookToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Token de longa duração com permissão <code className="bg-muted px-1 py-0.5 rounded">leads_retrieval</code>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleFacebookUpdate}
                  disabled={isSavingFacebook || !facebookPageIdInput.trim() || !facebookAccessToken.trim()}
                  size="sm"
                  className="cursor-pointer"
                >
                  {isSavingFacebook ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    facebookConfigured ? "Atualizar" : "Salvar"
                  )}
                </Button>
                {facebookConfigured && (
                  <Button
                    onClick={handleFacebookRemove}
                    variant="outline"
                    size="sm"
                    className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={isSavingFacebook}
                  >
                    {isSavingFacebook ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Removendo...
                      </>
                    ) : (
                      "Remover"
                    )}
                  </Button>
                )}
              </div>

              {/* Webhook URL Info */}
              {facebookConfigured && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg space-y-2">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                    📡 URL do Webhook
                  </p>
                  <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1.5 rounded block break-all font-mono">
                    {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/facebook` : '/api/webhooks/facebook'}
                  </code>
                  <p className="text-xs text-blue-900 dark:text-blue-100">
                    Configure esta URL no Facebook App Dashboard. Leads serão criados automaticamente com status "new_lead".
                  </p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Separator />

        {/* Info Notice */}
        <div className="p-3 bg-muted/50 border rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>💾 Salvamento:</strong> As credenciais são criptografadas e salvas imediatamente. A página será recarregada automaticamente após o salvamento.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
