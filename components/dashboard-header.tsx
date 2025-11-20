"use client"

import type React from "react"

import { useAuth } from "@/hooks/use-auth"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface DashboardHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function DashboardHeader({ title, description, children }: DashboardHeaderProps) {
  const { user } = useAuth()

  return (
    <div className="w-full max-w-full flex-shrink-0 rounded-t-xl border-b border-border bg-background overflow-x-hidden">
      <div className="mt-4 flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 py-3 max-w-full">
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          <SidebarTrigger className="-ml-1 flex-shrink-0" />
          <Separator orientation="vertical" className="h-4 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground truncate">{title}</h1>
            {description && <p className="text-sm text-muted-foreground truncate hidden sm:block">{description}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {children}
        </div>
      </div>
    </div>
  )
}
