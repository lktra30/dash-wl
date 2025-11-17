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
  CommissionOverview,
  Employee,
  Contact
} from "@/lib/types"
import { 
  CommissionSettingsCard, 
  CommissionOverviewCard, 
  UserCommissionCard,
  CommissionGuideCard,
  IndividualCommissionCards
} from "@/components/comissoes"
import { calculateTotalCommissionsCard } from "@/lib/commissions"
import { getSDRMetricsForPeriod, getCloserMetricsWithContacts } from "@/lib/commission-calculations"

export default function CommissionsPage() {
  const { user, whitelabel } = useAuth()
  const dataService = useData()
  
  const [settings, setSettings] = useState<CommissionSettings | null>(null)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
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
        const [settingsData, meetingsData, dealsData, contactsData, employeesData] = await Promise.all([
          dataService.getCommissionSettings(),
          dataService.getMeetings({ month: currentMonth, year: currentYear }),
          dataService.getDeals(),
          dataService.getContacts(),
          dataService.getEmployees(),
        ])
        
        setSettings(settingsData)
        setMeetings(meetingsData)
        setDeals(dealsData)
        setContacts(contactsData)
        setEmployees(employeesData)
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

    // Filter employees by role - check if role contains SDR or Closer
    // Note: Some employees may have "SDR/Closer" role, they will appear in both lists
    const sdrs = employees.filter(emp => {
      const roleUpper = emp.role?.toUpperCase() || ''
      return roleUpper.includes('SDR')
    })
    
    const closers = employees.filter(emp => {
      const roleUpper = emp.role?.toUpperCase() || ''
      return roleUpper.includes('CLOSER')
    })

    // Calculate SDR metrics
    const sdrMetrics: SDRMetrics[] = sdrs.map(sdr => 
      getSDRMetricsForPeriod(
        meetings,
        settings,
        sdr.id,
        sdr.name,
        currentMonth,
        currentYear
      )
    ) // Show all SDRs, even without activity

    // Calculate Closer metrics
    const closerMetrics: CloserMetrics[] = closers.map(closer => 
      getCloserMetricsWithContacts(
        deals,
        contacts,
        settings,
        closer.id,
        closer.name,
        currentMonth,
        currentYear,
        whitelabel?.businessModel || "TCV"
      )
    ) // Show all Closers, even without sales
    
    return { sdrMetrics, closerMetrics }
  }, [settings, meetings, deals, contacts, employees, currentMonth, currentYear, whitelabel?.businessModel])

  // Filter deals by current period (month/year)
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      if (!deal.saleDate) return false
      
      const saleDate = new Date(deal.saleDate)
      const dealMonth = saleDate.getMonth() + 1
      const dealYear = saleDate.getFullYear()
      
      return dealMonth === currentMonth && dealYear === currentYear
    })
  }, [deals, currentMonth, currentYear])

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

    // Usar a nova função de cálculo baseada em deals ganhos do período
    const cardData = calculateTotalCommissionsCard(
      filteredDeals, 
      settings, 
      whitelabel?.businessModel || "TCV",
      contacts // Pass contacts to calculate closer commissions correctly
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
  }, [filteredDeals, contacts, settings, userMetrics, whitelabel?.businessModel])

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
              deals={filteredDeals}
              brandColor={brandColor}
              businessModel={whitelabel?.businessModel || "TCV"}
            />
            
            {/* Individual Commission Cards */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">Desempenho Individual</h2>
                <p className="text-sm text-muted-foreground">
                  Acompanhe o progresso de cada SDR e Closer em relação às metas estabelecidas
                </p>
              </div>
              <IndividualCommissionCards 
                sdrMetrics={userMetrics.sdrMetrics}
                closerMetrics={userMetrics.closerMetrics}
                businessModel={whitelabel?.businessModel || "TCV"}
              />
            </div>
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
