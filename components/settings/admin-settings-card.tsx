"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield } from "lucide-react"

interface AdminSettingsCardProps {
  whitelabelName: string
  onWhitelabelNameChange: (name: string) => void
}

export function AdminSettingsCard({ whitelabelName, onWhitelabelNameChange }: AdminSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Configurações de Administrador
        </CardTitle>
        <CardDescription>Configure sua instância de CRM whitelabel</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="whitelabel-name">Nome do Dashboard</Label>
          <Input
            id="whitelabel-name"
            value={whitelabelName}
            onChange={(e) => onWhitelabelNameChange(e.target.value)}
            placeholder="Digite o nome do seu dashboard"
          />
        </div>
      </CardContent>
    </Card>
  )
}
