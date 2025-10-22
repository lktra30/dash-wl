"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, AlertCircle } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Contact } from "@/lib/types"

interface Employee {
  id: string
  name: string
  role: string
}

interface AddContactSheetProps {
  onContactAdded: () => void
  dataService: any
  canCreate: boolean
}

export function AddContactSheet({ onContactAdded, dataService, canCreate }: AddContactSheetProps) {
  const { brandColor } = useTheme()
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [error, setError] = React.useState<string>("")
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "new_lead" as Contact["status"],
    sdrId: "",
    closerId: "",
  })

  // Load employees when sheet opens
  React.useEffect(() => {
    if (open) {
      loadEmployees()
      setError("") // Clear any previous errors
    } else {
      // Reset form when closing
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        status: "new_lead",
        sdrId: "",
        closerId: "",
      })
      setError("")
    }
  }, [open])

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/dashboard/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      } else {
        setError('Erro ao carregar lista de funcionários.')
      }
    } catch (error) {
      setError('Erro ao carregar lista de funcionários.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação: SDR e Closer são obrigatórios
    if (!formData.sdrId || formData.sdrId === "") {
      setError("Por favor, selecione um SDR. É obrigatório para realizar a venda.")
      return
    }

    if (!formData.closerId || formData.closerId === "") {
      setError("Por favor, selecione um Closer. É obrigatório para realizar a venda.")
      return
    }

    if (!dataService) return

    setIsSubmitting(true)
    setError("") // Clear any previous errors
    try {
      await dataService.createContact({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        status: formData.status,
        sdrId: formData.sdrId,
        closerId: formData.closerId,
      })

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        status: "new_lead",
        sdrId: "",
        closerId: "",
      })

      // Close sheet
      setOpen(false)

      // Notify parent to reload contacts
      onContactAdded()
    } catch (error: any) {
      // Mostra a mensagem de erro da API se disponível
      const errorMessage = error?.message || error?.error || "Falha ao criar contato. Por favor, tente novamente."
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!canCreate) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button style={{ backgroundColor: brandColor }} className="hover:opacity-90 cursor-pointer">
          <Plus className="h-4 w-4" />
          Adicionar Contato
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-xl" style={{ color: brandColor }}>Adicionar Novo Contato</SheetTitle>
          <SheetDescription>
            Insira as informações do contato abaixo. SDR e Closer são obrigatórios para realizar vendas.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col h-[calc(100vh-12rem)]">
          <div className="flex-1 overflow-y-auto space-y-6 px-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-semibold">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="John Doe"
                className="h-11 text-base"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="john@example.com"
                className="h-11 text-base"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone" className="text-sm font-semibold">
                Telefone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="company" className="text-sm font-semibold">
                Empresa
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                placeholder="Acme Inc."
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="status" className="text-sm font-semibold">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger id="status" className="h-11 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_lead">Novo Lead</SelectItem>
                  <SelectItem value="contacted">Contatado</SelectItem>
                  <SelectItem value="meeting">Reunião Agendada</SelectItem>
                  <SelectItem value="negotiation">Negociação</SelectItem>
                  <SelectItem value="won">Ganho</SelectItem>
                  <SelectItem value="lost">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="sdr" className="text-sm font-semibold">
                SDR (Sales Development Representative) <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.sdrId || ""}
                onValueChange={(value) => handleInputChange("sdrId", value)}
              >
                <SelectTrigger id="sdr" className="h-11 cursor-pointer">
                  <SelectValue placeholder="Selecione um SDR" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const sdrEmployees = employees.filter(emp => {
                      if (!emp.role) return false
                      const role = emp.role.toLowerCase()
                      return role === 'sdr' || role.includes('sdr/closer') || role.includes('closer/sdr')
                    })

                    if (employees.length === 0) {
                      return (
                        <SelectItem value="no-employees" disabled>
                          Nenhum funcionário cadastrado
                        </SelectItem>
                      )
                    }

                    if (sdrEmployees.length === 0) {
                      return (
                        <SelectItem value="no-sdrs" disabled>
                          Nenhum SDR cadastrado
                        </SelectItem>
                      )
                    }

                    return sdrEmployees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </SelectItem>
                    ))
                  })()}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="closer" className="text-sm font-semibold">
                Closer (Account Executive) <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.closerId || ""}
                onValueChange={(value) => handleInputChange("closerId", value)}
              >
                <SelectTrigger id="closer" className="h-11 cursor-pointer">
                  <SelectValue placeholder="Selecione um Closer" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const closerEmployees = employees.filter(emp => {
                      if (!emp.role) return false
                      const role = emp.role.toLowerCase()
                      return role === 'closer' || role.includes('sdr/closer') || role.includes('closer/sdr')
                    })

                    if (employees.length === 0) {
                      return (
                        <SelectItem value="no-employees" disabled>
                          Nenhum funcionário cadastrado
                        </SelectItem>
                      )
                    }

                    if (closerEmployees.length === 0) {
                      return (
                        <SelectItem value="no-closers" disabled>
                          Nenhum Closer cadastrado
                        </SelectItem>
                      )
                    }

                    return closerEmployees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </SelectItem>
                    ))
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="flex-row gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: brandColor }}
            >
              {isSubmitting ? "Criando..." : "Criar Contato"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="h-11 px-6 cursor-pointer"
            >
              Cancelar
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
