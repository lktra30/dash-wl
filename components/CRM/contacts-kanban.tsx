"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ContactCard } from "./contact-card"
import { useTheme } from "@/hooks/use-theme"
import type { Contact } from "@/lib/types"

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

  const kanbanColumns = [
    { id: "new_lead", title: "Novo Lead", status: "new_lead" as const },
    { id: "contacted", title: "Contatado", status: "contacted" as const },
    { id: "meeting", title: "Reunião Agendada", status: "meeting" as const },
    { id: "negotiation", title: "Negociação", status: "negotiation" as const },
    { id: "won", title: "Ganho", status: "won" as const },
    { id: "lost", title: "Perdido", status: "lost" as const },
    { id: "disqualified", title: "Desqualificado", status: "disqualified" as const },
  ]

  const getContactsByStatus = (status: string) => {
    return contacts.filter((contact) => contact.status === status)
  }

  const handleDragStart = (contact: Contact) => {
    setDraggedContact(contact)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, newStatus: Contact["status"]) => {
    e.preventDefault()
    setDragOverColumn(null)
    
    if (draggedContact && draggedContact.status !== newStatus) {
      try {
        // Optimistic update happens in parent component
        await onUpdateContact(draggedContact.id, newStatus)
      } catch (error) {
      }
    }
    setDraggedContact(null)
  }

  const handleDragEnd = () => {
    setDraggedContact(null)
    setDragOverColumn(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
      {kanbanColumns.map((column) => {
        const isBeingDraggedOver = dragOverColumn === column.id
        const isDraggedFromHere = draggedContact?.status === column.status
        
        return (
          <Card
            key={column.id}
            className={`min-h-[600px] transition-all duration-200 ${
              isDraggedFromHere
                ? "opacity-90"
                : ""
            }`}
            style={isBeingDraggedOver ? {
              boxShadow: `0 0 0 2px ${brandColor}`,
              backgroundColor: `${brandColor}0D` // 5% opacity
            } : undefined}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{ 
                    backgroundColor: `${brandColor}1A`, // 10% opacity
                    color: brandColor,
                    borderColor: `${brandColor}33` // 20% opacity
                  }}
                >
                  {getContactsByStatus(column.status).length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {getContactsByStatus(column.status).map((contact) => (
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

              {getContactsByStatus(column.status).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-xs">
                    {isBeingDraggedOver ? "Arraste aqui" : "Sem leads nesta etapa"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
