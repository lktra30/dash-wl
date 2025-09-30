"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { useData } from "@/hooks/use-data"
import { hasPermission, Permission } from "@/lib/permissions"
import { Plus, Mail, Phone, Building, MoreHorizontal, Eye } from "lucide-react"
import { useState, useEffect } from "react"
import type { Contact } from "@/lib/types"

export default function ContactsPage() {
  const { user } = useAuth()
  const dataService = useData()
  const [draggedContact, setDraggedContact] = useState<Contact | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadContacts = async () => {
      if (!dataService) return

      setIsLoading(true)
      try {
        const data = await dataService.getContacts()
        setContacts(data)
      } catch (error) {
        console.error("[v0] Error loading contacts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadContacts()
  }, [dataService])

  const canCreate = user ? hasPermission(user, Permission.CREATE_CONTACTS) : false

  const getStatusColor = (status: string) => {
    switch (status) {
      case "lead":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "prospect":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "customer":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const kanbanColumns = [
    { id: "lead", title: "Leads", status: "lead" },
    { id: "prospect", title: "Prospects", status: "prospect" },
    { id: "customer", title: "Customers", status: "customer" },
  ]

  const getContactsByStatus = (status: string) => {
    return contacts.filter((contact) => contact.funnel_stage === status)
  }

  const handleDragStart = (contact: Contact) => {
    setDraggedContact(contact)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (draggedContact && draggedContact.funnel_stage !== newStatus && dataService) {
      try {
        await dataService.updateContact(draggedContact.id, { funnel_stage: newStatus as any })
        // Reload contacts
        const data = await dataService.getContacts()
        setContacts(data)
      } catch (error) {
        console.error("[v0] Error updating contact:", error)
      }
    }
    setDraggedContact(null)
  }

  if (!user) return null

  return (
    <DashboardLayout>
      <DashboardHeader title="Contacts" description="Manage your customer relationships">
        {canCreate && (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Contact
          </Button>
        )}
      </DashboardHeader>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading contacts...</p>
          </div>
        ) : (
          <Tabs defaultValue="table" className="space-y-6">
            <TabsList>
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="kanban">Kanban View</TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact) => (
                        <TableRow key={contact.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {contact.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              {contact.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              {contact.company}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {contact.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {contact.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {contact.phone}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(contact.funnel_stage)}>{contact.funnel_stage}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(contact.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kanban" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kanbanColumns.map((column) => (
                  <Card
                    key={column.id}
                    className="min-h-[600px]"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.status)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{column.title}</CardTitle>
                        <Badge variant="secondary">{getContactsByStatus(column.status).length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {getContactsByStatus(column.status).map((contact) => (
                        <Card
                          key={contact.id}
                          className="cursor-move hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20"
                          draggable
                          onDragStart={() => handleDragStart(contact)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium text-sm">{contact.name}</h4>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Building className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{contact.company}</span>
                                  </div>
                                </div>
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary">
                                    {contact.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground truncate">{contact.email}</span>
                                </div>
                                {contact.phone && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">{contact.phone}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(contact.created_at).toLocaleDateString()}
                                </span>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {getContactsByStatus(column.status).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-sm">No contacts in this stage</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}
