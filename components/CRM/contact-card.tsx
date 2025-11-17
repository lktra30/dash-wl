"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Building, Pencil, Calendar, DollarSign } from "lucide-react"
import { EditContactSheet } from "./edit-contact-sheet"
import { useTheme } from "@/hooks/use-theme"
import type { Contact, PipelineStage } from "@/lib/types"

interface ContactCardProps {
  contact: Contact
  onDragStart: (contact: Contact) => void
  onDragEnd?: () => void
  onContactUpdated: () => void
  dataService: any
  isDragging?: boolean
  currentStage?: PipelineStage // Optional - to check if we should show deal value
}

export function ContactCard({ 
  contact, 
  onDragStart, 
  onDragEnd,
  onContactUpdated, 
  dataService,
  isDragging = false,
  currentStage
}: ContactCardProps) {
  const { brandColor } = useTheme()
  const [isEditing, setIsEditing] = React.useState(false)

  return (
    <>
      <Card
        className={`cursor-move hover:shadow-md transition-all duration-200 ${
          isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"
        }`}
        style={{
          borderLeft: `4px solid ${brandColor}33` // 20% opacity
        }}
        draggable
        onDragStart={() => onDragStart(contact)}
        onDragEnd={onDragEnd}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-sm">{contact.name}</h4>
                {contact.company && (
                  <div className="flex items-center gap-1 mt-1">
                    <Building className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{contact.company}</span>
                  </div>
                )}
              </div>
              <div 
                className="h-6 w-6 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `${brandColor}1A`, // 10% opacity
                  color: brandColor
                }}
              >
                <span className="text-xs font-medium">
                  {contact.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{contact.email}</span>
              </div>
              {contact.phone && (
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{contact.phone}</span>
                </div>
              )}
              {(contact as any).meetingDate && (
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="h-3 w-3 text-blue-500" />
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    Reunião: {new Date((contact as any).meetingDate).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              {(contact as any).saleDate && (
                <div className="flex items-center gap-2 text-xs">
                  <DollarSign className="h-3 w-3 text-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Venda: {new Date((contact as any).saleDate).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              {contact.dealValue && contact.dealValue > 0 && currentStage?.countsAsSale && (
                <div className="flex items-center gap-2 text-xs">
                  <DollarSign className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(contact.dealValue)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                {new Date(contact.createdAt).toLocaleDateString()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <EditContactSheet
          contact={contact}
          open={isEditing}
          onOpenChange={setIsEditing}
          onContactUpdated={onContactUpdated}
          dataService={dataService}
        />
      )}
    </>
  )
}
