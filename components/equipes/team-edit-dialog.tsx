"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Team, Employee } from "@/lib/types"
import { useEmployeesRealtime } from "@/hooks/use-employees-realtime"
import { Upload, X, Image as ImageIcon, Users, UserPlus, Trash2 } from "lucide-react"
import Image from "next/image"

interface EmployeeWithTeam extends Employee {
  current_team?: {
    id: string
    name: string
    color: string
  } | null
}

interface TeamEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team?: Team & {
    members?: Employee[]
    memberIds?: string[]
  }
  onSave: (teamData: {
    name: string
    color: string
    logoFile?: File
  }) => Promise<void>
  onAddMember?: (employeeId: string, force?: boolean) => Promise<void>
  onRemoveMember?: (employeeId: string) => Promise<void>
}

export function TeamEditDialog({ 
  open, 
  onOpenChange, 
  team, 
  onSave,
  onAddMember,
  onRemoveMember 
}: TeamEditDialogProps) {
  const [name, setName] = useState("")
  const [color, setColor] = useState("#3b82f6")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [employees, setEmployees] = useState<EmployeeWithTeam[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [managingMemberId, setManagingMemberId] = useState<string | null>(null)
  const [confirmMoveDialog, setConfirmMoveDialog] = useState<{
    open: boolean
    employee: EmployeeWithTeam | null
    fromTeam: string | null
  }>({ open: false, employee: null, fromTeam: null })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch employees function (defined before useEffect)
  const fetchEmployees = useCallback(async () => {
    setLoadingEmployees(true)
    try {
      const response = await fetch("/api/dashboard/employees?status=active")
      if (!response.ok) throw new Error("Failed to fetch employees")
      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      setEmployees([])
    } finally {
      setLoadingEmployees(false)
    }
  }, [])

  // Initialize form when team changes or dialog opens
  useEffect(() => {
    if (open) {
      if (team) {
        setName(team.name || "")
        setColor(team.color || "#3b82f6")
        setLogoPreview(team.logoUrl || null)
      } else {
        setName("")
        setColor("#3b82f6")
        setLogoPreview(null)
      }
      setLogoFile(null)
      fetchEmployees()
    }
  }, [open, team, fetchEmployees])

  // Setup real-time subscription for employees
  useEmployeesRealtime({
    onUpdate: fetchEmployees,
    enabled: open, // Only enable when dialog is open
  })

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Get current team members and available employees
  const currentMembers = employees.filter((emp) => emp.team_id === team?.id)
  const availableEmployees = employees.filter((emp) => emp.team_id !== team?.id)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"]
      if (!validTypes.includes(file.type)) {
        alert("Tipo de arquivo inválido. Apenas JPEG, PNG, SVG e WebP são permitidos.")
        return
      }

      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        alert("Arquivo muito grande. O tamanho máximo é 5MB.")
        return
      }

      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleAddMember = async (employeeId: string) => {
    if (!onAddMember || !team) return
    
    const employee = employees.find(e => e.id === employeeId)
    if (!employee) return
    
    // Check if employee is in another team
    if (employee.team_id && employee.team_id !== team.id) {
      setConfirmMoveDialog({
        open: true,
        employee,
        fromTeam: employee.current_team?.name || "Outra equipe"
      })
      return
    }
    
    // Employee is available, add directly
    await addMemberToTeam(employeeId, false)
  }

  const addMemberToTeam = async (employeeId: string, force: boolean = false) => {
    if (!team) return
    
    setManagingMemberId(employeeId)
    try {
      
      // Make request with force parameter if needed
      const response = await fetch(`/api/dashboard/teams/${team.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, force }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add member")
      }

      await fetchEmployees() // Refresh employee list
      
      
      // Close confirmation dialog if open
      setConfirmMoveDialog({ open: false, employee: null, fromTeam: null })
    } catch (error) {
      alert("Erro ao adicionar membro. Tente novamente.")
    } finally {
      setManagingMemberId(null)
    }
  }

  const handleConfirmMove = async () => {
    if (!confirmMoveDialog.employee) return
    await addMemberToTeam(confirmMoveDialog.employee.id, true)
  }

  const handleRemoveMember = async (employeeId: string) => {
    if (!onRemoveMember || !team) return
    
    setManagingMemberId(employeeId)
    try {
      await onRemoveMember(employeeId)
      await fetchEmployees() // Refresh employee list
    } catch (error) {
      alert("Erro ao remover membro. Tente novamente.")
    } finally {
      setManagingMemberId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert("O nome da equipe é obrigatório.")
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        name: name.trim(),
        color,
        logoFile: logoFile || undefined,
      })

      onOpenChange(false)
    } catch (error) {
      alert("Erro ao salvar equipe. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const predefinedColors = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
    "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{team ? "Editar Equipe" : "Nova Equipe"}</DialogTitle>
          <DialogDescription>
            {team 
              ? "Atualize as informações da equipe e gerencie os membros." 
              : "Crie uma nova equipe de vendas."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin">
          <div className="space-y-6 mt-4 pb-4">
            {/* Team Information Form */}
            <form id="team-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-5 w-1 bg-primary rounded-full" />
                <h3 className="text-lg font-semibold">Informações da Equipe</h3>
              </div>

              {/* Team Name and Logo in same row */}
              <div className="flex gap-4">
                {/* Logo Upload */}
                <div className="flex-shrink-0">
                  <Label className="mb-2 block">Logo</Label>
                  {logoPreview ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/svg+xml,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  {!logoPreview && (
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      Clique para<br />adicionar
                    </p>
                  )}
                </div>

                {/* Team Name and Color */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Equipe *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Equipe Alpha"
                      required
                    />
                  </div>

                  {/* Color Picker */}
                  <div className="space-y-2">
                    <Label>Cor da Equipe</Label>
                    <div className="flex gap-2 flex-wrap">
                      {predefinedColors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className="w-9 h-9 rounded-lg border-2 transition-all hover:scale-110 cursor-pointer"
                          style={{
                            backgroundColor: c,
                            borderColor: color === c ? "hsl(var(--foreground))" : "transparent",
                          }}
                          title={c}
                        />
                      ))}
                      <Input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-9 h-9 p-1 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Members Section - Only shown when editing */}
            {team && (
              <>
                <Separator className="my-4" />
                
                <div className="space-y-4">
                  {/* Current Members */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-5 w-1 bg-primary rounded-full" />
                      <h3 className="text-base font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Membros Atuais ({currentMembers.length})
                      </h3>
                    </div>
                    {currentMembers.length > 0 ? (
                      <div className="space-y-2 border rounded-lg p-3 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        {currentMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={member.avatar_url} alt={member.name} />
                                <AvatarFallback style={{ backgroundColor: team.color }}>
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{member.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {member.role} • {member.email}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={managingMemberId === member.id}
                              title="Remover membro"
                              className="cursor-pointer"
                            >
                              {managingMemberId === member.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg bg-muted/20">
                        Nenhum membro na equipe. Adicione colaboradores abaixo.
                      </div>
                    )}
                  </div>

                  {/* Available Employees */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-5 w-1 bg-primary rounded-full" />
                      <h3 className="text-base font-semibold flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Adicionar Membros ({availableEmployees.length} disponíveis)
                      </h3>
                    </div>
                    {loadingEmployees ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        Carregando colaboradores...
                      </div>
                    ) : availableEmployees.length > 0 ? (
                      <div className="space-y-2 border rounded-lg p-3 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        {availableEmployees.map((employee) => {
                          const isInAnotherTeam = employee.team_id && employee.team_id !== team?.id
                          const badgeVariant = isInAnotherTeam ? "secondary" : "outline"
                          const badgeText = isInAnotherTeam 
                            ? `Em ${employee.current_team?.name || "outra equipe"}` 
                            : "Disponível"
                          const badgeColor = isInAnotherTeam 
                            ? "text-orange-600 border-orange-600" 
                            : "text-green-600 border-green-600"
                          
                          return (
                            <div
                              key={employee.id}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={employee.avatar_url} alt={employee.name} />
                                  <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm">{employee.name}</p>
                                    <Badge variant={badgeVariant} className={`text-xs ${badgeColor}`}>
                                      {badgeText}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {employee.role} • {employee.email}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAddMember(employee.id)}
                                disabled={managingMemberId === employee.id}
                                title={isInAnotherTeam ? "Mover para esta equipe" : "Adicionar membro"}
                                className="cursor-pointer"
                              >
                                {managingMemberId === employee.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                ) : (
                                  <UserPlus className="h-4 w-4 text-primary" />
                                )}
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg bg-muted/20">
                        Todos os colaboradores já estão nesta equipe
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-4 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Fechar
          </Button>
          <Button
            type="submit"
            form="team-form"
            disabled={isLoading}
            className="cursor-pointer"
          >
            {isLoading ? "Salvando..." : team ? "Salvar Alterações" : "Criar Equipe"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirmation Dialog for Moving Employee Between Teams */}
      <AlertDialog 
        open={confirmMoveDialog.open} 
        onOpenChange={(open) => !open && setConfirmMoveDialog({ open: false, employee: null, fromTeam: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mover Colaborador de Equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMoveDialog.employee && confirmMoveDialog.fromTeam && (
                <>
                  <strong>{confirmMoveDialog.employee.name}</strong> atualmente faz parte da equipe{" "}
                  <strong>{confirmMoveDialog.fromTeam}</strong>.
                  <br /><br />
                  Deseja mover este colaborador para <strong>{team?.name}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMove}>
              Sim, mover colaborador
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
