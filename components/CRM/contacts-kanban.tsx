"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ContactCard } from "./contact-card"
import { SaleValueSheet } from "./sale-value-sheet"
import { useTheme } from "@/hooks/use-theme"
import type { Contact, PipelineWithStages, PipelineStage } from "@/lib/types"
import { toast } from "sonner"

interface ContactsKanbanProps {
  contacts: Contact[]
  onUpdateContact: (id: string, status: Contact["status"]) => Promise<void>
  onContactUpdated: () => void
  dataService: any
}

export function ContactsKanban({ contacts, onUpdateContact, onContactUpdated, dataService }: ContactsKanbanProps) {
  const { brandColor } = useTheme()
  const [draggedContact, setDraggedContact] = React.useState<Contact | null>(null)
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null)

  // Pipeline states
  const [pipelines, setPipelines] = useState<PipelineWithStages[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineWithStages | null>(null)
  const [loading, setLoading] = useState(true)

  // Sale value sheet states
  const [saleSheetOpen, setSaleSheetOpen] = useState(false)
  const [pendingMove, setPendingMove] = useState<{
    contact: Contact
    targetStageId: string
  } | null>(null)

  // Carregar pipelines
  useEffect(() => {
    loadPipelines()
  }, [])

  const loadPipelines = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dashboard/pipelines")
      if (!response.ok) throw new Error("Failed to load pipelines")

      const data = await response.json()
      setPipelines(data)

      // Selecionar pipeline padrão
      const defaultPipeline = data.find((p: PipelineWithStages) => p.isDefault)
      if (defaultPipeline) {
        setSelectedPipeline(defaultPipeline)
      } else if (data.length > 0) {
        setSelectedPipeline(data[0])
      }
    } catch (error) {
      console.error("Error loading pipelines:", error)
      toast.error("Erro ao carregar pipelines")
    } finally {
      setLoading(false)
    }
  }

  // Helper function to check if a contact belongs to a specific stage
  // Supports both new system (stageId) and legacy system (status/funnel_stage)
  const shouldContactBeInStage = (contact: Contact, stage: PipelineStage): boolean => {
    // Priority 1: Use stageId if available (new system)
    if (contact.stageId) {
      return contact.stageId === stage.id
    }

    // Priority 2: Fallback to status field for legacy contacts
    const status = contact.status
    if (!status) {
      return false
    }

    // Map legacy status to new stages
    const stageName = stage.name.toLowerCase()

    switch (status) {
      case 'new_lead':
        // First stage or stage with "novo"/"new" in name
        return stage.orderPosition === 1 ||
               stageName.includes('novo') ||
               stageName.includes('new') ||
               stageName.includes('lead')

      case 'contacted':
        // Second stage or stage with "contato"/"contacted" in name
        return stage.orderPosition === 2 ||
               stageName.includes('contato') ||
               stageName.includes('contacted') ||
               stageName.includes('contact')

      case 'meeting':
        // Stage with meeting flag or stage with "reunião"/"meeting" in name
        return stage.countsAsMeeting === true ||
               stageName.includes('reunião') ||
               stageName.includes('reuniao') ||
               stageName.includes('meeting') ||
               stageName.includes('agendada')

      case 'negotiation':
        // Fourth stage or stage with "negociação"/"negotiation" in name
        return stage.orderPosition === 4 ||
               stageName.includes('negociação') ||
               stageName.includes('negociacao') ||
               stageName.includes('negotiation')

      case 'won':
      case 'closed':
        // Stage with counts_as_sale flag or stage with "ganho"/"won"/"fechado" in name
        return stage.countsAsSale === true ||
               stageName.includes('ganho') ||
               stageName.includes('won') ||
               stageName.includes('fechado') ||
               stageName.includes('venda')

      case 'lost':
        // Stage with "perdido"/"lost" in name
        return stageName.includes('perdido') ||
               stageName.includes('lost')

      case 'disqualified':
        // Stage with "desqualificado"/"disqualified" in name
        return stageName.includes('desqualificado') ||
               stageName.includes('disqualified')

      default:
        return false
    }
  }

  const getContactsByStage = (stageId: string) => {
    const stage = selectedPipeline?.stages.find(s => s.id === stageId)
    if (!stage) return []

    return contacts.filter((contact) => {
      // Check if contact belongs to this pipeline
      // Include contacts with matching pipelineId OR legacy contacts (no pipelineId) if this is the default pipeline
      const belongsToPipeline =
        contact.pipelineId === selectedPipeline?.id ||
        (!contact.pipelineId && selectedPipeline?.isDefault)

      if (!belongsToPipeline) return false

      return shouldContactBeInStage(contact, stage)
    })
  }

  const handleDragStart = (contact: Contact) => {
    setDraggedContact(contact)
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    setDragOverColumn(stageId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, newStageId: string) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (draggedContact && draggedContact.stageId !== newStageId) {
      // Verificar se o estágio de destino contabiliza como venda
      const targetStage = selectedPipeline?.stages.find(s => s.id === newStageId)
      
      if (targetStage?.countsAsSale) {
        // Verificar se o contato já tem dealValue preenchido
        if (!draggedContact.dealValue || draggedContact.dealValue <= 0) {
          // Precisa solicitar o valor da venda
          setPendingMove({
            contact: draggedContact,
            targetStageId: newStageId
          })
          setSaleSheetOpen(true)
          setDraggedContact(null)
          return
        }
      }

      // Se não é venda ou já tem dealValue, proceder normalmente
      await executeStageMove(draggedContact.id, newStageId)
    }
    setDraggedContact(null)
  }

  // Função para executar a movimentação de estágio
  const executeStageMove = async (contactId: string, newStageId: string, dealValue?: number, dealDuration?: number) => {
    try {
      const updateData: any = { stageId: newStageId }
      
      if (dealValue !== undefined) {
        updateData.dealValue = dealValue
      }
      if (dealDuration !== undefined) {
        updateData.dealDuration = dealDuration
      }

      const response = await fetch(`/api/dashboard/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) throw new Error("Failed to update contact")

      // Recarregar contatos
      onContactUpdated()
      toast.success("Contato movido com sucesso!")
    } catch (error) {
      console.error("Error updating contact:", error)
      toast.error("Erro ao mover contato")
    }
  }

  // Função chamada quando o usuário confirma os dados da venda no sheet
  const handleSaleConfirm = async (dealValue: number, dealDuration: number) => {
    if (!pendingMove) return

    await executeStageMove(
      pendingMove.contact.id,
      pendingMove.targetStageId,
      dealValue,
      dealDuration
    )

    // Limpar estado pendente
    setPendingMove(null)
  }

  const handleDragEnd = () => {
    setDraggedContact(null)
    setDragOverColumn(null)
  }

  const handlePipelineChange = (pipelineId: string) => {
    const pipeline = pipelines.find((p) => p.id === pipelineId)
    if (pipeline) {
      setSelectedPipeline(pipeline)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando kanban...</p>
      </div>
    )
  }

  if (!selectedPipeline) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          Nenhum pipeline configurado. Vá para a aba Pipelines para criar um.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden min-h-0">
      {/* Seletor de Pipeline */}
      {pipelines.length > 1 && (
        <div className="flex items-center gap-2 flex-shrink-0 mb-4">
          <span className="text-sm font-medium">Pipeline:</span>
          <Select
            value={selectedPipeline.id}
            onValueChange={handlePipelineChange}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map((pipeline) => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: pipeline.color }}
                    />
                    {pipeline.name}
                    {pipeline.isDefault && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Padrão
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Kanban Columns - Container com scroll horizontal */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden min-h-0">
        <div className="flex flex-row gap-4 h-full pb-4">
          {selectedPipeline.stages.map((stage) => {
            const isBeingDraggedOver = dragOverColumn === stage.id
            const isDraggedFromHere = draggedContact?.stageId === stage.id
            const stageContacts = getContactsByStage(stage.id)

            return (
              <Card
                key={stage.id}
                className={`flex flex-col transition-all duration-200 h-full w-[300px] flex-shrink-0 ${
                  isDraggedFromHere ? "opacity-90" : ""
                }`}
                style={
                  isBeingDraggedOver
                    ? {
                        boxShadow: `0 0 0 2px ${stage.color}`,
                        backgroundColor: `${stage.color}0D`, // 5% opacity
                      }
                    : undefined
                }
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <CardTitle className="text-sm font-medium">
                        {stage.name}
                      </CardTitle>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: `${stage.color}1A`, // 10% opacity
                        color: stage.color,
                        borderColor: `${stage.color}33`, // 20% opacity
                      }}
                    >
                      {stageContacts.length}
                    </Badge>
                  </div>
                  {/* Badges de contabilização */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {stage.countsAsMeeting && (
                      <Badge variant="outline" className="text-xs">
                        Reunião
                      </Badge>
                    )}
                    {stage.countsAsSale && (
                      <Badge variant="outline" className="text-xs">
                        Venda
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 overflow-y-auto flex-1 min-h-0">
                  {stageContacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onContactUpdated={onContactUpdated}
                      dataService={dataService}
                      isDragging={draggedContact?.id === contact.id}
                      currentStage={stage}
                    />
                  ))}

                  {stageContacts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-xs">
                        {isBeingDraggedOver
                          ? "Arraste aqui"
                          : "Sem leads nesta etapa"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Sheet para solicitar valor da venda */}
      <SaleValueSheet
        open={saleSheetOpen}
        onOpenChange={setSaleSheetOpen}
        contact={pendingMove?.contact || null}
        targetStage={selectedPipeline?.stages.find(s => s.id === pendingMove?.targetStageId) || null}
        onConfirm={handleSaleConfirm}
      />
    </div>
  )
}
