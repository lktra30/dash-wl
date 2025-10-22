"use client"

import { useMemo } from "react"
import { useAuth } from "./use-auth"
import { createSecureDataService } from "@/lib/supabase-data-service"

export default function useData() {
  const { user } = useAuth()

  const dataService = useMemo(() => {
    if (!user) return null
    return createSecureDataService()
  }, [user])

  return dataService
}
