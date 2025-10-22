"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Team, Employee } from "@/lib/types"
import { Upload, X, Image as ImageIcon, Users, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"

interface TeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team?: Team
  users?: Array<{
    id: string
    name: string
    email: string
    avatar_url?: string
  }>
  onSave: (teamData: {
    name: string
    color: string
    logoFile?: File
    employeeIds?: string[]
  }) => Promise<void>
}

export function TeamDialog({ open, onOpenChange, team, users = [], onSave }: TeamDialogProps) {
  const { user } = useAuth()
  const [name, setName] = useState(team?.name || "")
  const [color, setColor] = useState(team?.color || "#3b82f6")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(team?.logoUrl || null)
  const [isLoading, setIsLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(team?.employeeIds || [])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch employees when dialog opens
  useEffect(() => {
    if (open) {
      fetchEmployees()
    }
  }, [open])

  const fetchEmployees = async () => {
    setLoadingEmployees(true)
    try {
      // Fetch all active employees
      const response = await fetch("/api/dashboard/employees?status=active")
      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      setEmployees([])
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployeeIds((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId)
      } else {
        return [...prev, employeeId]
      }
    })
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"]
      if (!validTypes.includes(file.type)) {
        alert("Tipo de arquivo inválido. Apenas JPEG, PNG, SVG e WebP são permitidos.")
        return
      }

      // Validate file size (5MB max)
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
        employeeIds: selectedEmployeeIds.length > 0 ? selectedEmployeeIds : undefined,
      })

      // Reset form
      setName("")
      setColor("#3b82f6")
      setLogoFile(null)
      setLogoPreview(null)
      setSelectedEmployeeIds([])
      onOpenChange(false)
    } catch (error) {
      alert("Erro ao salvar equipe. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const predefinedColors = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] min-w-[60%]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{team ? "Editar Equipe" : "Nova Equipe"}</DialogTitle>
            <DialogDescription>
              {team ? "Atualize as informações da equipe." : "Crie uma nova equipe de vendas."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Team Name */}
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

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo da Equipe</Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/svg+xml,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {logoPreview ? "Alterar Logo" : "Upload Logo"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, SVG ou WebP (máx. 5MB)
                  </p>
                </div>
              </div>
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
                    className="w-10 h-10 rounded-lg border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? "hsl(var(--foreground))" : "transparent",
                    }}
                    title={c}
                  />
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 p-1 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Employee Selection */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <Label className="text-base font-semibold">Colaboradores da Equipe</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Selecione os colaboradores que farão parte desta equipe
              </p>
              {loadingEmployees ? (
                <div className="text-sm text-muted-foreground">Carregando colaboradores...</div>
              ) : employees.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum colaborador disponível</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                  {employees.map((employee) => {
                    const hasTeam = !!(employee.team_id && employee.team_id !== team?.id)
                    const isDisabled = hasTeam
                    
                    return (
                      <div 
                        key={employee.id} 
                        className={`flex items-center space-x-3 py-2 rounded px-2 ${
                          isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted/50 cursor-pointer'
                        }`}
                      >
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={selectedEmployeeIds.includes(employee.id)}
                          onCheckedChange={() => !isDisabled && handleEmployeeToggle(employee.id)}
                          disabled={isDisabled}
                        />
                        <label
                          htmlFor={`employee-${employee.id}`}
                          className={`text-sm font-medium leading-none flex-1 ${
                            isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{employee.name}</span>
                                {hasTeam && (
                                  <Badge variant="secondary" className="text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Já em outra equipe
                                  </Badge>
                                )}
                                {employee.team_id === team?.id && (
                                  <Badge variant="default" className="text-xs">
                                    Equipe atual
                                  </Badge>
                                )}
                                {!employee.team_id && (
                                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                    Disponível
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {employee.role} • {employee.department}
                              </div>
                            </div>
                            {employee.email && (
                              <div className="text-xs text-muted-foreground hidden sm:block">{employee.email}</div>
                            )}
                          </div>
                        </label>
                      </div>
                    )
                  })}
                </div>
              )}
              {selectedEmployeeIds.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedEmployeeIds.length} colaborador{selectedEmployeeIds.length !== 1 ? 'es' : ''} selecionado{selectedEmployeeIds.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : team ? "Salvar Alterações" : "Criar Equipe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
