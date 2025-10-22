"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Activity,
  Settings,
  LogOut,
  Moon,
  Sun,
  Trophy,
  UserRound,
  BarChart3,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "@/hooks/use-theme"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navigationMain = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "CRM", url: "/dashboard/CRM", icon: Users },
  { title: "Comissões", url: "/dashboard/Comissoes", icon: Briefcase },
  { title: "Equipes", url: "/dashboard/Times", icon: Trophy },
  // { title: "Anúncios", url: "/dashboard/Ads", icon: BarChart3 },
  // { title: "Métricas", url: "/dashboard/Metricas", icon: Activity },
]

const navigationSettings = [
  { title: "Colaboradores", url: "/dashboard/Colaboradores", icon: UserRound },
  { title: "Configurações", url: "/dashboard/Configuracoes", icon: Settings },
]

// Memoize the AppSidebar to prevent unnecessary re-renders during navigation
export const AppSidebar = React.memo(function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, whitelabel, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()

  if (!user || !whitelabel) return null

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="group-data-[collapsible=icon]:px-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="lg" 
              asChild 
              tooltip={whitelabel.name}
              className="group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!justify-center"
            >
              <Link href="/dashboard" className="flex items-center">
                {/* Logo Section */}
                {whitelabel.logoUrl ? (
                  // When logo is available
                  <>
                    {/* Collapsed: Small logo icon */}
                    <div className="aspect-square size-8 items-center justify-center rounded-lg overflow-hidden shrink-0 group-data-[collapsible=icon]:flex hidden bg-sidebar-accent/50">
                      <Image
                        src={whitelabel.logoUrl}
                        alt={whitelabel.name}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                        unoptimized={whitelabel.logoUrl.endsWith('.svg')}
                      />
                    </div>
                    {/* Expanded: Full logo with name */}
                    <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden w-full">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-sidebar-accent/50">
                        <Image
                          src={whitelabel.logoUrl}
                          alt={whitelabel.name}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                          unoptimized={whitelabel.logoUrl.endsWith('.svg')}
                        />
                      </div>
                      <div className="flex flex-col gap-0.5 leading-none flex-1 min-w-0">
                        <span className="font-semibold truncate">{whitelabel.name}</span>
                        <span className="text-xs text-muted-foreground">Dashboard</span>
                      </div>
                    </div>
                  </>
                ) : (
                  // Fallback when no logo - show icon with brand color
                  <>
                    <div
                      className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground shrink-0"
                      style={{ backgroundColor: whitelabel.brandColor }}
                    >
                      <LayoutDashboard className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                      <span className="font-semibold">{whitelabel.name}</span>
                      <span className="text-xs text-muted-foreground">Dashboard</span>
                    </div>
                  </>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationMain.map((item) => {
                const isActive = pathname === item.url
                // Hide Dashboard item when collapsed to merge with header logo
                const isDashboard = item.url === "/dashboard"
                return (
                  <SidebarMenuItem 
                    key={item.title} 
                    className={isDashboard ? "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:-translate-y-16 transition-all duration-500 ease-in-out group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:overflow-hidden" : ""}
                  >
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url} className="flex items-center">
                        <item.icon className="shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationSettings.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url} className="flex items-center">
                        <item.icon className="shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:px-0">
        <SidebarMenu>
          {/* Theme Toggle Button */}
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={toggleTheme} 
              tooltip={theme === "light" ? "Modo Escuro" : "Modo Claro"}
              className="group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!justify-center"
            >
              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
              <span className="group-data-[collapsible=icon]:hidden">{theme === "light" ? "Modo Escuro" : "Modo Claro"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* User Menu */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!justify-center"
                  tooltip={user.name}
                >
                  <Avatar className="h-8 w-8 rounded-lg shrink-0">
                    <AvatarFallback className="rounded-lg" style={{ backgroundColor: whitelabel.brandColor }}>
                      <span className="text-xs text-white">{getUserInitials(user.name)}</span>
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <ChevronRight className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="right"
                align="end"
                sideOffset={4}
              >
                <div className="p-2 text-xs text-muted-foreground">
                  <div className="font-medium text-foreground mb-1">{user.name}</div>
                  <div>{user.email}</div>
                  <div className="mt-1 capitalize">{user.role}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
})
