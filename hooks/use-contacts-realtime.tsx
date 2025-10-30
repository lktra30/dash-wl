"use client"

import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Contact } from "@/lib/types"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

// Transform database snake_case to camelCase
const transformContact = (dbContact: any): Contact => ({
  id: dbContact.id,
  name: dbContact.name,
  email: dbContact.email,
  phone: dbContact.phone,
  company: dbContact.company,
  status: dbContact.funnel_stage || dbContact.status,
  pipelineId: dbContact.pipeline_id || dbContact.pipelineId,
  stageId: dbContact.stage_id || dbContact.stageId,
  leadSource: dbContact.lead_source || dbContact.leadSource,
  whitelabelId: dbContact.whitelabel_id || dbContact.whitelabelId,
  assignedTo: dbContact.assigned_to || dbContact.assignedTo,
  dealValue: dbContact.deal_value || dbContact.dealValue,
  dealDuration: dbContact.deal_duration || dbContact.dealDuration,
  sdrId: dbContact.sdr_id || dbContact.sdrId,
  closerId: dbContact.closer_id || dbContact.closerId,
  createdAt: dbContact.created_at || dbContact.createdAt,
  updatedAt: dbContact.updated_at || dbContact.updatedAt,
})

export function useContactsRealtime(initialContacts: Contact[] = []) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [isLoading, setIsLoading] = useState(false)

  // Update contacts when initial data changes
  useEffect(() => {
    setContacts(initialContacts)
  }, [initialContacts])

  useEffect(() => {
    let channel: RealtimeChannel | null = null

    const setupRealtimeSubscription = async () => {
      try {
        setIsLoading(true)
        const supabase = getSupabaseBrowserClient()

        // Subscribe to real-time changes on contacts table
        channel = supabase
          .channel("contacts-changes")
          .on(
            "postgres_changes",
            {
              event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
              schema: "public",
              table: "contacts",
            },
            (payload: RealtimePostgresChangesPayload<Contact>) => {

              if (payload.eventType === "INSERT") {
                const newContact = transformContact(payload.new)
                setContacts((prev) => {
                  // Check if contact already exists to avoid duplicates
                  if (prev.some((c) => c.id === newContact.id)) {
                    return prev
                  }
                  return [...prev, newContact]
                })
              } else if (payload.eventType === "UPDATE") {
                const updatedContact = transformContact(payload.new)
                setContacts((prev) =>
                  prev.map((contact) =>
                    contact.id === updatedContact.id ? updatedContact : contact
                  )
                )
              } else if (payload.eventType === "DELETE") {
                const deletedContact = payload.old as any
                setContacts((prev) =>
                  prev.filter((contact) => contact.id !== deletedContact.id)
                )
              }
            }
          )
          .subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              setIsLoading(false)
            } else if (status === "CHANNEL_ERROR") {
              setIsLoading(false)
            }
          })
      } catch (error) {
        setIsLoading(false)
      }
    }

    setupRealtimeSubscription()

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        channel.unsubscribe()
        setIsLoading(false)
      }
    }
  }, []) // Empty dependency array - only set up once

  // Optimistic update function for immediate UI feedback
  const optimisticUpdate = useCallback((id: string, updates: Partial<Contact>) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === id ? { ...contact, ...updates } : contact
      )
    )
  }, [])

  // Optimistic add function
  const optimisticAdd = useCallback((newContact: Contact) => {
    setContacts((prev) => {
      // Check if contact already exists
      if (prev.some((c) => c.id === newContact.id)) {
        return prev
      }
      return [...prev, newContact]
    })
  }, [])

  // Optimistic delete function
  const optimisticDelete = useCallback((id: string) => {
    setContacts((prev) => prev.filter((contact) => contact.id !== id))
  }, [])

  return {
    contacts,
    isLoading,
    optimisticUpdate,
    optimisticAdd,
    optimisticDelete,
  }
}
