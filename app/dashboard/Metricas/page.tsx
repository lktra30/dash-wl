"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { DateRangeFilter, getDefaultDateRange, type DateRangeFilterValue } from "@/components/date-range-filter"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AddActivitySheet, ViewActivitySheet } from "@/components/atividades"
import { useAuth } from "@/hooks/use-auth"
import { Phone, Mail, Calendar, FileText } from "lucide-react"
import { useMemo, useState } from "react"

// Mock activities data
const mockActivities = [
  {
    id: "activity-1",
    type: "call" as const,
    title: "Follow-up call with Alice Johnson",
    description: "Discussed project requirements and timeline",
    contactId: "contact-1",
    whitelabelId: "wl-1",
    userId: "user-2",
    createdAt: new Date("2024-01-25T10:30:00"),
  },
  {
    id: "activity-2",
    type: "email" as const,
    title: "Sent proposal to Bob Smith",
    description: "Enterprise software license proposal",
    contactId: "contact-2",
    dealId: "deal-2",
    whitelabelId: "wl-1",
    userId: "user-2",
    createdAt: new Date("2024-01-24T14:15:00"),
  },
  {
    id: "activity-3",
    type: "meeting" as const,
    title: "Demo session with Carol Davis",
    description: "Product demonstration and Q&A",
    contactId: "contact-3",
    whitelabelId: "wl-2",
    userId: "user-3",
    createdAt: new Date("2024-01-23T16:00:00"),
  },
  {
    id: "activity-4",
    type: "note" as const,
    title: "Contract negotiation notes",
    description: "Key points discussed during contract review",
    dealId: "deal-1",
    whitelabelId: "wl-1",
    userId: "user-2",
    createdAt: new Date("2024-01-22T11:45:00"),
  },
]

export default function ActivitiesPage() {
  const { user } = useAuth()
  const [selectedActivity, setSelectedActivity] = useState<typeof mockActivities[0] | null>(null)
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRangeFilterValue>(getDefaultDateRange())

  const userActivities = useMemo(() => {
    if (!user) return []
    return mockActivities.filter((a) => a.whitelabelId === user.whitelabelId)
  }, [user])

  const handleActivityAdded = () => {
    // TODO: Reload activities from Supabase
  }

  const handleViewActivity = (activity: typeof mockActivities[0]) => {
    setSelectedActivity(activity)
    setIsViewSheetOpen(true)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call":
        return Phone
      case "email":
        return Mail
      case "meeting":
        return Calendar
      case "note":
        return FileText
      default:
        return FileText
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "call":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "email":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "meeting":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "note":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  if (!user) return null

  return (
    <DashboardLayout>
      <DashboardHeader title="Métricas" description="Acompanhe as métricas de desempenho do negócio.">
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <AddActivitySheet onActivityAdded={handleActivityAdded} />
      </DashboardHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          {userActivities.map((activity) => {
            const Icon = getActivityIcon(activity.type)
            return (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{activity.title}</CardTitle>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={getActivityColor(activity.type)}>{activity.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {activity.createdAt.toLocaleDateString("pt-BR")} às {activity.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => handleViewActivity(activity)}>
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <ViewActivitySheet
        activity={selectedActivity}
        open={isViewSheetOpen}
        onOpenChange={setIsViewSheetOpen}
      />
    </DashboardLayout>
  )
}
