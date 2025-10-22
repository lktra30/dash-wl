"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { DateRangeFilter, getDefaultDateRange, type DateRangeFilterValue } from "@/components/date-range-filter"
import { AdsMetricsOverview } from "@/components/ads/ads-metrics-overview"
import { AdsInvestmentChart } from "@/components/ads/ads-investment-chart"
import { AdsPerformanceChart } from "@/components/ads/ads-performance-chart"
import { AdsCampaignTable } from "@/components/ads/ads-campaign-table"
import { GoogleAdsMetricsOverview } from "@/components/ads/google-ads-metrics-overview"
import { GoogleAdsInvestmentChart } from "@/components/ads/google-ads-investment-chart"
import { GoogleAdsPerformanceChart } from "@/components/ads/google-ads-performance-chart"
import { GoogleAdsCampaignTable } from "@/components/ads/google-ads-campaign-table"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2 } from "lucide-react"
import type { MetaAdsResponse, GoogleAdsResponse } from "@/lib/types"

export default function AdsPage() {
  const { user, whitelabel } = useAuth()
  const [metaAdsData, setMetaAdsData] = useState<MetaAdsResponse | null>(null)
  const [googleAdsData, setGoogleAdsData] = useState<GoogleAdsResponse | null>(null)
  const [isLoadingMeta, setIsLoadingMeta] = useState(true)
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(true)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [googleError, setGoogleError] = useState<string | null>(null)
  const [datePreset, setDatePreset] = useState("last_30d")
  const [activeTab, setActiveTab] = useState("meta")
  const [dateRange, setDateRange] = useState<DateRangeFilterValue>(getDefaultDateRange())

  const brandColor = whitelabel?.brandColor || "#6366f1"

  useEffect(() => {
    if (activeTab === "meta") {
      loadMetaAdsData()
    } else {
      loadGoogleAdsData()
    }
  }, [datePreset, user, activeTab])

  const loadMetaAdsData = async () => {
    if (!user) {
      setIsLoadingMeta(false)
      return
    }

    setIsLoadingMeta(true)
    setMetaError(null)

    try {
      const url = `/api/dashboard/ads?date_preset=${datePreset}&time_increment=1`
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || "Falha ao buscar dados do Meta Ads")
      }

      const data = await response.json()
      setMetaAdsData(data)
    } catch (err) {
      setMetaError(err instanceof Error ? err.message : "Ocorreu um erro ao carregar dados do Meta Ads")
    } finally {
      setIsLoadingMeta(false)
    }
  }

  const loadGoogleAdsData = async () => {
    if (!user) {
      setIsLoadingGoogle(false)
      return
    }

    setIsLoadingGoogle(true)
    setGoogleError(null)

    try {
      const url = `/api/dashboard/ads/google?date_preset=${datePreset}`
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.message || errorData.error || "Falha ao buscar dados do Google Ads")
      }

      const data = await response.json()
      setGoogleAdsData(data)
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : "Ocorreu um erro ao carregar dados do Google Ads")
    } finally {
      setIsLoadingGoogle(false)
    }
  }

  if (!user || !whitelabel) return null

  const renderMetaAdsContent = () => {
    if (isLoadingMeta) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-300px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: brandColor }} />
            <p className="text-sm text-muted-foreground">Carregando dados do Meta Ads...</p>
          </div>
        </div>
      )
    }

    if (metaError) {
      return (
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="flex items-center gap-4 p-6">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-600 dark:text-red-400">Erro ao Carregar Dados</h3>
              <p className="text-sm text-muted-foreground">{metaError}</p>
              <button
                onClick={loadMetaAdsData}
                className="mt-2 text-sm underline"
                style={{ color: brandColor }}
              >
                Tentar novamente
              </button>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (!metaAdsData) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Nenhum Dado Disponível</h3>
              <p className="text-sm text-muted-foreground">
                Nenhum dado de anúncios Meta encontrado para o período selecionado.
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-6">
        <AdsMetricsOverview metrics={metaAdsData.metrics} brandColor={brandColor} />
        <div className="grid gap-6 md:grid-cols-2">
          <AdsInvestmentChart data={metaAdsData.timeSeries} brandColor={brandColor} />
          <AdsPerformanceChart data={metaAdsData.timeSeries} brandColor={brandColor} />
        </div>
        <AdsCampaignTable campaigns={metaAdsData.campaigns} brandColor={brandColor} />
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Mostrando dados para <strong>{datePreset.replace(/_/g, " ")}</strong>
              </span>
              <span>
                {metaAdsData.campaigns.length} campanha{metaAdsData.campaigns.length !== 1 ? "s" : ""} •{" "}
                {metaAdsData.rawDataCount} ponto{metaAdsData.rawDataCount !== 1 ? "s" : ""}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderGoogleAdsContent = () => {
    if (isLoadingGoogle) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-300px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: brandColor }} />
            <p className="text-sm text-muted-foreground">Carregando dados do Google Ads...</p>
          </div>
        </div>
      )
    }

    if (googleError) {
      return (
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="flex items-center gap-4 p-6">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-600 dark:text-red-400">Erro ao Carregar Dados</h3>
              <p className="text-sm text-muted-foreground mt-1">{googleError}</p>
              {googleError.includes("não configurado") && (
                <p className="text-xs text-muted-foreground mt-2">
                  Configure as credenciais do Google Ads nas configurações do sistema para começar a visualizar os dados.
                </p>
              )}
              <button
                onClick={loadGoogleAdsData}
                className="mt-2 text-sm underline"
                style={{ color: brandColor }}
              >
                Tentar novamente
              </button>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (!googleAdsData) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Nenhum Dado Disponível</h3>
              <p className="text-sm text-muted-foreground">
                Nenhum dado de anúncios Google encontrado para o período selecionado.
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-6">
        <GoogleAdsMetricsOverview metrics={googleAdsData.metrics} brandColor={brandColor} />
        <div className="grid gap-6 md:grid-cols-2">
          <GoogleAdsInvestmentChart data={googleAdsData.timeSeries} brandColor={brandColor} />
          <GoogleAdsPerformanceChart data={googleAdsData.timeSeries} brandColor={brandColor} />
        </div>
        <GoogleAdsCampaignTable campaigns={googleAdsData.campaigns} brandColor={brandColor} />
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Mostrando dados para <strong>{datePreset.replace(/_/g, " ")}</strong>
              </span>
              <span>
                {googleAdsData.campaigns.length} campanha{googleAdsData.campaigns.length !== 1 ? "s" : ""} •{" "}
                {googleAdsData.rawDataCount} ponto{googleAdsData.rawDataCount !== 1 ? "s" : ""}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Métricas de Anúncios"
        description="Monitore o desempenho e ROI dos seus anúncios"
      >
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </DashboardHeader>

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="meta">Meta Ads</TabsTrigger>
            <TabsTrigger value="google">Google Ads</TabsTrigger>
          </TabsList>
          
          <TabsContent value="meta" className="mt-6">
            {renderMetaAdsContent()}
          </TabsContent>
          
          <TabsContent value="google" className="mt-6">
            {renderGoogleAdsContent()}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
