"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { DateRangeFilter, getDefaultDateRange, type DateRangeFilterValue } from "@/components/date-range-filter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/hooks/use-auth"
import { Plus, Mail, Phone, Briefcase, Trash2, X, Save, Users, Edit, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import type { Employee } from "@/lib/types"
import { EditEmployeeSheet } from "@/components/colaboradores"
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

export default function EmployeesPage() {
  const { user, whitelabel } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRangeFilterValue>(getDefaultDateRange())
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    hire_date: "",
    status: "active" as "active" | "inactive" | "on_leave",
    user_role: "colaborador" as "admin" | "gestor" | "colaborador",
  })

  useEffect(() => {
    if (user) {
      loadEmployees()
    }
  }, [user])

  const loadEmployees = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/dashboard/employees")
      if (!response.ok) throw new Error("Failed to fetch employees")
      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      alert("Erro ao carregar colaboradores. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEmployee = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      hire_date: new Date().toISOString().split("T")[0],
      status: "active",
      user_role: "colaborador",
    })
    setIsAddDialogOpen(true)
  }

  const handleSaveNewEmployee = async () => {
    if (!formData.name || !formData.email || !formData.role || !formData.department) {
      alert("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    try {
      const response = await fetch("/api/dashboard/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create employee")
      }

      await loadEmployees()
      setIsAddDialogOpen(false)
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "",
        department: "",
        hire_date: new Date().toISOString().split("T")[0],
        status: "active",
        user_role: "colaborador",
      })
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao criar colaborador. Tente novamente.")
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsEditSheetOpen(true)
  }

  const handleSaveEmployee = async (updatedData: Partial<Employee>) => {
    if (!selectedEmployee) return

    try {
      const response = await fetch(`/api/dashboard/employees/${selectedEmployee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update employee")
      }

      await loadEmployees()
    } catch (error) {
      throw error
    }
  }

  const handleDeleteEmployee = async () => {
    if (!deleteEmployeeId) return

    try {
      const response = await fetch(`/api/dashboard/employees/${deleteEmployeeId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete employee")
      }

      await loadEmployees()
      setDeleteEmployeeId(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao excluir colaborador. Tente novamente.")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      case "on_leave":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo"
      case "inactive":
        return "Inativo"
      case "on_leave":
        return "De Férias"
      default:
        return status
    }
  }

  const translateRole = (role: string): string => {
    const roleMap: Record<string, string> = {
      'admin': 'Administrador',
      'sales': 'Vendas',
      'manager': 'Gerente',
      'SuperAdmin': 'Super Administrador',
      'SDR': 'SDR',
      'Closer': 'Closer',
      'Analista de Marketing': 'Analista de Marketing',
      'Desenvolvedor': 'Desenvolvedor',
      'Analista de Suporte': 'Analista de Suporte',
    }
    return roleMap[role] || role
  }

  const translateDepartment = (department: string): string => {
    const deptMap: Record<string, string> = {
      'Management': 'Gerência',
      'Sales': 'Vendas',
      'Marketing': 'Marketing',
      'General': 'Geral',
      'IT': 'TI',
      'Support': 'Suporte',
      'Finance': 'Financeiro',
      'HR': 'RH',
      // Keep Portuguese values as-is
      'Vendas': 'Vendas',
      'TI': 'TI',
      'Suporte': 'Suporte',
      'Financeiro': 'Financeiro',
      'Gerência': 'Gerência',
      'Geral': 'Geral',
    }
    return deptMap[department] || department
  }

  const getDepartmentColor = (department: string) => {
    // Translate department first to match Portuguese keys
    const translatedDept = translateDepartment(department)
    const colors: Record<string, string> = {
      Vendas: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      Marketing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      TI: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
      Suporte: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      Financeiro: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
      RH: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      Gerência: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      Geral: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    }
    return colors[translatedDept] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }

  const getEmployeesByDepartment = () => {
    const departments: Record<string, number> = {}
    employees.forEach((emp) => {
      departments[emp.department] = (departments[emp.department] || 0) + 1
    })
    return departments
  }

  if (!user) return null

  const departmentStats = getEmployeesByDepartment()
  const activeEmployees = employees.filter((e) => e.status === "active").length

  return (
    <DashboardLayout>
      <DashboardHeader title="Colaboradores" description="Gerencie sua equipe e colaboradores">
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="gap-2" 
              onClick={handleAddEmployee}
              style={{ 
                backgroundColor: whitelabel?.brandColor || '#3b82f6',
                color: 'white'
              }}
            >
              <Plus className="h-4 w-4" />
              Adicionar Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <DialogTitle className="text-xl">Novo Colaborador</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">Adicione um novo colaborador à equipe</p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Nome completo do colaborador"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">
                    Cargo <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SDR">SDR</SelectItem>
                      <SelectItem value="Closer">Closer</SelectItem>
                      <SelectItem value="Analista de Marketing">Analista de Marketing</SelectItem>
                      <SelectItem value="Desenvolvedor">Desenvolvedor</SelectItem>
                      <SelectItem value="Analista de Suporte">Analista de Suporte</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">
                    Departamento <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger className="bg-background">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hire_date">Data de Contratação</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="user_role">
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
                  <SelectTrigger className="bg-background">
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

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="gap-2">
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveNewEmployee} 
                className="gap-2"
                style={{ 
                  backgroundColor: whitelabel?.brandColor || 'bg-primary',
                  color: 'white'
                }}
              >
                <Save className="h-4 w-4" />
                Criar Colaborador
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardHeader>

      <AlertDialog open={!!deleteEmployeeId} onOpenChange={() => setDeleteEmployeeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este colaborador? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando colaboradores...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total de Colaboradores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{employees.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Colaboradores Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{activeEmployees}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Departamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.keys(departmentStats).length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Maior Departamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {Object.keys(departmentStats).length > 0
                      ? translateDepartment(Object.entries(departmentStats).sort((a, b) => b[1] - a[1])[0][0])
                      : "-"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Todos os Colaboradores</CardTitle>
              </CardHeader>
              <CardContent>
                {!Array.isArray(employees) || employees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum colaborador encontrado</p>
                    <p className="text-sm mt-2">Adicione colaboradores para começar a gerenciar sua equipe</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Data de Contratação</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => (
                        <TableRow key={employee.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {employee.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              {employee.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {employee.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {employee.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {employee.phone}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              {translateRole(employee.role)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getDepartmentColor(employee.department)}>{translateDepartment(employee.department)}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(employee.hire_date).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(employee.status)}>{getStatusLabel(employee.status)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditEmployee(employee)}
                                className="text-primary hover:text-primary"
                                title="Editar colaborador"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteEmployeeId(employee.id)}
                                className="text-destructive hover:text-destructive"
                                title="Excluir colaborador"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Employee Sheet */}
      <EditEmployeeSheet
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        employee={selectedEmployee}
        onSave={handleSaveEmployee}
      />
    </DashboardLayout>
  )
}
