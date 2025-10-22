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
          Admin Settings
        </CardTitle>
        <CardDescription>Configure your whitelabel CRM instance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="whitelabel-name">Dashboard Name</Label>
          <Input
            id="whitelabel-name"
            value={whitelabelName}
            onChange={(e) => onWhitelabelNameChange(e.target.value)}
            placeholder="Enter your dashboard name"
          />
        </div>
      </CardContent>
    </Card>
  )
}
