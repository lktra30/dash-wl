"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ColorPicker } from "@/components/color-picker"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "@/hooks/use-theme"
import { useState, useEffect } from "react"
import { Save, Palette, User, Shield } from "lucide-react"

export default function SettingsPage() {
  const { user, whitelabel } = useAuth()
  const { brandColor, setBrandColor } = useTheme()
  const [whitelabelName, setWhitelabelName] = useState("")
  const [tempBrandColor, setTempBrandColor] = useState(brandColor)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (whitelabel) {
      setWhitelabelName(whitelabel.name)
      setTempBrandColor(whitelabel.brandColor)
    }
  }, [whitelabel])

  const handleSave = async () => {
    setIsSaving(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Update the brand color in the theme
    setBrandColor(tempBrandColor)

    // In a real app, you would update the whitelabel config in the database
    console.log("[v0] Saving whitelabel settings:", {
      name: whitelabelName,
      brandColor: tempBrandColor,
    })

    setIsSaving(false)
  }

  if (!user || !whitelabel) return null

  const isAdmin = user.role === "admin"

  return (
    <DashboardLayout>
      <DashboardHeader title="Settings" description="Manage your account and whitelabel configuration" />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Profile
              </CardTitle>
              <CardDescription>Your personal account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={user.name} disabled />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email} disabled />
                </div>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={user.role} disabled className="capitalize" />
              </div>
            </CardContent>
          </Card>

          {/* Admin Settings */}
          {isAdmin && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Admin Settings
                  </CardTitle>
                  <CardDescription>Configure your whitelabel CRM instance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="whitelabel-name">Dashboard Name</Label>
                    <Input
                      id="whitelabel-name"
                      value={whitelabelName}
                      onChange={(e) => setWhitelabelName(e.target.value)}
                      placeholder="Enter your dashboard name"
                    />
                  </div>
                  <div>
                    <Label>Whitelabel ID</Label>
                    <Input value={whitelabel.id} disabled />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Brand Customization
                  </CardTitle>
                  <CardDescription>Customize the look and feel of your CRM</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ColorPicker label="Brand Color" value={tempBrandColor} onChange={setTempBrandColor} />
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: tempBrandColor }} />
                      <span className="text-sm">This color will be used for buttons, links, and accents</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </>
          )}

          {/* Non-admin message */}
          {!isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Admin Settings
                </CardTitle>
                <CardDescription>Configure your whitelabel CRM instance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Admin Access Required</h3>
                  <p className="text-muted-foreground">
                    Only administrators can modify whitelabel settings and brand customization.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
