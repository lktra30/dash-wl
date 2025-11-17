"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { DateRangeFilter, getDefaultDateRange, type DateRangeFilterValue } from "@/components/date-range-filter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/hooks/use-auth"
import { Plus, Mail, Phone, Briefcase, Trash2, X, Save, Users, Edit, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import type { Employee } from "@/lib/types"
import { EditEmployeeSheet, AddEmployeeSheet } from "@/components/colaboradores"
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
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRangeFilterValue>(getDefaultDateRange())

  useEffect(() => {
    if (user) {
      loadEmployees()
    }
  }, [user])

  const loadEmployees = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/dashboard/employees")
      if (!response.ok) throw new Error("Falha ao buscar colaboradores")
      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      alert("Erro ao carregar colaboradores. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEmployee = () => {
    setIsAddSheetOpen(true)
  }

  const handleCreateEmployee = async (employeeData: Partial<Employee>) => {
    try {
      const response = await fetch("/api/dashboard/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao criar colaborador")
      }

      await loadEmployees()
    } catch (error) {
      throw error
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
        throw new Error(error.error || "Falha ao atualizar colaborador")
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
        throw new Error(error.error || "Falha ao excluir colaborador")
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
        <Button
          className="gap-2 cursor-pointer"
          onClick={handleAddEmployee}
          style={{
            backgroundColor: whitelabel?.brandColor || '#3b82f6',
            color: 'white'
          }}
        >
          <Plus className="h-4 w-4" />
          Adicionar Colaborador
        </Button>
      </DashboardHeader>

      <AddEmployeeSheet
        open={isAddSheetOpen}
        onOpenChange={setIsAddSheetOpen}
        onCreate={handleCreateEmployee}
      />

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
                                className="text-primary hover:text-primary cursor-pointer"
                                title="Editar colaborador"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteEmployeeId(employee.id)}
                                className="text-destructive hover:text-destructive cursor-pointer"
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
