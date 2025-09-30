"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { supabaseDataService } from "@/lib/supabase-data-service"
import type { User, Whitelabel } from "@/lib/types"

interface AuthState {
  user: User | null
  whitelabel: Whitelabel | null
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    whitelabel: null,
    isLoading: true,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const supabase = getSupabaseBrowserClient()

    const loadUser = async () => {
      try {
        const user = await supabaseDataService.getCurrentUser()
        if (user) {
          const whitelabel = await supabaseDataService.getWhitelabel(user.whitelabel_id)
          setAuthState({ user, whitelabel, isLoading: false })
        } else {
          setAuthState({ user: null, whitelabel: null, isLoading: false })
        }
      } catch (error) {
        console.error("[v0] Error loading user:", error)
        setAuthState({ user: null, whitelabel: null, isLoading: false })
      }
    }

    loadUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUser()
      } else {
        setAuthState({ user: null, whitelabel: null, isLoading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [mounted])

  const login = async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient()
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // User data will be loaded by the auth state change listener
    } catch (error) {
      console.error("[v0] Login error:", error)
      throw new Error("Invalid credentials")
    }
  }

  const logout = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    setAuthState({ user: null, whitelabel: null, isLoading: false })
  }

  return <AuthContext.Provider value={{ ...authState, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
