"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Crown, Edit, Trash2 } from "lucide-react"
import { Team } from "@/lib/types"
import Image from "next/image"

interface TeamCardProps {
  team: Team & {
    stats?: {
      totalRevenue: number
      closedDeals: number
      activeDeals: number
      totalDeals?: number
    }
    members?: Array<{
      id: string
      name: string
      email: string
      avatar_url?: string
    }>
    leader?: {
      id: string
      name: string
      email: string
      avatar_url?: string
    }
  }
  businessModel?: "TCV" | "MRR"
  isAdmin?: boolean
  onEdit?: (team: Team & { stats?: any; members?: any; leader?: any }) => void
  onDelete?: (teamId: string) => void
  onManageMembers?: (teamId: string) => void
}

export function TeamCard({ team, businessModel = "TCV", isAdmin, onEdit, onDelete, onManageMembers }: TeamCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Define labels based on business model
  const revenueLabel = businessModel === "TCV" ? "Receita" : "MRR"

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {team.logoUrl ? (
              <div className="w-12 h-12 rounded-lg overflow-hidden relative">
                <Image
                  src={team.logoUrl}
                  alt={team.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: team.color }}
              >
                <Users className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {team.name}
                {team.leader && (
                  <span title={`Leader: ${team.leader.name}`}>
                    <Crown className="h-4 w-4 text-yellow-500" />
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-sm">
                {team.memberIds?.length || 0} {team.memberIds?.length === 1 ? "membro" : "membros"}
              </CardDescription>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit?.(team)}
                title="Editar equipe"
                className="cursor-pointer"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete?.(team.id)}
                title="Excluir equipe"
                className="cursor-pointer"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {team.description && (
            <p className="text-sm text-muted-foreground">{team.description}</p>
          )}

          {team.stats && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">{revenueLabel}</p>
                <p className="font-semibold text-lg">
                  ${team.stats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Negócios Fechados</p>
                <p className="font-semibold text-lg">{team.stats.closedDeals}</p>
              </div>
            </div>
          )}

          {/* Team Members */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium">Membros</p>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onManageMembers?.(team.id)}
                  className="h-6 text-xs cursor-pointer"
                >
                  Gerenciar
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {team.members && team.members.length > 0 ? (
                <>
                  {team.members.slice(0, 5).map((member) => (
                    <Avatar key={member.id} className="h-8 w-8" title={member.name}>
                      <AvatarImage src={member.avatar_url} alt={member.name} />
                      <AvatarFallback style={{ backgroundColor: team.color }}>
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {team.members.length > 5 && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      +{team.members.length - 5}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum membro</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
