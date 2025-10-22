"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface Deal {
  id: string
  title: string
  value: number
  status: "open" | "won" | "lost"
  created_at: string
  duration?: number
  contacts: {
    id: string
    name: string
    company?: string
  } | null
  sdr: {
    id: string
    name: string
  } | null
  closer: {
    id: string
    name: string
  } | null
}

interface DealsRealtimeResult {
  deals: Deal[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Custom hook for real-time deals synchronization
 * Subscribes to Supabase realtime changes on the deals table
 * Automatically updates when contacts change to won/lost status
 */
export function useDealsRealtime(): DealsRealtimeResult {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = getSupabaseBrowserClient()

  // Fetch deals with all related data
  const fetchDeals = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("deals")
        .select(`
          id,
          title,
          value,
          status,
          duration,
          created_at,
          contacts:contact_id (
            id,
            name,
            company
          ),
          sdr:sdr_id (
            id,
            name
          ),
          closer:closer_id (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setDeals(data as Deal[])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchDeals()

    // Set up realtime subscription
    const channel: RealtimeChannel = supabase
      .channel("deals-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events: INSERT, UPDATE, DELETE
          schema: "public",
          table: "deals",
        },
        async (payload: any) => {

          if (payload.eventType === "INSERT") {
            // Fetch the new deal with all related data
            const { data: newDeal } = await supabase
              .from("deals")
              .select(`
                id,
                title,
                value,
                status,
                duration,
                created_at,
                contacts:contact_id (
                  id,
                  name,
                  company
                ),
                sdr:sdr_id (
                  id,
                  name
                ),
                closer:closer_id (
                  id,
                  name
                )
              `)
              .eq("id", payload.new.id)
              .single()

            if (newDeal) {
              setDeals((prev) => [newDeal as Deal, ...prev])
              
              // Show toast notification
              toast.success("Negócio Criado", {
                description: `${newDeal.title} - ${newDeal.status === "won" ? "Ganho" : "Perdido"}`,
              })
            }
          } else if (payload.eventType === "UPDATE") {
            // Fetch updated deal with all related data
            const { data: updatedDeal } = await supabase
              .from("deals")
              .select(`
                id,
                title,
                value,
                status,
                duration,
                created_at,
                contacts:contact_id (
                  id,
                  name,
                  company
                ),
                sdr:sdr_id (
                  id,
                  name
                ),
                closer:closer_id (
                  id,
                  name
                )
              `)
              .eq("id", payload.new.id)
              .single()

            if (updatedDeal) {
              setDeals((prev) =>
                prev.map((deal) =>
                  deal.id === updatedDeal.id ? (updatedDeal as Deal) : deal
                )
              )

              // Show toast notification
              toast.info("Negócio Atualizado", {
                description: `${updatedDeal.title} - Status: ${updatedDeal.status === "won" ? "Ganho" : "Perdido"}`,
              })
            }
          } else if (payload.eventType === "DELETE") {
            // Remove deleted deal
            setDeals((prev) => prev.filter((deal) => deal.id !== payload.old.id))

            // Show toast notification
            toast.error("Negócio Removido", {
              description: "Um negócio foi removido do sistema",
            })
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return {
    deals,
    loading,
    error,
    refetch: fetchDeals,
  }
}
