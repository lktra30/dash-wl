"use client"

import { useMemo } from "react"
import { useAuth } from "./use-auth"
import { createSupabaseDataService } from "@/lib/supabase-data-service"

export function useData() {
  const { user } = useAuth()

  const dataService = useMemo(() => {
    if (!user) return null
    return createSupabaseDataService(user.whitelabel_id)
  }, [user])

  return dataService
}
