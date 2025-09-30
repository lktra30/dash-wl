"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useData } from "@/hooks/use-data"
import { hasPermission, Permission } from "@/lib/permissions"
import { Plus, Calendar, DollarSign } from "lucide-react"
import { useMemo } from "react"

export default function DealsPage() {
  const { user } = useAuth()
  const dataService = useData()

  const { deals, contacts, canCreate } = useMemo(() => {
    if (!dataService || !user) {
      return { deals: [], contacts: [], canCreate: false }
    }

    return {
      deals: dataService.getDeals(),
      contacts: dataService.getContacts(),
      canCreate: hasPermission(user, Permission.CREATE_DEALS),
    }
  }, [dataService, user])

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "prospecting":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      case "qualification":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "proposal":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "negotiation":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case "closed-won":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "closed-lost":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getContactName = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId)
    return contact?.name || "Unknown Contact"
  }

  if (!user) return null

  return (
    <DashboardLayout>
      <DashboardHeader title="Deals" description="Track your sales pipeline">
        {canCreate && (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Deal
          </Button>
        )}
      </DashboardHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <Card key={deal.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{deal.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{getContactName(deal.contactId)}</p>
                  </div>
                  <Badge className={getStageColor(deal.stage)}>{deal.stage.replace("-", " ")}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold text-foreground">${deal.value.toLocaleString()}</span>
                </div>
                {deal.expectedCloseDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">Expected: {deal.expectedCloseDate.toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-muted-foreground">Created {deal.createdAt.toLocaleDateString()}</span>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
