"use client"

import { useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

interface UseEmployeesRealtimeOptions {
  onUpdate: () => void
  enabled?: boolean
}

/**
 * Hook para monitorar mudanças em tempo real na tabela de colaboradores
 * Executa callback quando houver qualquer alteração na tabela employees
 */
export function useEmployeesRealtime({ onUpdate, enabled = true }: UseEmployeesRealtimeOptions) {
  useEffect(() => {
    if (!enabled) return

    let channel: RealtimeChannel | null = null

    const setupRealtimeSubscription = async () => {
      try {
        const supabase = getSupabaseBrowserClient()

        // Subscribe to changes on employees table
        channel = supabase
          .channel("employees-changes")
          .on(
            "postgres_changes",
            {
              event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
              schema: "public",
              table: "employees",
            },
            (_payload: RealtimePostgresChangesPayload<any>) => {
              onUpdate()
            }
          )
          .subscribe()
      } catch (error) {
      }
    }

    setupRealtimeSubscription()

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [onUpdate, enabled])
}
