"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { DateRangeFilter, getDefaultDateRange, type DateRangeFilterValue } from "@/components/date-range-filter"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { useTeamsRealtime } from "@/hooks/use-teams-realtime"
import { Plus, ArrowUpDown, Trophy } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Team, Employee } from "@/lib/types"
import { TeamCard, TeamEditDialog } from "@/components/equipes"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface TeamWithStats extends Team {
  stats?: {
    totalRevenue: number
    closedDeals: number
    activeDeals: number
    totalDeals: number
  }
  members?: Employee[]
  leader?: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
}

interface User {
  id: string
  name: string
  email: string
  avatar_url?: string
  role?: string
}

export default function TeamsPage() {
  const { user, whitelabel, refreshWhitelabel } = useAuth()
  const [teams, setTeams] = useState<TeamWithStats[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [dateRange, setDateRange] = useState<DateRangeFilterValue>(getDefaultDateRange())
  const [isLoading, setIsLoading] = useState(true)
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false)
  const [sortBy, setSortBy] = useState<"ranking" | "name" | "date">("ranking")
  const [selectedTeam, setSelectedTeam] = useState<TeamWithStats | null>(null)
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null)
  const [teamCompetitionEnabled, setTeamCompetitionEnabled] = useState(false)
  const [isUpdatingCompetition, setIsUpdatingCompetition] = useState(false)

  // Fetch teams data (usando useCallback para poder passar como dependência)
  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/teams")
      if (!response.ok) throw new Error("Failed to fetch teams")
      const data = await response.json()
      setTeams(data)
    } catch (error) {
      toast.error("Não foi possível carregar as equipes.")
    }
  }, [])

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/dashboard/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setAllUsers(data)
    } catch (error) {
      toast.error("Não foi possível carregar os usuários.")
    }
  }

  // Fetch all employees
  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/dashboard/employees?status=active")
      if (!response.ok) throw new Error("Failed to fetch employees")
      const data = await response.json()
      setAllEmployees(data)
    } catch (error) {
      toast.error("Não foi possível carregar os colaboradores.")
    }
  }

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        await Promise.all([fetchTeams(), fetchUsers(), fetchEmployees()])
        
        // Fetch whitelabel settings to get team_competition status
        if (whitelabel) {
          setTeamCompetitionEnabled(whitelabel.teamCompetition || false)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, whitelabel])

  // Setup real-time subscriptions for teams and employees
  useTeamsRealtime({
    onUpdate: fetchTeams,
    enabled: !!user, // Only enable when user is authenticated
  })

  const handleCreateTeam = () => {
    setSelectedTeam(null)
    setIsTeamDialogOpen(true)
  }

  const handleEditTeam = (team: TeamWithStats) => {
    setSelectedTeam(team)
    setIsTeamDialogOpen(true)
  }

  const handleSaveTeam = async (teamData: {
    name: string
    color: string
    logoFile?: File
  }) => {
    try {
      if (selectedTeam) {
        // Update existing team
        const response = await fetch(`/api/dashboard/teams/${selectedTeam.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: teamData.name,
            color: teamData.color,
          }),
        })

        if (!response.ok) throw new Error("Failed to update team")
        await response.json()

        // Upload logo if provided
        if (teamData.logoFile) {
          const formData = new FormData()
          formData.append("logo", teamData.logoFile)

          const uploadResponse = await fetch(
            `/api/dashboard/teams/${selectedTeam.id}/upload-logo`,
            {
              method: "POST",
              body: formData,
            }
          )

          if (!uploadResponse.ok) throw new Error("Failed to upload logo")
        }
      } else {
        // Create new team
        const response = await fetch("/api/dashboard/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: teamData.name,
            color: teamData.color,
          }),
        })

        if (!response.ok) throw new Error("Failed to create team")

        const newTeam = await response.json()

        // Upload logo if provided
        if (teamData.logoFile) {
          const formData = new FormData()
          formData.append("logo", teamData.logoFile)

          const uploadResponse = await fetch(
            `/api/dashboard/teams/${newTeam.id}/upload-logo`,
            {
              method: "POST",
              body: formData,
            }
          )

          if (!uploadResponse.ok) throw new Error("Failed to upload logo")
        }
      }

      // Refresh teams
      await fetchTeams()
    } catch (error) {
      throw error
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    setTeamToDelete(teamId)
  }

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return

    try {
      const response = await fetch(`/api/dashboard/teams/${teamToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete team")

      // Refresh teams
      await fetchTeams()
      setTeamToDelete(null)
    } catch (error) {
      alert("Erro ao excluir equipe. Tente novamente.")
    }
  }

  const handleManageMembers = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    if (team) {
      setSelectedTeam(team)
      setIsTeamDialogOpen(true)
    }
  }

  const handleToggleCompetition = async (enabled: boolean) => {
    setIsUpdatingCompetition(true)
    try {
      const response = await fetch("/api/settings/team-competition", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_competition: enabled }),
      })

      if (!response.ok) throw new Error("Failed to update competition setting")

      setTeamCompetitionEnabled(enabled)
      
      // Refresh whitelabel context to update the value everywhere
      await refreshWhitelabel()
      
      toast.success(
        enabled
          ? "Competição de equipes ativada na página principal"
          : "Competição de equipes desativada"
      )
    } catch (error) {
      toast.error("Erro ao atualizar configuração")
    } finally {
      setIsUpdatingCompetition(false)
    }
  }

  const handleAddMember = async (employeeId: string, force: boolean = false) => {
    if (!selectedTeam) return

    try {
      const response = await fetch(
        `/api/dashboard/teams/${selectedTeam.id}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId, force }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add member")
      }
      
      await response.json()

      // Refresh teams
      await fetchTeams()
      
      // Update selected team
      const updatedTeam = teams.find((t) => t.id === selectedTeam.id)
      if (updatedTeam) {
        setSelectedTeam(updatedTeam)
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao adicionar membro. Tente novamente.")
    }
  }

  const handleRemoveMember = async (employeeId: string) => {
    if (!selectedTeam) return

    try {
      const response = await fetch(
        `/api/dashboard/teams/${selectedTeam.id}/members/${employeeId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) throw new Error("Failed to remove member")

      // Refresh teams
      await fetchTeams()
      
      // Update selected team
      const updatedTeam = teams.find((t) => t.id === selectedTeam.id)
      if (updatedTeam) {
        setSelectedTeam(updatedTeam)
      }
    } catch (error) {
      alert("Erro ao remover membro. Tente novamente.")
    }
  }

  if (!user || !whitelabel) return null

  // Sort teams based on selected criteria
  const sortedTeams = [...teams].sort((a, b) => {
    switch (sortBy) {
      case "ranking":
        // Sort by total revenue (descending)
        return (b.stats?.totalRevenue || 0) - (a.stats?.totalRevenue || 0)
      case "name":
        // Sort by name (alphabetically)
        return a.name.localeCompare(b.name)
      case "date":
        // Sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return 0
    }
  })

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Equipes de Vendas"
        description="Gerencie suas equipes e acompanhe a competição"
      >
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <Button onClick={handleCreateTeam} style={{ backgroundColor: whitelabel.brandColor }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Equipe
        </Button>
      </DashboardHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Carregando equipes...</p>
            </div>
          ) : (
            <>
              {/* Team Competition Settings - Only shown if 2+ teams */}
              {teams.length >= 2 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <CardTitle>Competição de Equipes</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="team-competition"
                          checked={teamCompetitionEnabled}
                          onCheckedChange={handleToggleCompetition}
                          disabled={isUpdatingCompetition}
                        />
                        <Label htmlFor="team-competition" className="cursor-pointer">
                          {teamCompetitionEnabled ? "Ativada" : "Desativada"}
                        </Label>
                      </div>
                    </div>
                    <CardDescription>
                      {teamCompetitionEnabled
                        ? "A competição de equipes está sendo exibida na página principal do dashboard"
                        : "Ative para exibir um ranking competitivo das equipes na página principal"}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              {/* All Teams Grid with Filter */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Todas as Equipes</h2>
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <Select value={sortBy} onValueChange={(value: "ranking" | "name" | "date") => {
                      setSortBy(value)
                    }}>
                      <SelectTrigger 
                        className="w-[180px]"
                        style={{ 
                          borderColor: whitelabel.brandColor,
                          outlineColor: whitelabel.brandColor 
                        }}
                      >
                        <SelectValue placeholder="Ordenar por..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ranking">
                          Ranking (Receita)
                        </SelectItem>
                        <SelectItem value="name">
                          Nome
                        </SelectItem>
                        <SelectItem value="date">
                          Data de Criação
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {teams.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {sortedTeams.map((team) => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        businessModel={whitelabel?.businessModel || "TCV"}
                        isAdmin={true}
                        onEdit={handleEditTeam}
                        onDelete={handleDeleteTeam}
                        onManageMembers={handleManageMembers}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground mb-4">Nenhuma equipe criada ainda</p>
                    <Button onClick={handleCreateTeam}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Equipe
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Team Edit Dialog - Unificado com gerenciamento de membros */}
      <TeamEditDialog
        open={isTeamDialogOpen}
        onOpenChange={setIsTeamDialogOpen}
        team={selectedTeam || undefined}
        onSave={handleSaveTeam}
        onAddMember={selectedTeam ? handleAddMember : undefined}
        onRemoveMember={selectedTeam ? handleRemoveMember : undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!teamToDelete} onOpenChange={() => setTeamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Equipe</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta equipe? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTeam}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
