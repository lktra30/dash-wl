"use client"

import React, { useState } from "react"
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
import { Search, ArrowUpDown } from "lucide-react"
import { formatCurrency } from "@/components/mainPage/main-page-calculations"

interface Deal {
  id: string
  title: string
  value: number
  status: "open" | "won" | "lost"
  expected_close_date?: string
  created_at: string
  contacts: {
    id: string
    name: string
    company?: string
  } | null
  sdr: {
    id: string
    name: string
  } | null
  closer: {
    id: string
    name: string
  } | null
}

interface DealsTableProps {
  deals: Deal[]
  isLoading?: boolean
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "won":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "lost":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    case "open":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "won":
      return "Ganho"
    case "lost":
      return "Perdido"
    case "open":
      return "Aberto"
    default:
      return status
  }
}

export function DealsTable({ deals, isLoading }: DealsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"value" | "date">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Negócios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando negócios...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter deals
  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.contacts?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.contacts?.company?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || deal.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Sort deals
  const sortedDeals = [...filteredDeals].sort((a, b) => {
    if (sortBy === "value") {
      return sortOrder === "asc" ? a.value - b.value : b.value - a.value
    } else {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA
    }
  })

  const toggleSort = (field: "value" | "date") => {
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
    <Card>
      <CardHeader>
        <CardTitle>Negócios</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, contato ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="won">Ganhos</SelectItem>
              <SelectItem value="open">Abertos</SelectItem>
              <SelectItem value="lost">Perdidos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {sortedDeals.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Nenhum negócio encontrado com os filtros aplicados"
                : "Nenhum negócio cadastrado"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => toggleSort("value")}
                    >
                      Valor
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>SDR</TableHead>
                  <TableHead>Closer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => toggleSort("date")}
                    >
                      Data
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell>{deal.contacts?.name || "-"}</TableCell>
                    <TableCell>{deal.contacts?.company || "-"}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(deal.value)}
                    </TableCell>
                    <TableCell>{deal.sdr?.name || "-"}</TableCell>
                    <TableCell>{deal.closer?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(deal.status)}>
                        {getStatusLabel(deal.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(deal.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
