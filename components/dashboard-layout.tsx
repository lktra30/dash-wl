"use client"

import type React from "react"
import { startTransition } from "react"
import { useAuth } from "@/hooks/use-auth"
import { AppSidebar } from "./app-sidebar"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      // Use startTransition for smoother navigation
      startTransition(() => {
        router.push("/")
      })
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="p-1 md:p-2 bg-sidebar min-h-screen">
          <div className="bg-background rounded-xl flex flex-col min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)]">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
