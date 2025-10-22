"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

export function AdminAccessRequired() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin Settings
        </CardTitle>
        <CardDescription>Configure your whitelabel CRM instance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Admin Access Required</h3>
          <p className="text-muted-foreground">
            Only administrators can modify whitelabel settings and brand customization.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
