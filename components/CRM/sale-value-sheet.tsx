"use client"

import React, { useState, useEffect } from "react"
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
import { useTheme } from "@/hooks/use-theme"
import type { Contact, PipelineStage } from "@/lib/types"
import { DollarSign, Calendar } from "lucide-react"

interface SaleValueSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact | null
  targetStage: PipelineStage | null
  onConfirm: (dealValue: number, dealDuration: number) => void
}

export function SaleValueSheet({
  open,
  onOpenChange,
  contact,
  targetStage,
  onConfirm,
}: SaleValueSheetProps) {
  const { brandColor } = useTheme()
  const [dealValue, setDealValue] = useState("")
  const [dealDuration, setDealDuration] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when sheet opens
  useEffect(() => {
    if (open && contact) {
      setDealValue(contact.dealValue?.toString() || "")
      setDealDuration(contact.dealDuration?.toString() || "")
    }
  }, [open, contact])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const valueNum = parseFloat(dealValue)
    const durationNum = parseInt(dealDuration)

    // Validação
    if (!dealValue || isNaN(valueNum) || valueNum <= 0) {
      alert("Por favor, insira um valor de venda válido")
      return
    }

    if (!dealDuration || isNaN(durationNum) || durationNum <= 0) {
      alert("Por favor, insira uma duração válida")
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirm(valueNum, durationNum)
      // Reset form
      setDealValue("")
      setDealDuration("")
      onOpenChange(false)
    } catch (error) {
      console.error("Error confirming sale:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setDealValue("")
    setDealDuration("")
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-xl" style={{ color: brandColor }}>
            Confirmar Venda
          </SheetTitle>
          <SheetDescription>
            Este lead está sendo movido para o estágio <strong>{targetStage?.name}</strong> que contabiliza como venda.
            Por favor, preencha os dados da venda.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          {/* Informações do Lead */}
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Lead: {contact?.name}</p>
            {contact?.company && (
              <p className="text-sm text-muted-foreground">
                Empresa: {contact.company}
              </p>
            )}
          </div>

          {/* Valor da Venda */}
          <div className="space-y-2">
            <Label htmlFor="dealValue" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor da Venda <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dealValue"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              required
              disabled={isSubmitting}
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">
              Insira o valor total da venda em reais (R$)
            </p>
          </div>

          {/* Duração do Contrato */}
          <div className="space-y-2">
            <Label htmlFor="dealDuration" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Duração do Contrato (meses) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dealDuration"
              type="number"
              min="1"
              placeholder="12"
              value={dealDuration}
              onChange={(e) => setDealDuration(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Insira a duração do contrato em meses
            </p>
          </div>

          <SheetFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              style={{ backgroundColor: brandColor }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Confirmando..." : "Confirmar Venda"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
