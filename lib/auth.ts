import type { User, WhitelabelConfig } from "./types"
import { mockUsers, mockWhitelabels } from "./mock-data"

// Simple auth context for demo purposes
export interface AuthState {
  user: User | null
  whitelabel: WhitelabelConfig | null
  isLoading: boolean
}

export const getStoredAuth = (): AuthState => {
  if (typeof window === "undefined") {
    return { user: null, whitelabel: null, isLoading: false }
  }

  const stored = localStorage.getItem("crm-auth")
  if (!stored) {
    return { user: null, whitelabel: null, isLoading: false }
  }

  try {
    const parsed = JSON.parse(stored)
    return {
      user: parsed.user,
      whitelabel: parsed.whitelabel,
      isLoading: false,
    }
  } catch {
    return { user: null, whitelabel: null, isLoading: false }
  }
}

export const login = async (email: string, password: string): Promise<AuthState> => {
  // Mock authentication - in real app this would call your API
  const user = mockUsers.find((u) => u.email === email)
  if (!user) {
    throw new Error("Invalid credentials")
  }

  const whitelabel = mockWhitelabels.find((w) => w.id === user.whitelabelId)
  if (!whitelabel) {
    throw new Error("Whitelabel not found")
  }

  const authState = { user, whitelabel, isLoading: false }

  if (typeof window !== "undefined") {
    localStorage.setItem("crm-auth", JSON.stringify(authState))
  }

  return authState
}

export const logout = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("crm-auth")
  }
}
