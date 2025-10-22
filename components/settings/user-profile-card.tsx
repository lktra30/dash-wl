"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User as UserIcon } from "lucide-react"
import type { User } from "@/lib/types"

interface UserProfileCardProps {
  user: User
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          Perfil do Usuário
        </CardTitle>
        <CardDescription>Informações da sua conta</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={user.name} readOnly />
          </div>
          <div className="space-y-3">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={user.email} readOnly />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
