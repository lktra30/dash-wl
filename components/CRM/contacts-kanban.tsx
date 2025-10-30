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
import { useTheme } from "@/hooks/use-theme"
import type { Contact, PipelineWithStages } from "@/lib/types"
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

  const getContactsByStage = (stageId: string) => {
    return contacts.filter((contact) => contact.stageId === stageId)
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
      try {
        // Atualizar contact com novo stageId
        const response = await fetch(`/api/dashboard/contacts/${draggedContact.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stageId: newStageId }),
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
    setDraggedContact(null)
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
    <div className="space-y-4">
      {/* Seletor de Pipeline */}
      {pipelines.length > 1 && (
        <div className="flex items-center gap-2">
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

      {/* Kanban Columns */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${selectedPipeline.stages.length}, minmax(280px, 1fr))`,
          overflowX: "auto",
        }}
      >
        {selectedPipeline.stages.map((stage) => {
          const isBeingDraggedOver = dragOverColumn === stage.id
          const isDraggedFromHere = draggedContact?.stageId === stage.id
          const stageContacts = getContactsByStage(stage.id)

          return (
            <Card
              key={stage.id}
              className={`min-h-[600px] transition-all duration-200 ${
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
              <CardHeader className="pb-3">
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
              <CardContent className="space-y-3">
                {stageContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onContactUpdated={onContactUpdated}
                    dataService={dataService}
                    isDragging={draggedContact?.id === contact.id}
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
  )
}
