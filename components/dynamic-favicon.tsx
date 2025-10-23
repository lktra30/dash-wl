"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"

/**
 * DynamicFavicon Component
 *
 * Dynamically updates the page favicon based on the whitelabel's logo.
 * Uses the logo from the authenticated user's whitelabel configuration.
 * Falls back to default favicon if no logo is available.
 */
export function DynamicFavicon() {
  const { whitelabel } = useAuth()

  useEffect(() => {
    // Only update favicon if we have a logo URL
    if (!whitelabel?.logoUrl) {
      return
    }

    // Find or create favicon link element
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')

    if (!favicon) {
      favicon = document.createElement("link")
      favicon.rel = "icon"
      document.head.appendChild(favicon)
    }

    // Update the favicon href to the whitelabel logo
    favicon.href = whitelabel.logoUrl

    // Also update apple-touch-icon for iOS devices
    let appleTouchIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')

    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement("link")
      appleTouchIcon.rel = "apple-touch-icon"
      document.head.appendChild(appleTouchIcon)
    }

    appleTouchIcon.href = whitelabel.logoUrl

  }, [whitelabel?.logoUrl])

  return null
}
