"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User, Whitelabel } from "@/lib/types"

interface AuthState {
  user: User | null
  whitelabel: Whitelabel | null
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshWhitelabel: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function parseError(response: Response, fallback: string) {
  try {
    const data = await response.json()
    if (data?.error && typeof data.error === "string") {
      return data.error
    }
  } catch {
    // ignore
  }
  return fallback
}

function normalizeUser(raw: any): User {
  return {
    id: raw?.id ?? "",
    email: raw?.email ?? "",
    name: raw?.name ?? "",
    role: raw?.role ?? "user",
    whitelabelId: raw?.whitelabelId ?? raw?.whitelabel_id ?? "",
    createdAt: raw?.createdAt ?? raw?.created_at ?? new Date().toISOString(),
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? new Date().toISOString(),
  }
}

function normalizeWhitelabel(raw: any): Whitelabel {
  if (!raw) {
    return {
      name: "",
    }
  }

  return {
    name: raw.name ?? "",
    domain: raw.domain ?? undefined,
    brandColor: raw.brandColor ?? raw.brand_color ?? undefined,
    logoUrl: raw.logoUrl ?? raw.logo_url ?? undefined,
    businessModel: raw.businessModel ?? raw.business_model ?? "MRR",
    metaAdsConfigured: raw.metaAdsConfigured ?? raw.meta_ads_configured ?? false,
    googleAdsConfigured: raw.googleAdsConfigured ?? raw.google_ads_configured ?? false,
    metaAdsAccountId: raw.metaAdsAccountId ?? raw.meta_ads_account_id ?? undefined,
    teamCompetition: raw.teamCompetition ?? raw.team_competition ?? false,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    whitelabel: null,
    isLoading: true,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadUser = useCallback(async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }))

    try {
      // Try to load from sessionStorage first for instant load
      const cachedData = typeof window !== 'undefined' ? sessionStorage.getItem('auth-cache') : null
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData)
          const cacheAge = Date.now() - (parsed.timestamp || 0)
          // Use cache if less than 5 minutes old
          if (cacheAge < 5 * 60 * 1000) {
            setAuthState({ 
              user: normalizeUser(parsed.user), 
              whitelabel: normalizeWhitelabel(parsed.whitelabel), 
              isLoading: false 
            })
            // Continue to fetch fresh data in background
          }
        } catch (e) {
          // Invalid cache, ignore
        }
      }

      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (!response.ok) {
        // Clear cache on auth failure
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('auth-cache')
        }
        setAuthState({ user: null, whitelabel: null, isLoading: false })
        return
      }

      const data = await response.json()
      const newState = { 
        user: normalizeUser(data.user), 
        whitelabel: normalizeWhitelabel(data.whitelabel), 
        isLoading: false 
      }
      
      setAuthState(newState)
      
      // Cache the result
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth-cache', JSON.stringify({
          user: data.user,
          whitelabel: data.whitelabel,
          timestamp: Date.now()
        }))
      }
    } catch (error) {
      setAuthState({ user: null, whitelabel: null, isLoading: false })
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    loadUser()
  }, [mounted, loadUser])

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        })

        if (!response.ok) {
          const message = await parseError(response, "Invalid credentials")
          throw new Error(message)
        }

        await loadUser()
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Invalid credentials")
      }
    },
    [loadUser],
  )

  const logout = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        const message = await parseError(response, "Failed to logout")
        throw new Error(message)
      }
    } catch (error) {
    } finally {
      // Clear auth cache
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth-cache')
      }
      setAuthState({ user: null, whitelabel: null, isLoading: false })
      // Redirecionar para a página de login após logout
      router.push("/")
    }
  }, [router])

  const refreshWhitelabel = useCallback(async () => {
    await loadUser()
  }, [loadUser])

  return <AuthContext.Provider value={{ ...authState, login, logout, refreshWhitelabel }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
