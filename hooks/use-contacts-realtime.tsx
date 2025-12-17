"use client"

import { useState, useEffect, useCallback } from "react"
import type { Contact } from "@/lib/types"

export function useContactsRealtime(initialContacts: Contact[] = []) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [isLoading, setIsLoading] = useState(false)

  // Update contacts when initial data changes
  useEffect(() => {
    setContacts(initialContacts)
  }, [initialContacts])

  // Fetch contacts via secure API route
  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/dashboard/contacts", {
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
      setContacts(data)
    } catch (error) {
      console.error("Error fetching contacts:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Only fetch if no initial contacts provided
    if (initialContacts.length === 0) {
      fetchContacts()
    }

    // Set up polling for updates (every 30 seconds)
    // This replaces real-time subscription while maintaining security
    const pollInterval = setInterval(() => {
      fetchContacts()
    }, 30000)

    // Cleanup on unmount
    return () => {
      clearInterval(pollInterval)
    }
  }, [fetchContacts, initialContacts.length])

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
    refetch: fetchContacts,
  }
}
