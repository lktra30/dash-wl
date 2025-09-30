"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "@/hooks/use-theme"
import { LayoutDashboard, Users, Briefcase, Activity, Settings, LogOut, Moon, Sun, Trophy } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Contacts", href: "/dashboard/contacts", icon: Users },
  { name: "Deals", href: "/dashboard/deals", icon: Briefcase },
  { name: "Activities", href: "/dashboard/activities", icon: Activity },
  { name: "Equipes", href: "/dashboard/teams", icon: Trophy },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DashboardSidebar() {
  const { user, whitelabel, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()

  if (!user || !whitelabel) return null

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <h1 className="text-lg font-semibold text-sidebar-foreground truncate">{whitelabel.name}</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-sidebar-foreground">{user.name}</p>
          <p className="text-xs text-sidebar-foreground/60">{user.email}</p>
          <p className="text-xs text-sidebar-foreground/60 capitalize">{user.role}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="flex-1 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="flex-1 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
