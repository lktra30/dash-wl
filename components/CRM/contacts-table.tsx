"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Mail, Phone, Building, Pencil, Trash2, Search, ArrowUpDown, Settings2 } from "lucide-react"
import { EditContactSheet } from "./edit-contact-sheet"
import { useTheme } from "@/hooks/use-theme"
import type { Contact } from "@/lib/types"

interface Employee {
  id: string
  name: string
  role: string
}

interface ContactsTableProps {
  contacts: Contact[]
  onContactUpdated: () => void
  onContactDeleted?: (id: string) => void
  dataService: any
}

type ColumnKey = "name" | "company" | "contact" | "sdrCloser" | "status" | "value" | "createdAt"

const getStatusColor = (status: string) => {
  switch (status) {
    case "new_lead":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    case "contacted":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
    case "meeting":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    case "negotiation":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
    case "won":
    case "closed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "lost":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "new_lead":
      return "Novo Lead"
    case "contacted":
      return "Contatado"
    case "meeting":
      return "Reunião"
    case "negotiation":
      return "Negociação"
    case "won":
      return "Ganho"
    case "closed":
      return "Fechado"
    case "lost":
      return "Perdido"
    default:
      return status
  }
}

export function ContactsTable({ contacts, onContactUpdated, onContactDeleted, dataService }: ContactsTableProps) {
  const { brandColor } = useTheme()
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sdrFilter, setSdrFilter] = useState<string>("all")
  const [closerFilter, setCloserFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "date">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>([
    "name",
    "company",
    "contact",
    "sdrCloser",
    "status",
    "value",
    "createdAt"
  ])

  // Load employees for filters
  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/dashboard/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      setEmployees([])
    }
  }

  const toggleColumn = (column: ColumnKey) => {
    setVisibleColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    )
  }

  const columnLabels: Record<ColumnKey, string> = {
    name: "Nome",
    company: "Empresa",
    contact: "Contato",
    sdrCloser: "SDR / Closer",
    status: "Status",
    value: "Valor",
    createdAt: "Data Criação"
  }

  const handleDeleteContact = async () => {
    if (!contactToDelete || !dataService) return

    const contactId = contactToDelete.id
    
    // Remove da UI imediatamente (atualização otimista)
    if (onContactDeleted) {
      onContactDeleted(contactId)
    }
    
    // Fecha o diálogo
    setContactToDelete(null)

    try {
      // Deleta no servidor em background
      await dataService.deleteContact(contactId)
      // O real-time do Supabase vai sincronizar automaticamente
    } catch (error) {
      // Em caso de erro, recarrega os dados para restaurar o estado correto
      onContactUpdated()
    }
  }

  // Filter contacts
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || contact.status === statusFilter
    const matchesSdr = sdrFilter === "all" || (contact as any).sdrId === sdrFilter
    const matchesCloser = closerFilter === "all" || (contact as any).closerId === closerFilter

    return matchesSearch && matchesStatus && matchesSdr && matchesCloser
  })

  // Sort contacts
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (sortBy === "name") {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    } else {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA
    }
  })

  const toggleSort = (field: "name" | "date") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle style={{ color: brandColor }}>Todos os Leads</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="new_lead">Novo Lead</SelectItem>
                <SelectItem value="contacted">Contatado</SelectItem>
                <SelectItem value="meeting">Reunião</SelectItem>
                <SelectItem value="negotiation">Negociação</SelectItem>
                <SelectItem value="won">Ganho</SelectItem>
                <SelectItem value="closed">Fechado</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>

            {/* SDR Filter */}
            <Select value={sdrFilter} onValueChange={setSdrFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="SDR" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os SDRs</SelectItem>
                {employees
                  .filter(emp => emp.role.toLowerCase().includes('sdr') || emp.role.toLowerCase().includes('sales'))
                  .map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Closer Filter */}
            <Select value={closerFilter} onValueChange={setCloserFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Closer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Closers</SelectItem>
                {employees
                  .filter(emp => emp.role.toLowerCase().includes('closer') || emp.role.toLowerCase().includes('account'))
                  .map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Column Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Colunas Visíveis</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(columnLabels) as ColumnKey[]).map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column}
                    checked={visibleColumns.includes(column)}
                    onCheckedChange={() => toggleColumn(column)}
                  >
                    {columnLabels[column]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {sortedContacts.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Nenhum contato encontrado com os filtros aplicados"
                  : "Nenhum lead cadastrado no período"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleColumns.includes("name") && (
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => toggleSort("name")}
                          style={sortBy === "name" ? { color: brandColor } : undefined}
                        >
                          Nome
                          <ArrowUpDown className="ml-2 h-3 w-3" />
                        </Button>
                      </TableHead>
                    )}
                    {visibleColumns.includes("company") && <TableHead>Empresa</TableHead>}
                    {visibleColumns.includes("contact") && <TableHead>Contato</TableHead>}
                    {visibleColumns.includes("sdrCloser") && <TableHead>SDR / Closer</TableHead>}
                    {visibleColumns.includes("status") && <TableHead>Status</TableHead>}
                    {visibleColumns.includes("value") && <TableHead>Valor</TableHead>}
                    {visibleColumns.includes("createdAt") && (
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => toggleSort("date")}
                          style={sortBy === "date" ? { color: brandColor } : undefined}
                        >
                          Data Criação
                          <ArrowUpDown className="ml-2 h-3 w-3" />
                        </Button>
                      </TableHead>
                    )}
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedContacts.map((contact) => {
                    const sdr = employees.find(emp => emp.id === (contact as any).sdrId)
                    const closer = employees.find(emp => emp.id === (contact as any).closerId)
                    
                    return (
                      <TableRow key={contact.id}>
                        {visibleColumns.includes("name") && (
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-8 w-8 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor: `${brandColor}1A`,
                                  color: brandColor
                                }}
                              >
                                <span className="text-sm font-medium">
                                  {contact.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              {contact.name}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.includes("company") && (
                          <TableCell>
                            {contact.company ? (
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                {contact.company}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.includes("contact") && (
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs">{contact.email}</span>
                              </div>
                              {contact.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs">{contact.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.includes("sdrCloser") && (
                          <TableCell>
                            <div className="flex flex-col gap-1 text-sm">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">SDR:</span>
                                <span className="text-xs">{sdr?.name || '-'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">Closer:</span>
                                <span className="text-xs">{closer?.name || '-'}</span>
                              </div>
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.includes("status") && (
                          <TableCell>
                            <Badge 
                              className={getStatusColor(contact.status)}
                            >
                              {getStatusLabel(contact.status)}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleColumns.includes("value") && (
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">
                                {contact.dealValue 
                                  ? new Intl.NumberFormat('pt-BR', { 
                                      style: 'currency', 
                                      currency: 'BRL' 
                                    }).format(contact.dealValue)
                                  : '-'
                                }
                              </span>
                              {contact.updatedAt && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(contact.updatedAt).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.includes("createdAt") && (
                          <TableCell className="text-muted-foreground">
                            {formatDate(contact.createdAt)}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setEditingContact(contact)}
                              title="Editar contato"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setContactToDelete(contact)}
                              className="text-destructive hover:text-destructive"
                              title="Excluir contato"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead <strong>{contactToDelete?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteContact}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editingContact && (
        <EditContactSheet
          contact={editingContact}
          open={!!editingContact}
          onOpenChange={(open) => !open && setEditingContact(null)}
          onContactUpdated={onContactUpdated}
          dataService={dataService}
        />
      )}
    </>
  )
}
