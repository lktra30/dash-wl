"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

export function AdminAccessRequired() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Configurações de Administrador
        </CardTitle>
        <CardDescription>Configure sua instância de CRM whitelabel</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Acesso de Administrador Necessário</h3>
          <p className="text-muted-foreground">
            Apenas administradores podem modificar as configurações de whitelabel e personalização de marca.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
