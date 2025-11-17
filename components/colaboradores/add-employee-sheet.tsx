"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Employee } from "@/lib/types"
import { Save, X, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface AddEmployeeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (employeeData: Partial<Employee>) => Promise<void>
}

export function AddEmployeeSheet({ open, onOpenChange, onCreate }: AddEmployeeSheetProps) {
  const { whitelabel } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    hire_date: new Date().toISOString().split("T")[0],
    status: "active" as "active" | "inactive" | "on_leave",
    avatar_url: "",
    user_role: "colaborador" as "admin" | "gestor" | "colaborador",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.role || !formData.department) {
      alert("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    setIsLoading(true)
    try {
      await onCreate({
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
      
      // Reset form after successful creation
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "",
        department: "",
        hire_date: new Date().toISOString().split("T")[0],
        status: "active",
        avatar_url: "",
        user_role: "colaborador",
      })
      
      onOpenChange(false)
    } catch (error) {
      alert("Erro ao criar colaborador. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[40vw] min-w-[500px] max-w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Novo Colaborador</SheetTitle>
          <SheetDescription>
            Adicione um novo colaborador à equipe. Campos marcados com * são obrigatórios.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-4">
          <div className="overflow-y-auto space-y-6 px-4 max-h-[calc(100vh-16rem)]">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="add-name">
                Nome Completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="add-name"
                placeholder="Nome completo do colaborador"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-phone">Telefone</Label>
                <Input
                  id="add-phone"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Role and Department */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-role">
                  Cargo <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className="cursor-pointer">
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
                <Label htmlFor="add-department">
                  Departamento <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger className="cursor-pointer">
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
                <Label htmlFor="add-hire-date">Data de Contratação</Label>
                <Input
                  id="add-hire-date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive" | "on_leave") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="cursor-pointer">
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
                <Label htmlFor="add-user-role">
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
                <SelectTrigger className="cursor-pointer">
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

          <SheetFooter className="gap-2 px-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="cursor-pointer"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer"
              style={{
                backgroundColor: whitelabel?.brandColor || '#3b82f6',
                color: 'white'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Criar Colaborador
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
