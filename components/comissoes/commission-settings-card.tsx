"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CommissionSettings } from "@/lib/types"
import { useState, useEffect } from "react"
import { Settings, Save, AlertCircle } from "lucide-react"

interface CommissionSettingsCardProps {
  settings: CommissionSettings | null
  onSave: (settings: Partial<CommissionSettings>) => Promise<void>
  isAdmin: boolean
  brandColor?: string
}

export function CommissionSettingsCard({ 
  settings, 
  onSave, 
  isAdmin,
  brandColor = '#3b82f6'
}: CommissionSettingsCardProps) {
  const [formData, setFormData] = useState<Partial<CommissionSettings>>({
    checkpoint1Percent: 50,
    checkpoint2Percent: 75,
    checkpoint3Percent: 100,
    checkpoint1CommissionPercent: 50,
    checkpoint2CommissionPercent: 75,
    checkpoint3CommissionPercent: 100,
    sdrMeetingCommission: 50,
    sdrMeetingsTarget: 20,
    sdrBonusClosedMeeting: 100,
    closerCommissionPercent: 10,
    closerSalesTarget: 10000,
    closerFixedCommission: 0,
    closerPerSaleCommission: 0,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    if (settings) {
      setFormData({
        ...settings,
        closerFixedCommission: settings.closerFixedCommission ?? 0,
        closerPerSaleCommission: settings.closerPerSaleCommission ?? 0,
      })
    }
  }, [settings])

  const handleChange = (field: keyof CommissionSettings, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }))
  }

  const handleSave = async () => {
    if (!isAdmin) return
    
    setIsSaving(true)
    setSaveMessage(null)
    
    try {
      await onSave(formData)
      setSaveMessage("Configurações salvas com sucesso!")
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage("Erro ao salvar configurações. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Comissão
          </CardTitle>
          <CardDescription>Acesso de administrador necessário para ver as configurações</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações de Comissão
        </CardTitle>
        <CardDescription>Configure a estrutura de comissões e metas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {saveMessage && (
          <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-md text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Checkpoints Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Limites dos Checkpoints</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="checkpoint1">Checkpoint 1 (%)</Label>
              <Input
                id="checkpoint1"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.checkpoint1Percent ?? 50}
                onChange={(e) => handleChange('checkpoint1Percent', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkpoint2">Checkpoint 2 (%)</Label>
              <Input
                id="checkpoint2"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.checkpoint2Percent ?? 75}
                onChange={(e) => handleChange('checkpoint2Percent', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkpoint3">Checkpoint 3 (%)</Label>
              <Input
                id="checkpoint3"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.checkpoint3Percent ?? 100}
                onChange={(e) => handleChange('checkpoint3Percent', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Checkpoint Commission Multipliers */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Multiplicadores de Comissão em Cada Checkpoint</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cp1Commission">Comissão CP1 (%)</Label>
              <Input
                id="cp1Commission"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.checkpoint1CommissionPercent ?? 50}
                onChange={(e) => handleChange('checkpoint1CommissionPercent', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp2Commission">Comissão CP2 (%)</Label>
              <Input
                id="cp2Commission"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.checkpoint2CommissionPercent ?? 75}
                onChange={(e) => handleChange('checkpoint2CommissionPercent', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp3Commission">Comissão CP3 (%)</Label>
              <Input
                id="cp3Commission"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.checkpoint3CommissionPercent ?? 100}
                onChange={(e) => handleChange('checkpoint3CommissionPercent', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SDR Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Configurações de Comissão SDR</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sdrMeetingCommission">Por Reunião (R$)</Label>
              <Input
                id="sdrMeetingCommission"
                type="number"
                min="0"
                step="0.01"
                value={formData.sdrMeetingCommission ?? 50}
                onChange={(e) => handleChange('sdrMeetingCommission', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sdrMeetingsTarget">Meta Mensal</Label>
              <Input
                id="sdrMeetingsTarget"
                type="number"
                min="1"
                value={formData.sdrMeetingsTarget ?? 20}
                onChange={(e) => handleChange('sdrMeetingsTarget', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sdrBonus">Bônus por Reunião Fechada (R$)</Label>
              <Input
                id="sdrBonus"
                type="number"
                min="0"
                step="0.01"
                value={formData.sdrBonusClosedMeeting ?? 100}
                onChange={(e) => handleChange('sdrBonusClosedMeeting', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Closer Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Configurações de Comissão Closer</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="closerFixed">Comissão Fixa Mensal (R$)</Label>
              <Input
                id="closerFixed"
                type="number"
                min="0"
                step="0.01"
                value={formData.closerFixedCommission ?? 0}
                onChange={(e) => handleChange('closerFixedCommission', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Valor fixo garantido por mês</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="closerPerSale">Comissão por Venda (R$)</Label>
              <Input
                id="closerPerSale"
                type="number"
                min="0"
                step="0.01"
                value={formData.closerPerSaleCommission ?? 0}
                onChange={(e) => handleChange('closerPerSaleCommission', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Valor fixo por cada venda fechada</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="closerPercent">Comissão Percentual (%)</Label>
              <Input
                id="closerPercent"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.closerCommissionPercent ?? 10}
                onChange={(e) => handleChange('closerCommissionPercent', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Percentual sobre o valor de vendas</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="closerTarget">Meta Mensal de Vendas (R$)</Label>
              <Input
                id="closerTarget"
                type="number"
                min="0"
                step="0.01"
                value={formData.closerSalesTarget ?? 10000}
                onChange={(e) => handleChange('closerSalesTarget', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Meta mensal em reais</p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full md:w-auto"
          style={{ 
            backgroundColor: brandColor,
            borderColor: brandColor 
          }}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </CardContent>
    </Card>
  )
}
