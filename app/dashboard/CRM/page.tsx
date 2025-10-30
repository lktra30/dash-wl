"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { DateRangeFilter, getDefaultDateRange, type DateRangeFilterValue } from "@/components/date-range-filter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContactsTable } from "@/components/CRM/contacts-table"
import { ContactsKanban } from "@/components/CRM/contacts-kanban"
import { DealsGrid } from "@/components/CRM/deals-grid"
import { PipelinesConfig } from "@/components/CRM/pipelines-config"
import { AddContactSheet } from "@/components/CRM/add-contact-sheet"
import { useAuth } from "@/hooks/use-auth"
import useData from "@/hooks/use-data"
import { useContactsRealtime } from "@/hooks/use-contacts-realtime"
import { useDealsRealtime } from "@/hooks/use-deals-realtime"
import { useState, useEffect, useMemo } from "react"
import type { Contact } from "@/lib/types"

export default function ContactsPage() {
  const { user } = useAuth()
  const dataService = useData()
  const [initialContacts, setInitialContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRangeFilterValue>(getDefaultDateRange())
  
  // Use real-time hooks for live updates
  const { contacts: allContacts, optimisticUpdate, optimisticDelete } = useContactsRealtime(initialContacts)
  const { deals, loading: dealsLoading } = useDealsRealtime()

  // Filter contacts by date range
  const contacts = useMemo(() => {
    if (!dateRange) return allContacts
    
    return allContacts.filter((contact) => {
      const contactDate = new Date(contact.createdAt)
      return contactDate >= dateRange.from && contactDate <= dateRange.to
    })
  }, [allContacts, dateRange])

  const loadContacts = async () => {
    if (!dataService) return

    setIsLoading(true)
    try {
      const data = await dataService.getContacts()
      setInitialContacts(data)
    } catch (error) {
      setInitialContacts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadContacts()
  }, [dataService])

  const handleUpdateContact = async (id: string, status: Contact["status"]) => {
    if (!dataService) return

    // Optimistically update UI immediately
    optimisticUpdate(id, { status })

    try {
      // Update on server - real-time will sync the actual result
      await dataService.updateContact({ id, status })
    } catch (error) {
      // Reload on error to restore correct state
      await loadContacts()
    }
  }

  if (!user) return null

  return (
    <DashboardLayout>
      <DashboardHeader title="Leads" description="Gerencie seus clientes">
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <AddContactSheet
          onContactAdded={loadContacts}
          dataService={dataService}
          canCreate={true}
        />
      </DashboardHeader>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando contatos...</p>
          </div>
        ) : (
          <Tabs defaultValue="table" className="space-y-6">
            <TabsList className="space-x-2">
              <TabsTrigger value="table">Tabela</TabsTrigger>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
              {/* <TabsTrigger value="deals">Vendas</TabsTrigger> */}
            </TabsList>

            <TabsContent value="table" className="space-y-4">
              <ContactsTable
                contacts={contacts}
                onContactUpdated={loadContacts}
                onContactDeleted={optimisticDelete}
                dataService={dataService}
              />
            </TabsContent>

            <TabsContent value="kanban" className="space-y-4">
              <ContactsKanban
                contacts={contacts}
                onUpdateContact={handleUpdateContact}
                onContactUpdated={loadContacts}
                dataService={dataService}
              />
            </TabsContent>

            <TabsContent value="pipelines" className="space-y-4">
              <PipelinesConfig />
            </TabsContent>

            <TabsContent value="deals" className="space-y-4">
              <DealsGrid deals={deals} isLoading={dealsLoading} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}
