"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Employee } from "@/lib/types"
import { Save, X, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface EditEmployeeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  onSave: (updatedEmployee: Partial<Employee>) => Promise<void>
}

export function EditEmployeeSheet({ open, onOpenChange, employee, onSave }: EditEmployeeSheetProps) {
  const { whitelabel } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    hire_date: "",
    status: "active" as "active" | "inactive" | "on_leave",
    avatar_url: "",
    user_role: "colaborador" as "admin" | "gestor" | "colaborador",
  })

  // Populate form when employee changes
  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || "",
        email: employee.email || "",
        phone: employee.phone || "",
        role: employee.role || "",
        department: employee.department || "",
        hire_date: employee.hire_date || "",
        status: employee.status || "active",
        avatar_url: employee.avatar_url || "",
        user_role: (employee as any).user_role || "colaborador",
      })
    }
  }, [employee])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.role || !formData.department) {
      alert("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        role: formData.role,
        department: formData.department,
        hire_date: formData.hire_date,
        status: formData.status,
        avatar_url: formData.avatar_url || undefined,
        user_role: formData.user_role,
      })
      onOpenChange(false)
    } catch (error) {
      alert("Erro ao salvar colaborador. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto space-y-6 px-4 py-4">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Editar Colaborador</SheetTitle>
            <SheetDescription>
              Atualize as informações do colaborador. Campos marcados com * são obrigatórios.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Nome Completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="Nome completo do colaborador"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Role and Department */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">
                  Cargo <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SDR">SDR</SelectItem>
                    <SelectItem value="Closer">Closer</SelectItem>
                    <SelectItem value="SDR/Closer">SDR/Closer</SelectItem>
                    <SelectItem value="Vendedor">Vendedor</SelectItem>
                    <SelectItem value="Gerente de Vendas">Gerente de Vendas</SelectItem>
                    <SelectItem value="Analista de Marketing">Analista de Marketing</SelectItem>
                    <SelectItem value="Desenvolvedor">Desenvolvedor</SelectItem>
                    <SelectItem value="Analista de Suporte">Analista de Suporte</SelectItem>
                    <SelectItem value="Analista Financeiro">Analista Financeiro</SelectItem>
                    <SelectItem value="Analista de RH">Analista de RH</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-department">
                  Departamento <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vendas">Vendas</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="TI">TI</SelectItem>
                    <SelectItem value="Suporte">Suporte</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="RH">RH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Hire Date and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-hire-date">Data de Contratação</Label>
                <Input
                  id="edit-hire-date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive" | "on_leave") => 
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="on_leave">De Férias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* User Role / Access Level */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="edit-user-role">
                  Nível de Acesso <span className="text-destructive">*</span>
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-popover text-popover-foreground border border-border shadow-lg">
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="font-semibold text-foreground">Admin:</p>
                          <p className="text-muted-foreground">Acesso total ao sistema</p>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Gestor:</p>
                          <p className="text-muted-foreground">Acesso à metas, equipes e colaboradores</p>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Colaborador:</p>
                          <p className="text-muted-foreground">Acesso somente à CRM</p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={formData.user_role}
                onValueChange={(value: "admin" | "gestor" | "colaborador") => 
                  setFormData({ ...formData, user_role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível de acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              style={{ 
                backgroundColor: whitelabel?.brandColor || '#3b82f6',
                color: 'white'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
