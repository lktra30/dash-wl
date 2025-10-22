"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, Calendar, FileText } from "lucide-react"

interface Activity {
  id: string
  type: "call" | "email" | "meeting" | "note"
  title: string
  description: string
  createdAt: Date
}

interface ViewActivitySheetProps {
  activity: Activity | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewActivitySheet({
  activity,
  open,
  onOpenChange,
}: ViewActivitySheetProps) {
  if (!activity) return null

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call":
        return Phone
      case "email":
        return Mail
      case "meeting":
        return Calendar
      case "note":
        return FileText
      default:
        return FileText
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "call":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "email":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "meeting":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "note":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case "call":
        return "Ligação"
      case "email":
        return "E-mail"
      case "meeting":
        return "Reunião"
      case "note":
        return "Nota"
      default:
        return type
    }
  }

  const Icon = getActivityIcon(activity.type)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <SheetTitle className="text-xl">Detalhes da Atividade</SheetTitle>
          </div>
          <SheetDescription>
            Informações completas sobre esta atividade.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-12rem)]">
          <div className="flex-1 overflow-y-auto space-y-6 px-4 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-muted-foreground">
                Tipo
              </Label>
              <Badge className={getActivityColor(activity.type)}>
                {getActivityTypeLabel(activity.type)}
              </Badge>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-muted-foreground">
                Título
              </Label>
              <p className="text-base">{activity.title}</p>
            </div>

            {activity.description && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground">
                  Descrição
                </Label>
                <p className="text-base whitespace-pre-wrap">{activity.description}</p>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-muted-foreground">
                Data e Hora
              </Label>
              <p className="text-base">
                {activity.createdAt.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}{" "}
                às{" "}
                {activity.createdAt.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <SheetFooter className="flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11"
            >
              Fechar
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
