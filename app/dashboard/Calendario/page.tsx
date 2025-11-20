"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { CalendarViewCustom } from "@/components/calendario/calendar-view-custom"
import { useAuth } from "@/hooks/use-auth"
import { createSecureDataService } from "@/lib/supabase-data-service"
import type { Meeting, Employee } from "@/lib/types"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function CalendarioPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSdr, setSelectedSdr] = useState<string>("")
  const [selectedCloser, setSelectedCloser] = useState<string>("")
  const dataService = createSecureDataService()

  // Fetch employees for filter dropdowns
  useEffect(() => {
    if (authLoading || !user) return

    const fetchEmployees = async () => {
      try {
        const data = await dataService.getEmployees()
        setEmployees(data)
      } catch (error) {
        console.error("Erro ao carregar colaboradores:", error)
      }
    }

    fetchEmployees()
  }, [user, authLoading])

  // Fetch meetings with filters
  useEffect(() => {
    if (authLoading || !user) return

    const fetchMeetings = async () => {
      try {
        setIsLoading(true)
        const params: any = {}
        if (selectedSdr && selectedSdr !== 'all') params.sdrId = selectedSdr
        if (selectedCloser && selectedCloser !== 'all') params.closerId = selectedCloser
        
        const data = await dataService.getMeetings(params)
        setMeetings(data)
      } catch (error) {
        console.error("Erro ao carregar reuniões:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMeetings()
  }, [user, authLoading, selectedSdr, selectedCloser])

  const clearFilters = () => {
    setSelectedSdr("")
    setSelectedCloser("")
  }

  const hasActiveFilters = selectedSdr || selectedCloser

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
        <DashboardHeader 
          title="Calendário" 
          description="Visualize todas as reuniões agendadas e realizadas"
        />
        <div className="flex-1 space-y-4 p-8 pt-6">
          {/* Filtros abaixo do título em mobile */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* SDR Filter */}
            <Select value={selectedSdr} onValueChange={setSelectedSdr}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Todos os SDRs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os SDRs</SelectItem>
                {employees
                  .filter(emp => emp.user_role === 'colaborador' || emp.user_role === 'admin')
                  .map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Closer Filter */}
            <Select value={selectedCloser} onValueChange={setSelectedCloser}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Todos os Closers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Closers</SelectItem>
                {employees
                  .filter(emp => emp.user_role === 'colaborador' || emp.user_role === 'admin')
                  .map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="gap-2 w-full sm:w-auto"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
          
          <CalendarViewCustom meetings={meetings} />
        </div>
    </DashboardLayout>
  )
}
