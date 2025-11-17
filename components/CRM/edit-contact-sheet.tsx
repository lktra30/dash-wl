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
import type { Contact, PipelineWithStages, PipelineStage } from "@/lib/types"
import { toast } from "sonner"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

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
  const [pipelines, setPipelines] = React.useState<PipelineWithStages[]>([])
  const [selectedPipeline, setSelectedPipeline] = React.useState<PipelineWithStages | null>(null)
  const [selectedStage, setSelectedStage] = React.useState<PipelineStage | null>(null)
  const [error, setError] = React.useState<string>("")
  const [previousStatus, setPreviousStatus] = React.useState(contact.status)
  
  // Helper function to format ISO datetime to datetime-local input format
  const formatDateTimeLocal = (isoString: string | undefined | null): string => {
    if (!isoString) return ""
    try {
      const date = new Date(isoString)
      // Format: YYYY-MM-DDTHH:mm
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    } catch {
      return ""
    }
  }
  
  const [formData, setFormData] = React.useState({
    name: contact.name,
    email: contact.email,
    phone: contact.phone || "",
    company: contact.company || "",
    pipelineId: (contact as any).pipelineId || "",
    stageId: (contact as any).stageId || "",
    status: contact.status,
    leadSource: (contact as any).leadSource || "",
    dealValue: contact.dealValue ?? 0,
    dealDuration: contact.dealDuration ? Math.round(contact.dealDuration / 30) : 0, // Convert days to months
    sdrId: (contact as any).sdrId || "",
    closerId: (contact as any).closerId || "",
    meetingDate: formatDateTimeLocal((contact as any).meetingDate),
    saleDate: formatDateTimeLocal((contact as any).saleDate),
    notes: (contact as any).notes ?? "",
  })

  // Load employees and pipelines when sheet opens
  React.useEffect(() => {
    if (open) {
      loadEmployees()
      loadPipelines()
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

  const loadPipelines = async () => {
    try {
      const response = await fetch('/api/dashboard/pipelines')
      if (response.ok) {
        const data = await response.json()
        setPipelines(data)

        // Set the contact's current pipeline as selected
        if (contact.pipelineId) {
          const contactPipeline = data.find((p: PipelineWithStages) => p.id === contact.pipelineId)
          if (contactPipeline) {
            setSelectedPipeline(contactPipeline)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pipelines:', error)
    }
  }

  // Update form when contact changes
  React.useEffect(() => {
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || "",
      company: contact.company || "",
      pipelineId: (contact as any).pipelineId || "",
      stageId: (contact as any).stageId || "",
      status: contact.status,
      leadSource: (contact as any).leadSource || "",
      dealValue: contact.dealValue ?? 0,
      dealDuration: contact.dealDuration ? Math.round(contact.dealDuration / 30) : 0, // Convert days to months
      sdrId: (contact as any).sdrId || "",
      closerId: (contact as any).closerId || "",
      meetingDate: formatDateTimeLocal((contact as any).meetingDate),
      saleDate: formatDateTimeLocal((contact as any).saleDate),
      notes: (contact as any).notes ?? "",
    })
    setPreviousStatus(contact.status)

    // Update selected pipeline and stage when contact changes
    if ((contact as any).pipelineId && pipelines.length > 0) {
      const contactPipeline = pipelines.find((p: PipelineWithStages) => p.id === (contact as any).pipelineId)
      if (contactPipeline) {
        setSelectedPipeline(contactPipeline)

        // Set selected stage
        if ((contact as any).stageId) {
          const contactStage = contactPipeline.stages.find((s: PipelineStage) => s.id === (contact as any).stageId)
          if (contactStage) {
            setSelectedStage(contactStage)
          }
        }
      }
    }
  }, [contact, pipelines])

  const handlePipelineChange = (pipelineId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId)
    setSelectedPipeline(pipeline || null)
    setFormData(prev => ({
      ...prev,
      pipelineId,
      stageId: pipeline?.stages[0]?.id || "",
    }))
  }

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

    // Validação: Pipeline e Stage são obrigatórios
    if (!formData.pipelineId || !formData.stageId) {
      setError("Por favor, selecione um pipeline e um estágio.")
      return
    }

    // Verificar requisitos do stage selecionado
    const currentStage = selectedPipeline?.stages.find(s => s.id === formData.stageId)
    if (currentStage) {
      if (currentStage.requiresSdr && (!formData.sdrId || formData.sdrId === "")) {
        setError(`O estágio "${currentStage.name}" requer que um SDR seja selecionado.`)
        return
      }

      if (currentStage.requiresCloser && (!formData.closerId || formData.closerId === "")) {
        setError(`O estágio "${currentStage.name}" requer que um Closer seja selecionado.`)
        return
      }

      // Validar campos obrigatórios quando o estágio representa venda
      if (currentStage.countsAsSale || currentStage.requiresDealValue) {
        if (!formData.dealValue || formData.dealValue <= 0) {
          setError(`O estágio "${currentStage.name}" requer que um valor de venda seja preenchido.`)
          return
        }
        
        // Se é venda, SEMPRE teve reunião antes
        if (currentStage.countsAsSale) {
          if (!formData.meetingDate) {
            setError(`O estágio "${currentStage.name}" requer que uma data de reunião seja preenchida (toda venda teve uma reunião antes).`)
            return
          }
          
          if (!formData.saleDate) {
            setError(`O estágio "${currentStage.name}" requer que uma data de venda seja preenchida.`)
            return
          }

          // Validar que a reunião foi antes da venda
          if (formData.meetingDate && formData.saleDate) {
            const meetingDateTime = new Date(formData.meetingDate).getTime()
            const saleDateTime = new Date(formData.saleDate).getTime()
            
            if (meetingDateTime >= saleDateTime) {
              setError("A data da reunião deve ser anterior à data da venda.")
              return
            }
          }
        }
      }
    }

    // Validate won status before submitting
    if (!validateWonStatus()) {
      return
    }

    // Validação: SDR e Closer são obrigatórios apenas para vendas realizadas (status "won")
    if (formData.status === "won") {
      if (!formData.sdrId || formData.sdrId === "") {
        setError("Por favor, selecione um SDR. É obrigatório para realizar a venda.")
        return
      }

      if (!formData.closerId || formData.closerId === "") {
        setError("Por favor, selecione um Closer. É obrigatório para realizar a venda.")
        return
      }
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
        pipelineId: formData.pipelineId,
        stageId: formData.stageId,
        status: formData.status,
        leadSource: formData.leadSource || undefined,
        dealValue: (formData.status === "won" || formData.status === "lost" || currentStage?.countsAsSale || currentStage?.requiresDealValue) ? formData.dealValue : undefined,
        dealDuration: (formData.status === "won" || formData.status === "lost" || currentStage?.countsAsSale) ? (formData.dealDuration) : undefined,
        sdrId: formData.sdrId || undefined,
        closerId: formData.closerId || undefined,
        meetingDate: formData.meetingDate || undefined,
        saleDate: formData.saleDate || undefined,
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

  const handleStageChange = (stageId: string) => {
    const stage = selectedPipeline?.stages.find(s => s.id === stageId)
    setSelectedStage(stage || null)
    handleInputChange("stageId", stageId)
  }

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="w-[40vw] min-w-[500px] max-w-[800px]">
        <SheetHeader>
          <SheetTitle className="text-xl" style={{ color: brandColor }}>Editar Contato</SheetTitle>
          <SheetDescription>
            Atualize as informações do contato abaixo. Selecione o pipeline e estágio apropriados. Alguns estágios podem exigir SDR ou Closer.
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
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="john@example.com"
                className="h-11 text-base"
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
              <Label htmlFor="edit-pipeline" className="text-sm font-semibold">
                Pipeline <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.pipelineId}
                onValueChange={handlePipelineChange}
              >
                <SelectTrigger id="edit-pipeline" className="h-11 cursor-pointer">
                  <SelectValue placeholder="Selecione um pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.length === 0 ? (
                    <SelectItem value="no-pipelines" disabled>
                      Nenhum pipeline configurado
                    </SelectItem>
                  ) : (
                    pipelines.map(pipeline => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pipeline.color }} />
                          {pipeline.name}
                          {pipeline.isDefault && <span className="text-xs text-muted-foreground">(Padrão)</span>}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="edit-stage" className="text-sm font-semibold">
                Estágio <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.stageId}
                onValueChange={handleStageChange}
                disabled={!selectedPipeline}
              >
                <SelectTrigger id="edit-stage" className="h-11">
                  <SelectValue placeholder="Selecione um estágio" />
                </SelectTrigger>
                <SelectContent>
                  {!selectedPipeline ? (
                    <SelectItem value="no-pipeline" disabled>
                      Selecione um pipeline primeiro
                    </SelectItem>
                  ) : selectedPipeline.stages.length === 0 ? (
                    <SelectItem value="no-stages" disabled>
                      Este pipeline não tem estágios configurados
                    </SelectItem>
                  ) : (
                    selectedPipeline.stages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                          {stage.name}
                          {stage.countsAsMeeting && <span className="text-xs text-muted-foreground">(Reunião)</span>}
                          {stage.countsAsSale && <span className="text-xs text-muted-foreground">(Venda)</span>}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="edit-leadSource" className="text-sm font-semibold">
                Origem do Lead
              </Label>
              <Select
                value={formData.leadSource}
                onValueChange={(value) => handleInputChange("leadSource", value)}
              >
                <SelectTrigger id="edit-leadSource" className="h-11">
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbound">Inbound (Lead veio até nós)</SelectItem>
                  <SelectItem value="outbound">Outbound (Procuramos o lead)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campo de Data de Reunião - condicional */}
            {(selectedStage?.countsAsMeeting || selectedStage?.countsAsSale) && (
              <div className="space-y-3">
                <Label htmlFor="edit-meetingDate" className="text-sm font-semibold">
                  Data da Reunião <span className="text-destructive">*</span>
                  {selectedStage?.countsAsSale && (
                    <span className="text-xs text-muted-foreground ml-2">(Toda venda teve uma reunião antes)</span>
                  )}
                </Label>
                <Input
                  id="edit-meetingDate"
                  type="datetime-local"
                  value={formData.meetingDate}
                  onChange={(e) => handleInputChange("meetingDate", e.target.value)}
                  className="h-11 text-base"
                  required
                />
              </div>
            )}

            {/* Campos de Venda - condicional quando estágio representa venda */}
            {(selectedStage?.countsAsSale || selectedStage?.requiresDealValue || formData.status === "won" || formData.status === "lost") && (
              <>
                {selectedStage?.countsAsSale && (
                  <div className="space-y-3">
                    <Label htmlFor="edit-saleDate" className="text-sm font-semibold">
                      Data da Venda <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-saleDate"
                      type="datetime-local"
                      value={formData.saleDate}
                      onChange={(e) => handleInputChange("saleDate", e.target.value)}
                      className="h-11 text-base"
                      required
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="edit-dealValue" className="text-sm font-semibold">
                    Valor da Venda {(selectedStage?.countsAsSale || selectedStage?.requiresDealValue || formData.status === "won") && <span className="text-destructive">*</span>}
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
                    required={selectedStage?.countsAsSale || selectedStage?.requiresDealValue || formData.status === "won"}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-dealDuration" className="text-sm font-semibold">
                    Duração (em meses) {(selectedStage?.countsAsSale || formData.status === "won") && <span className="text-destructive">*</span>}
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
                    required={selectedStage?.countsAsSale || formData.status === "won"}
                  />
                </div>
              </>
            )}

            {/* Campo de Observações */}
            <div className="space-y-3">
              <Label htmlFor="edit-notes" className="text-sm font-semibold">
                Observações
              </Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Adicione observações sobre este lead..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="edit-sdr" className="text-sm font-semibold">
                SDR (Sales Development Representative)
              </Label>
              <Select
                value={formData.sdrId || ""}
                onValueChange={(value) => handleInputChange("sdrId", value)}
              >
                <SelectTrigger id="edit-sdr" className="h-11 cursor-pointer">
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
                Closer (Account Executive)
              </Label>
              <Select
                value={formData.closerId || ""}
                onValueChange={(value) => handleInputChange("closerId", value)}
              >
                <SelectTrigger id="edit-closer" className="h-11 cursor-pointer">
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

          <SheetFooter className="flex-row px-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: brandColor }}
            >
              {isSubmitting ? "Atualizando..." : "Atualizar Contato"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSheetOpenChange(false)}
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
