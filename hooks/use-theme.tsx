"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useAuth } from "./use-auth"
import { supabaseDataService } from "@/lib/supabase-data-service"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  brandColor: string
  setBrandColor: (color: string) => Promise<void>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [brandColor, setBrandColorState] = useState("#3b82f6")
  const [mounted, setMounted] = useState(false)

  const auth = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && auth.whitelabel?.brand_color) {
      setBrandColorState(auth.whitelabel.brand_color)
    }
  }, [mounted, auth.whitelabel])

  useEffect(() => {
    if (!mounted) return

    const stored = localStorage.getItem("crm-theme")
    if (stored === "dark" || stored === "light") {
      setTheme(stored)
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted) return

    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem("crm-theme", theme)
  }, [mounted, theme])

  useEffect(() => {
    if (!mounted) return

    document.documentElement.style.setProperty("--color-primary", brandColor)
    document.documentElement.style.setProperty("--color-sidebar-primary", brandColor)
  }, [mounted, brandColor])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
  }

  const setBrandColor = async (color: string) => {
    setBrandColorState(color)
    if (auth.whitelabel) {
      try {
        await supabaseDataService.updateWhitelabel(auth.whitelabel.id, { brand_color: color })
      } catch (error) {
        console.error("[v0] Error updating brand color:", error)
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, brandColor, setBrandColor }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
