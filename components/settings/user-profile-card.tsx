"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User as UserIcon, Mail, Shield } from "lucide-react"
import type { User } from "@/lib/types"

interface UserProfileCardProps {
  user: User
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "SuperAdmin":
        return <Badge variant="destructive">Super Admin</Badge>
      case "admin":
        return <Badge>Admin</Badge>
      case "gestor":
        return <Badge variant="secondary">Gestor</Badge>
      case "colaborador":
        return <Badge variant="outline">Colaborador</Badge>
      default:
        return <Badge variant="outline">Usuário</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            <CardTitle>Perfil do Usuário</CardTitle>
          </div>
          {getRoleBadge(user.role)}
        </div>
        <CardDescription>Informações da sua conta no sistema</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-muted-foreground">
              <UserIcon className="h-3.5 w-3.5" />
              Nome Completo
            </Label>
            <Input 
              id="name" 
              value={user.name} 
              readOnly 
              className="bg-muted/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              E-mail
            </Label>
            <Input 
              id="email" 
              value={user.email} 
              readOnly 
              className="bg-muted/50"
            />
          </div>
        </div>

        <Separator />

        {/* Role Information */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            Nível de Acesso
          </Label>
          <div className="p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {user.role === "SuperAdmin" && "Super Administrador"}
                {user.role === "admin" && "Administrador"}
                {user.role === "gestor" && "Gestor"}
                {user.role === "colaborador" && "Colaborador"}
                {!user.role && "Usuário"}
              </span>
              {getRoleBadge(user.role)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {user.role === "SuperAdmin" && "Acesso total ao sistema e todos os whitelabels"}
              {user.role === "admin" && "Acesso completo às configurações e gerenciamento"}
              {user.role === "gestor" && "Pode visualizar comissões e gerenciar equipes"}
              {user.role === "colaborador" && "Acesso padrão às funcionalidades do CRM"}
              {!user.role && "Acesso básico ao sistema"}
            </p>
          </div>
        </div>

        {/* Info Note */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            <strong>ℹ️ Nota:</strong> Para alterar suas informações de perfil ou permissões, entre em contato com um administrador.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
