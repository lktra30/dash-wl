"use client"

import { useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

interface UseTeamsRealtimeOptions {
  onUpdate: () => void
  enabled?: boolean
}

/**
 * Hook para monitorar mudanças em tempo real nas tabelas de equipes e colaboradores
 * Executa callback quando houver qualquer alteração nas tabelas teams ou employees
 */
export function useTeamsRealtime({ onUpdate, enabled = true }: UseTeamsRealtimeOptions) {
  useEffect(() => {
    if (!enabled) return

    let teamsChannel: RealtimeChannel | null = null
    let employeesChannel: RealtimeChannel | null = null

    const setupRealtimeSubscriptions = async () => {
      try {
        const supabase = getSupabaseBrowserClient()

        // Subscribe to changes on teams table
        teamsChannel = supabase
          .channel("teams-changes")
          .on(
            "postgres_changes",
            {
              event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
              schema: "public",
              table: "teams",
            },
            (_payload: RealtimePostgresChangesPayload<any>) => {
              onUpdate()
            }
          )
          .subscribe()

        // Subscribe to changes on employees table (for team membership changes)
        employeesChannel = supabase
          .channel("employees-teams-changes")
          .on(
            "postgres_changes",
            {
              event: "UPDATE", // Listen only to updates (team_id changes)
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

    setupRealtimeSubscriptions()

    // Cleanup subscriptions on unmount
    return () => {
      if (teamsChannel) {
        teamsChannel.unsubscribe()
      }
      if (employeesChannel) {
        employeesChannel.unsubscribe()
      }
    }
  }, [onUpdate, enabled])
}
