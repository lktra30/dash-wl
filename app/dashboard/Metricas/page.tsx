"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { DateRangeFilter, getDefaultDateRange, type DateRangeFilterValue } from "@/components/date-range-filter"
import { SalesEvolutionChart } from "@/components/sales"
import { LeadsEvolutionChart } from "@/components/leads/leads-evolution-chart"
import { FunnelConversionChart } from "@/components/metrics/funnel-conversion-chart"
import { PipelineBreakdownChart } from "@/components/metrics/pipeline-breakdown-chart"
import { CustomerEvolutionChart } from "@/components/metrics/customer-evolution-chart"
import { GrowthRateChart } from "@/components/metrics/growth-rate-chart"
import { TemporalEvolutionChart } from "@/components/metrics/temporal-evolution-chart"
import { LtvCacComparison } from "@/components/metrics/ltv-cac-comparison"
import { useAuth } from "@/hooks/use-auth"
import { useState, useEffect } from "react"

export default function MetricsPage() {
  const { user, whitelabel, isLoading: authLoading } = useAuth()
  const [dateRange, setDateRange] = useState<DateRangeFilterValue>(getDefaultDateRange())
  
  // Sales Evolution state
  const [salesEvolutionData, setSalesEvolutionData] = useState<any[]>([])
  const [isSalesEvolutionLoading, setIsSalesEvolutionLoading] = useState(true)

  // Leads Evolution state
  const [leadsEvolutionData, setLeadsEvolutionData] = useState<any[]>([])
  const [isLeadsEvolutionLoading, setIsLeadsEvolutionLoading] = useState(true)

  // Load Sales Evolution data - Now respects date filter
  useEffect(() => {
    const loadSalesEvolutionData = async () => {
      if (authLoading || !user) return

      setIsSalesEvolutionLoading(true)
      try {
        const params = new URLSearchParams()
        if (dateRange.from) params.append('fromDate', dateRange.from.toISOString())
        if (dateRange.to) params.append('toDate', dateRange.to.toISOString())
        
        const response = await fetch(`/api/dashboard/sales-evolution?${params}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setSalesEvolutionData(data.data)
          }
        } else {
          setSalesEvolutionData([])
        }
      } catch (error) {
        setSalesEvolutionData([])
        // Silently ignore errors
      } finally {
        setIsSalesEvolutionLoading(false)
      }
    }

    loadSalesEvolutionData()
  }, [user, authLoading, dateRange])

  // Load Leads Evolution data - Now respects date filter
  useEffect(() => {
    const loadLeadsEvolutionData = async () => {
      if (authLoading || !user) return

      setIsLeadsEvolutionLoading(true)
      try {
        const params = new URLSearchParams()
        if (dateRange.from) params.append('fromDate', dateRange.from.toISOString())
        if (dateRange.to) params.append('toDate', dateRange.to.toISOString())
        
        const response = await fetch(`/api/dashboard/leads-evolution?${params}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setLeadsEvolutionData(data)
        } else {
          setLeadsEvolutionData([])
        }
      } catch (error) {
        setLeadsEvolutionData([])
        // Silently ignore errors
      } finally {
        setIsLeadsEvolutionLoading(false)
      }
    }

    loadLeadsEvolutionData()
  }, [user, authLoading, dateRange])

  if (authLoading) {
    return (
      <DashboardLayout>
        <DashboardHeader title="Métricas" description="Carregando..." />
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Autenticando...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user || !whitelabel) return null

  return (
    <DashboardLayout>
      <DashboardHeader title="Métricas" description="Acompanhe as métricas de desempenho do negócio.">
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </DashboardHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-8">
          {/* Evolução Section */}
          <section className="space-y-4">
            <div className="border-b pb-2">
              <h2 className="text-2xl font-bold tracking-tight">Evolução</h2>
              <p className="text-sm text-muted-foreground">
                Acompanhe o crescimento de vendas, leads e clientes ao longo do tempo
              </p>
            </div>
            <div className="space-y-6">
              <SalesEvolutionChart
                data={salesEvolutionData}
                brandColor={whitelabel.brandColor}
                isLoading={isSalesEvolutionLoading}
              />
              <LeadsEvolutionChart
                data={leadsEvolutionData}
                brandColor={whitelabel.brandColor}
                isLoading={isLeadsEvolutionLoading}
              />
              <CustomerEvolutionChart 
                months={12} 
                brandColor={whitelabel.brandColor}
                fromDate={dateRange.from?.toISOString()}
                toDate={dateRange.to?.toISOString()}
              />
            </div>
          </section>

          {/* Funil & Pipelines Section */}
          <section className="space-y-4">
            <div className="border-b pb-2">
              <h2 className="text-2xl font-bold tracking-tight">Funil & Pipelines</h2>
              <p className="text-sm text-muted-foreground">
                Análise de conversão por etapas e distribuição por pipeline
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <FunnelConversionChart 
                fromDate={dateRange.from?.toISOString()}
                toDate={dateRange.to?.toISOString()}
                brandColor={whitelabel.brandColor}
              />
              <PipelineBreakdownChart 
                fromDate={dateRange.from?.toISOString()}
                toDate={dateRange.to?.toISOString()}
                brandColor={whitelabel.brandColor}
              />
            </div>
          </section>

          {/* Crescimento Section */}
          <section className="space-y-4">
            <div className="border-b pb-2">
              <h2 className="text-2xl font-bold tracking-tight">Crescimento</h2>
              <p className="text-sm text-muted-foreground">
                Taxa de crescimento e evolução temporal da receita
              </p>
            </div>
            <div className="space-y-6">
              <GrowthRateChart 
                months={12} 
                brandColor={whitelabel.brandColor}
                fromDate={dateRange.from?.toISOString()}
                toDate={dateRange.to?.toISOString()}
              />
              <TemporalEvolutionChart 
                months={12} 
                brandColor={whitelabel.brandColor}
                fromDate={dateRange.from?.toISOString()}
                toDate={dateRange.to?.toISOString()}
              />
            </div>
          </section>

          {/* LTV & CAC Section */}
          <section className="space-y-4">
            <div className="border-b pb-2">
              <h2 className="text-2xl font-bold tracking-tight">LTV & CAC</h2>
              <p className="text-sm text-muted-foreground">
                Lifetime Value vs Customer Acquisition Cost e análise de rentabilidade
              </p>
            </div>
            <div className="grid gap-6">
              <LtvCacComparison 
                brandColor={whitelabel.brandColor}
                fromDate={dateRange.from?.toISOString()}
                toDate={dateRange.to?.toISOString()}
              />
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}
