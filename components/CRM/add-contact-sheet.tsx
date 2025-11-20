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
import { Textarea } from "@/components/ui/textarea"
import type { Contact, PipelineWithStages, PipelineStage } from "@/lib/types"

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
  const [pipelines, setPipelines] = React.useState<PipelineWithStages[]>([])
  const [selectedPipeline, setSelectedPipeline] = React.useState<PipelineWithStages | null>(null)
  const [selectedStage, setSelectedStage] = React.useState<PipelineStage | null>(null)
  const [error, setError] = React.useState<string>("")
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    pipelineId: "",
    stageId: "",
    status: "new_lead" as Contact["status"],
    leadSource: "" as "" | "inbound" | "outbound",
    sdrId: "",
    closerId: "",
    meetingDate: "",
    saleDate: "",
    dealValue: 0,
    dealDuration: 0,
    notes: "",
  })

  // Load employees and pipelines when sheet opens
  React.useEffect(() => {
    if (open) {
      loadEmployees()
      loadPipelines()
      setError("") // Clear any previous errors
    } else {
      // Reset form when closing
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        pipelineId: "",
        stageId: "",
        status: "new_lead",
        leadSource: "",
        sdrId: "",
        closerId: "",
        meetingDate: "",
        saleDate: "",
        dealValue: 0,
        dealDuration: 0,
        notes: "",
      })
      setSelectedPipeline(null)
      setSelectedStage(null)
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

  const loadPipelines = async () => {
    try {
      const response = await fetch('/api/dashboard/pipelines')
      if (response.ok) {
        const data = await response.json()
        setPipelines(data)

        // Selecionar pipeline padrão automaticamente
        const defaultPipeline = data.find((p: PipelineWithStages) => p.isDefault)
        if (defaultPipeline) {
          setSelectedPipeline(defaultPipeline)
          setFormData(prev => ({
            ...prev,
            pipelineId: defaultPipeline.id,
            // Selecionar primeiro stage por padrão
            stageId: defaultPipeline.stages[0]?.id || "",
          }))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pipelines:', error)
    }
  }

  const handlePipelineChange = (pipelineId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId)
    setSelectedPipeline(pipeline || null)
    setFormData(prev => ({
      ...prev,
      pipelineId,
      stageId: pipeline?.stages[0]?.id || "",
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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

    if (!dataService) return

    setIsSubmitting(true)
    setError("") // Clear any previous errors
    try {
      await dataService.createContact({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        pipelineId: formData.pipelineId,
        stageId: formData.stageId,
        status: formData.status,
        leadSource: formData.leadSource || undefined,
        sdrId: formData.sdrId || undefined,
        closerId: formData.closerId || undefined,
        meetingDate: formData.meetingDate || undefined,
        saleDate: formData.saleDate || undefined,
        dealValue: (currentStage?.countsAsSale || currentStage?.requiresDealValue) ? formData.dealValue : undefined,
        dealDuration: currentStage?.countsAsSale ? formData.dealDuration : undefined,
        notes: formData.notes || undefined,
      })

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        pipelineId: "",
        stageId: "",
        status: "new_lead",
        leadSource: "",
        sdrId: "",
        closerId: "",
        meetingDate: "",
        saleDate: "",
        dealValue: 0,
        dealDuration: 0,
        notes: "",
      })
      setSelectedPipeline(null)

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

  const handleStageChange = (stageId: string) => {
    const stage = selectedPipeline?.stages.find(s => s.id === stageId)
    setSelectedStage(stage || null)
    handleInputChange("stageId", stageId)
  }

  if (!canCreate) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button style={{ backgroundColor: brandColor }} className="hover:opacity-90 cursor-pointer">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Adicionar Contato</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[90vw] sm:max-w-[500px] lg:max-w-[800px]">
        <SheetHeader>
          <SheetTitle className="text-xl" style={{ color: brandColor }}>Adicionar Novo Contato</SheetTitle>
          <SheetDescription>
            Insira as informações do contato abaixo. Selecione o pipeline e estágio apropriados. Alguns estágios podem exigir SDR ou Closer.
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
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="john@example.com"
                className="h-11 text-base"
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
              <Label htmlFor="pipeline" className="text-sm font-semibold">
                Pipeline <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.pipelineId}
                onValueChange={handlePipelineChange}
              >
                <SelectTrigger id="pipeline" className="h-11 cursor-pointer">
                  <SelectValue placeholder="Selecione um pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.length === 0 ? (
                    <SelectItem value="no-pipelines" disabled>
                      Nenhum pipeline configurado
                    </SelectItem>
                  ) : (
                    pipelines.map(pipeline => (
                      <SelectItem key={pipeline.id} value={pipeline.id} className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
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
              <Label htmlFor="stage" className="text-sm font-semibold">
                Estágio <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.stageId}
                onValueChange={handleStageChange}
                disabled={!selectedPipeline}
              >
                <SelectTrigger id="stage" className="h-11 cursor-pointer">
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
                      <SelectItem key={stage.id} value={stage.id} className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
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
              <Label htmlFor="leadSource" className="text-sm font-semibold">
                Origem do Lead
              </Label>
              <Select
                value={formData.leadSource}
                onValueChange={(value) => handleInputChange("leadSource", value)}
              >
                <SelectTrigger id="leadSource" className="h-11 cursor-pointer">
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbound" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Inbound (Lead veio até nós)</SelectItem>
                  <SelectItem value="outbound" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Outbound (Procuramos o lead)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campo de Data de Reunião - condicional */}
            {(selectedStage?.countsAsMeeting || selectedStage?.countsAsSale) && (
              <div className="space-y-3">
                <Label htmlFor="meetingDate" className="text-sm font-semibold">
                  Data da Reunião <span className="text-destructive">*</span>
                  {selectedStage?.countsAsSale && (
                    <span className="text-xs text-muted-foreground ml-2">(Toda venda teve uma reunião antes)</span>
                  )}
                </Label>
                <Input
                  id="meetingDate"
                  type="datetime-local"
                  value={formData.meetingDate}
                  onChange={(e) => handleInputChange("meetingDate", e.target.value)}
                  className="h-11 text-base"
                  required
                />
              </div>
            )}

            {/* Campos de Venda - condicional quando estágio representa venda */}
            {(selectedStage?.countsAsSale || selectedStage?.requiresDealValue) && (
              <>
                {selectedStage?.countsAsSale && (
                  <div className="space-y-3">
                    <Label htmlFor="saleDate" className="text-sm font-semibold">
                      Data da Venda <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="saleDate"
                      type="datetime-local"
                      value={formData.saleDate}
                      onChange={(e) => handleInputChange("saleDate", e.target.value)}
                      className="h-11 text-base"
                      required
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="dealValue" className="text-sm font-semibold">
                    Valor da Venda {(selectedStage?.countsAsSale || selectedStage?.requiresDealValue) && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="dealValue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.dealValue}
                    onChange={(e) => handleInputChange("dealValue", e.target.value)}
                    placeholder="0.00"
                    className="h-11 text-base"
                    required={selectedStage?.countsAsSale || selectedStage?.requiresDealValue}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="dealDuration" className="text-sm font-semibold">
                    Duração (em meses) {selectedStage?.countsAsSale && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="dealDuration"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.dealDuration}
                    onChange={(e) => handleInputChange("dealDuration", e.target.value)}
                    placeholder="0"
                    className="h-11 text-base"
                    required={selectedStage?.countsAsSale}
                  />
                </div>
              </>
            )}

            {/* Campo de Observações */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-sm font-semibold">
                Observações
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Adicione observações sobre este lead..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="sdr" className="text-sm font-semibold">
                SDR (Sales Development Representative)
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
                Closer (Account Executive)
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
