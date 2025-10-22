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
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTheme } from "@/hooks/use-theme"
import type { Contact } from "@/lib/types"
import { toast } from "sonner"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Employee {
  id: string
  name: string
  role: string
}

interface EditContactSheetProps {
  contact: Contact
  open: boolean
  onOpenChange: (open: boolean) => void
  onContactUpdated: () => void
  dataService: any
}

export function EditContactSheet({
  contact,
  open,
  onOpenChange,
  onContactUpdated,
  dataService,
}: EditContactSheetProps) {
  const { brandColor } = useTheme()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [error, setError] = React.useState<string>("")
  const [previousStatus, setPreviousStatus] = React.useState(contact.status)
  const [formData, setFormData] = React.useState({
    name: contact.name,
    email: contact.email,
    phone: contact.phone || "",
    company: contact.company || "",
    status: contact.status,
    dealValue: contact.dealValue || 0,
    dealDuration: contact.dealDuration ? Math.round(contact.dealDuration / 30) : 0, // Convert days to months
    sdrId: (contact as any).sdrId || "",
    closerId: (contact as any).closerId || "",
  })

  // Load employees when sheet opens
  React.useEffect(() => {
    if (open) {
      loadEmployees()
      setError("") // Clear any previous errors
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

  // Update form when contact changes
  React.useEffect(() => {
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || "",
      company: contact.company || "",
      status: contact.status,
      dealValue: contact.dealValue || 0,
      dealDuration: contact.dealDuration ? Math.round(contact.dealDuration / 30) : 0, // Convert days to months
      sdrId: (contact as any).sdrId || "",
      closerId: (contact as any).closerId || "",
    })
    setPreviousStatus(contact.status)
  }, [contact])

  // Show toast when status changes to "won"
  React.useEffect(() => {
    if (formData.status === "won" && previousStatus !== "won") {
      toast.info("Lead Ganho", {
        description: "Um lead ganho deve ter valor e duração preenchidos.",
        duration: 5000,
      })
    }
    setPreviousStatus(formData.status)
  }, [formData.status])

  // Validate won status has required fields
  const validateWonStatus = (): boolean => {
    if (formData.status === "won") {
      if (!formData.dealValue || formData.dealValue <= 0) {
        toast.error("Validação de Lead Ganho", {
          description: "Um lead ganho deve ter um valor maior que zero.",
          duration: 4000,
        })
        return false
      }
      if (!formData.dealDuration || formData.dealDuration <= 0) {
        toast.error("Validação de Lead Ganho", {
          description: "Um lead ganho deve ter uma duração em meses maior que zero.",
          duration: 4000,
        })
        return false
      }
    }
    return true
  }

  // Handle sheet close - allow closing without validation
  const handleSheetOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Clear errors when closing
      setError("")
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dataService) return

    // Validate won status before submitting
    if (!validateWonStatus()) {
      return
    }

    // Validação: SDR e Closer são obrigatórios
    if (!formData.sdrId || formData.sdrId === "") {
      setError("Por favor, selecione um SDR. É obrigatório para realizar a venda.")
      return
    }

    if (!formData.closerId || formData.closerId === "") {
      setError("Por favor, selecione um Closer. É obrigatório para realizar a venda.")
      return
    }

    setIsSubmitting(true)
    setError("") // Clear any previous errors
    try {
      await dataService.updateContact({
        id: contact.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        status: formData.status,
        dealValue: (formData.status === "won" || formData.status === "lost") ? formData.dealValue : undefined,
        dealDuration: (formData.status === "won" || formData.status === "lost") ? (formData.dealDuration) : undefined,
        sdrId: formData.sdrId,
        closerId: formData.closerId,
      })

      // Close sheet
      onOpenChange(false)

      // Notify parent to reload contacts
      onContactUpdated()
    } catch (error: any) {
      // Mostra a mensagem de erro da API se disponível
      const errorMessage = error?.message || error?.error || "Falha ao atualizar contato. Por favor, tente novamente."
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-xl" style={{ color: brandColor }}>Editar Contato</SheetTitle>
          <SheetDescription>
            Atualize as informações do contato abaixo. SDR e Closer são obrigatórios para realizar vendas.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-4">
          <div className="overflow-y-auto space-y-6 px-4 max-h-[calc(100vh-16rem)]">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-3">
              <Label htmlFor="edit-name" className="text-sm font-semibold">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="John Doe"
                className="h-11 text-base"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="edit-email" className="text-sm font-semibold">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="john@example.com"
                className="h-11 text-base"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="edit-phone" className="text-sm font-semibold">
                Telefone
              </Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="edit-company" className="text-sm font-semibold">
                Empresa
              </Label>
              <Input
                id="edit-company"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                placeholder="Acme Inc."
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="edit-status" className="text-sm font-semibold">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger id="edit-status" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_lead">Novo Lead</SelectItem>
                  <SelectItem value="contacted">Contactado</SelectItem>
                  <SelectItem value="meeting">Reunião Agendada</SelectItem>
                  <SelectItem value="negotiation">Negociação</SelectItem>
                  <SelectItem value="won">Ganho</SelectItem>
                  <SelectItem value="lost">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="edit-sdr" className="text-sm font-semibold">
                SDR (Sales Development Representative) <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.sdrId || ""}
                onValueChange={(value) => handleInputChange("sdrId", value)}
              >
                <SelectTrigger id="edit-sdr" className="h-11">
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
              <Label htmlFor="edit-closer" className="text-sm font-semibold">
                Closer (Account Executive) <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.closerId || ""}
                onValueChange={(value) => handleInputChange("closerId", value)}
              >
                <SelectTrigger id="edit-closer" className="h-11">
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

            {/* Conditional fields for Won/Lost status */}
            {(formData.status === "won" || formData.status === "lost") && (
              <>
                <div className="space-y-3">
                  <Label htmlFor="edit-dealValue" className="text-sm font-semibold">
                    Valor da Oferta <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-dealValue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.dealValue}
                    onChange={(e) => handleInputChange("dealValue", e.target.value)}
                    placeholder="0.00"
                    className="h-11 text-base"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-dealDuration" className="text-sm font-semibold">
                    Duração (em meses) {formData.status === "won" && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="edit-dealDuration"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.dealDuration}
                    onChange={(e) => handleInputChange("dealDuration", e.target.value)}
                    placeholder="0"
                    className="h-11 text-base"
                    disabled={formData.status === "lost"}
                    required={formData.status === "won"}
                  />
                </div>
              </>
            )}
          </div>

          <SheetFooter className="flex-row px-4 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex-1 h-11 hover:opacity-90"
              style={{ backgroundColor: brandColor }}
            >
              {isSubmitting ? "Atualizando..." : "Atualizar Contato"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSheetOpenChange(false)}
              disabled={isSubmitting}
              className="h-11 px-6"
            >
              Cancelar
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
