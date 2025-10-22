"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { DateRangeFilter, getDefaultDateRange, type DateRangeFilterValue } from "@/components/date-range-filter"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import useData from "@/hooks/use-data"
import { Settings, BarChart3, Info } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { 
  CommissionSettings, 
  UserCommission, 
  User, 
  Meeting, 
  Deal,
  SDRMetrics,
  CloserMetrics,
  CommissionOverview
} from "@/lib/types"
import { 
  CommissionSettingsCard, 
  CommissionOverviewCard, 
  UserCommissionCard,
  CommissionGuideCard
} from "@/components/comissoes"
import { calculateTotalCommissionsCard } from "@/lib/commissions"

export default function CommissionsPage() {
  const { user, whitelabel } = useAuth()
  const dataService = useData()
  
  const [settings, setSettings] = useState<CommissionSettings | null>(null)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRangeFilterValue>(getDefaultDateRange())
  
  // Current period (default to current month/year)
  const [currentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear] = useState(new Date().getFullYear())

  const brandColor = whitelabel?.brandColor || '#3b82f6'

  useEffect(() => {
    const loadData = async () => {
      if (!dataService || !user) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const [settingsData, meetingsData, dealsData] = await Promise.all([
          dataService.getCommissionSettings(),
          dataService.getMeetings({ month: currentMonth, year: currentYear }),
          dataService.getDeals(),
        ])
        
        setSettings(settingsData)
        setMeetings(meetingsData)
        setDeals(dealsData)
      } catch (error) {
        // TODO: surface commission loading errors to the user interface
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [dataService, user, currentMonth, currentYear])

  const handleSaveSettings = async (updatedSettings: Partial<CommissionSettings>) => {
    if (!dataService) return
    
    try {
      const saved = await dataService.updateCommissionSettings(updatedSettings)
      setSettings(saved)
    } catch (error) {
      throw error
    }
  }

  // Calculate metrics for all users
  const userMetrics = useMemo(() => {
    if (!settings) return { sdrMetrics: [], closerMetrics: [] }

    // This is simplified - in a real app, you'd fetch a list of users
    // and calculate metrics for each one
    const sdrMetrics: SDRMetrics[] = []
    const closerMetrics: CloserMetrics[] = []

    // For now, return empty arrays
    // In a production app, you'd iterate through users and calculate their metrics
    
    return { sdrMetrics, closerMetrics }
  }, [settings, meetings, deals])

  // Calculate overview
  const overview: CommissionOverview = useMemo(() => {
    if (!settings) {
      return {
        totalCommissions: 0,
        sdrCommissions: 0,
        closerCommissions: 0,
        sdrCount: 0,
        closerCount: 0,
        totalSales: 0,
        totalDeals: 0,
        averageTargetAchievement: 0,
        topPerformers: []
      }
    }

    // Usar a nova função de cálculo baseada em deals ganhos
    const cardData = calculateTotalCommissionsCard(
      deals, 
      settings, 
      whitelabel?.businessModel || "TCV"
    )
    
    const { sdrMetrics, closerMetrics } = userMetrics
    const allMetrics = [...sdrMetrics, ...closerMetrics]
    
    const averageTargetAchievement = allMetrics.length > 0
      ? allMetrics.reduce((sum, m) => sum + m.targetAchievementPercent, 0) / allMetrics.length
      : 0

    const topPerformers = allMetrics
      .map(m => ({
        userId: m.userId,
        userName: m.userName,
        role: ('meetingsHeld' in m ? 'sdr' : 'closer') as 'sdr' | 'closer',
        commission: m.finalCommission,
        achievement: m.targetAchievementPercent
      }))
      .sort((a, b) => b.commission - a.commission)
      .slice(0, 10)

    const finalOverview = {
      ...cardData,
      averageTargetAchievement,
      topPerformers
    }
    
    return finalOverview
  }, [deals, settings, userMetrics])

  if (!user) return null

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardHeader title="Comissões" description="Gerenciar comissões da equipe">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </DashboardHeader>
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <DashboardHeader 
        title="Comissões" 
        description="Acompanhe e gerencie comissões da equipe"
      >
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </DashboardHeader>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <CommissionOverviewCard 
              overview={overview}
              periodMonth={currentMonth}
              periodYear={currentYear}
              settings={settings}
              deals={deals}
              brandColor={brandColor}
            />
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Info className="h-4 w-4" />
                      Guia Informativo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Guia de Configuração de Comissões</DialogTitle>
                      <DialogDescription>
                        Aprenda como configurar o sistema de comissionamento
                      </DialogDescription>
                    </DialogHeader>
                    <CommissionGuideCard />
                  </DialogContent>
                </Dialog>
              </div>
              
              <CommissionSettingsCard 
                settings={settings}
                onSave={handleSaveSettings}
                isAdmin={true}
                brandColor={brandColor}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
