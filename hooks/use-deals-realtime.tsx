"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

interface Deal {
  id: string
  title: string
  value: number
  status: "open" | "won" | "lost"
  created_at: string
  duration?: number
  contactId?: string
  sdrId?: string
  closerId?: string
}

interface DealsRealtimeResult {
  deals: Deal[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Custom hook for deals data with periodic refresh
 * Uses secure API routes instead of direct Supabase queries
 * NOTE: Real-time updates are simulated via polling for security
 */
export function useDealsRealtime(): DealsRealtimeResult {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch deals via secure API route
  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/dashboard/deals", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        throw new Error(`API error (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      setDeals(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchDeals()

    // Set up polling for updates (every 30 seconds)
    // This replaces real-time subscription while maintaining security
    const pollInterval = setInterval(() => {
      fetchDeals()
    }, 30000)

    // Cleanup on unmount
    return () => {
      clearInterval(pollInterval)
    }
  }, [fetchDeals])

  return {
    deals,
    loading,
    error,
    refetch: fetchDeals,
  }
}
