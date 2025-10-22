"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Team, Employee } from "@/lib/types"
import { UserPlus, X, Search, AlertCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TeamMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: Team & {
    members?: Employee[]
  }
  availableUsers: Employee[]
  onAddMember: (employeeId: string) => Promise<void>
  onRemoveMember: (employeeId: string) => Promise<void>
}

export function TeamMembersDialog({
  open,
  onOpenChange,
  team,
  availableUsers,
  onAddMember,
  onRemoveMember,
}: TeamMembersDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  // Fetch all employees when dialog opens
  useEffect(() => {
    if (open) {
      fetchEmployees()
    }
  }, [open])

  const fetchEmployees = async () => {
    setLoadingEmployees(true)
    try {
      const response = await fetch("/api/dashboard/employees?status=active")
      const data = await response.json()
      setAllEmployees(data)
    } catch (error) {
      setAllEmployees([])
    } finally {
      setLoadingEmployees(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Get current team members and available employees
  const currentMembers = allEmployees.filter((emp) => emp.team_id === team.id)
  const availableEmployees = allEmployees.filter((emp) => !emp.team_id)
  const employeesOnOtherTeams = allEmployees.filter((emp) => emp.team_id && emp.team_id !== team.id)

  // Filter by search query
  const filteredMembers = currentMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredAvailable = availableEmployees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddMember = async (employeeId: string) => {
    setIsLoading(employeeId)
    try {
      await onAddMember(employeeId)
      await fetchEmployees() // Refresh the employee list
    } finally {
      setIsLoading(null)
    }
  }

  const handleRemoveMember = async (employeeId: string) => {
    setIsLoading(employeeId)
    try {
      await onRemoveMember(employeeId)
      await fetchEmployees() // Refresh the employee list
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Membros - {team.name}</DialogTitle>
          <DialogDescription>
            Adicione ou remova membros da equipe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="pl-10"
            />
          </div>

          {/* Current Members */}
          <div>
            <h3 className="text-sm font-semibold mb-2">
              Membros Atuais ({filteredMembers.length})
            </h3>
            <ScrollArea className="h-[200px] rounded-md border p-2">
              {filteredMembers.length > 0 ? (
                <div className="space-y-2">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar_url} alt={member.name} />
                          <AvatarFallback style={{ backgroundColor: team.color }}>
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm flex items-center gap-2">
                            {member.name}
                            {team.leaderId === member.id && (
                              <Badge variant="secondary" className="text-xs">
                                Líder
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={isLoading === member.id || team.leaderId === member.id}
                        title={team.leaderId === member.id ? "Não é possível remover o líder" : "Remover membro"}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  {searchQuery ? "Nenhum membro encontrado" : "Nenhum membro na equipe"}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Available Employees */}
          <div>
            <h3 className="text-sm font-semibold mb-2">
              Adicionar Membros ({filteredAvailable.length} disponíveis)
            </h3>
            <ScrollArea className="h-[200px] rounded-md border p-2">
              {loadingEmployees ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Carregando colaboradores...
                </div>
              ) : filteredAvailable.length > 0 ? (
                <div className="space-y-2">
                  {filteredAvailable.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={employee.avatar_url} alt={employee.name} />
                          <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{employee.name}</p>
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                              Disponível
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {employee.email} • {employee.role}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAddMember(employee.id)}
                        disabled={isLoading === employee.id}
                        title="Adicionar membro"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  {searchQuery ? "Nenhum colaborador encontrado" : "Todos os colaboradores já estão em equipes"}
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Employees on Other Teams (Info Only) */}
          {employeesOnOtherTeams.length > 0 && !searchQuery && (
            <div>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                Colaboradores em Outras Equipes ({employeesOnOtherTeams.length})
              </h3>
              <ScrollArea className="h-[150px] rounded-md border p-2 bg-muted/30">
                <div className="space-y-2">
                  {employeesOnOtherTeams.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center gap-3 p-2 rounded-lg opacity-60"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={employee.avatar_url} alt={employee.name} />
                        <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{employee.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Em outra equipe
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {employee.email} • {employee.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
