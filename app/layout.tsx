import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"
import { ThemeProvider } from "@/hooks/use-theme"
import { DynamicFavicon } from "@/components/dynamic-favicon"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Dashboard Comercial",
  description: "Created by Effic",
  generator: "Next.js",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <AuthProvider>
            <DynamicFavicon />
            <ThemeProvider>{children}</ThemeProvider>
          </AuthProvider>
        </Suspense>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
