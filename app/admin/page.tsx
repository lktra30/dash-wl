"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Pencil, Plus, Shield, Building2 } from "lucide-react"

interface Whitelabel {
  id: string
  name: string
  domain: string | null
  brand_color: string
  business_model: string
  created_at: string
  updated_at: string
  logo_url: string | null
  meta_ads_account_id: string | null
  team_competition: boolean
}

interface Employee {
  id: string
  name: string
  email: string
  user_role: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [whitelabels, setWhitelabels] = useState<Whitelabel[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [editingWhitelabel, setEditingWhitelabel] = useState<Whitelabel | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state for editing
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    brand_color: "#3b82f6",
    business_model: "MRR",
    meta_ads_account_id: "",
    team_competition: false,
    admin_email: "",
    admin_name: "",
  })

  // Check authorization and load data
  useEffect(() => {
    async function checkAuthAndLoadData() {
      try {
        // Check if user is SuperAdmin
        const authResponse = await fetch("/api/auth/check-superadmin")
        const authData = await authResponse.json()

        if (!authResponse.ok || !authData.isSuperAdmin) {
          toast.error("Acesso negado. Somente SuperAdmin pode acessar esta página.")
          router.push("/dashboard")
          return
        }

        setAuthorized(true)

        // Load whitelabels
        const whitelabelsResponse = await fetch("/api/admin/whitelabels")
        const whitelabelsData = await whitelabelsResponse.json()

        if (whitelabelsResponse.ok) {
          setWhitelabels(whitelabelsData.whitelabels)
        } else {
          toast.error("Erro ao carregar whitelabels")
        }
      } catch (error) {
        toast.error("Erro ao carregar dados")
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoadData()
  }, [router])

  const handleEdit = (whitelabel: Whitelabel) => {
    setEditingWhitelabel(whitelabel)
    setFormData({
      name: whitelabel.name,
      domain: whitelabel.domain || "",
      brand_color: whitelabel.brand_color,
      business_model: whitelabel.business_model,
      meta_ads_account_id: whitelabel.meta_ads_account_id || "",
      team_competition: whitelabel.team_competition,
      admin_email: "",
      admin_name: "",
    })
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingWhitelabel(null)
    setFormData({
      name: "",
      domain: "",
      brand_color: "#3b82f6",
      business_model: "MRR",
      meta_ads_account_id: "",
      team_competition: false,
      admin_email: "",
      admin_name: "",
    })
    setIsCreateDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório")
      return
    }

    // Validação adicional para criação de whitelabel
    if (!editingWhitelabel) {
      if (!formData.admin_email) {
        toast.error("Email do administrador é obrigatório")
        return
      }
      if (!formData.admin_name) {
        toast.error("Nome do administrador é obrigatório")
        return
      }
      // Validação simples de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.admin_email)) {
        toast.error("Email inválido")
        return
      }
    }

    setIsSaving(true)

    try {
      const url = editingWhitelabel
        ? `/api/admin/whitelabels/${editingWhitelabel.id}`
        : "/api/admin/whitelabels"

      const method = editingWhitelabel ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        if (editingWhitelabel) {
          toast.success("Whitelabel atualizado!")
        } else {
          toast.success(
            `Whitelabel criado com sucesso! Usuário administrador criado: ${data.admin?.email}. Senha inicial: ${formData.admin_email}`,
            { duration: 6000 }
          )
        }
        
        // Reload whitelabels
        const whitelabelsResponse = await fetch("/api/admin/whitelabels")
        const whitelabelsData = await whitelabelsResponse.json()
        if (whitelabelsResponse.ok) {
          setWhitelabels(whitelabelsData.whitelabels)
        }

        setIsDialogOpen(false)
        setIsCreateDialogOpen(false)
      } else {
        toast.error(data.error || "Erro ao salvar")
      }
    } catch (error) {
      toast.error("Erro ao salvar")
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10 space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Whitelabel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Whitelabels
          </CardTitle>
          <CardDescription>
            Gerencie todos os whitelabels do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {whitelabels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum whitelabel encontrado
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Domínio</TableHead>
                    <TableHead>Modelo de Negócio</TableHead>
                    <TableHead>Cor da Marca</TableHead>
                    <TableHead>Competição de Equipes</TableHead>
                    <TableHead>Meta Ads ID</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {whitelabels.map((whitelabel) => (
                    <TableRow key={whitelabel.id}>
                      <TableCell className="font-medium">{whitelabel.name}</TableCell>
                      <TableCell>
                        {whitelabel.domain || (
                          <span className="text-muted-foreground italic">Não definido</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={whitelabel.business_model === "MRR" ? "default" : "secondary"}>
                          {whitelabel.business_model}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: whitelabel.brand_color }}
                          />
                          <span className="text-sm">{whitelabel.brand_color}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={whitelabel.team_competition ? "default" : "outline"}>
                          {whitelabel.team_competition ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {whitelabel.meta_ads_account_id || (
                          <span className="text-muted-foreground italic">Não configurado</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(whitelabel)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Editar Whitelabel</DialogTitle>
            <DialogDescription>
              Altere as informações do whitelabel
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do whitelabel"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="domain">Domínio</Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="brand_color">Cor da Marca</Label>
              <div className="flex gap-2">
                <Input
                  id="brand_color"
                  type="color"
                  value={formData.brand_color}
                  onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.brand_color}
                  onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="business_model">Modelo de Negócio</Label>
              <Select
                value={formData.business_model}
                onValueChange={(value) => setFormData({ ...formData, business_model: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MRR">MRR (Monthly Recurring Revenue)</SelectItem>
                  <SelectItem value="TCV">TCV (Total Contract Value)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="meta_ads_account_id">Meta Ads Account ID</Label>
              <Input
                id="meta_ads_account_id"
                value={formData.meta_ads_account_id}
                onChange={(e) => setFormData({ ...formData, meta_ads_account_id: e.target.value })}
                placeholder="act_123456789"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="team_competition"
                checked={formData.team_competition}
                onChange={(e) => setFormData({ ...formData, team_competition: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="team_competition" className="cursor-pointer">
                Habilitar Competição de Equipes
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Whitelabel</DialogTitle>
            <DialogDescription>
              Preencha as informações para criar um novo whitelabel
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-name">Nome do Whitelabel *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do whitelabel"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-admin-name">Nome do Administrador *</Label>
              <Input
                id="create-admin-name"
                value={formData.admin_name}
                onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                placeholder="Nome completo do administrador"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-admin-email">Email do Administrador *</Label>
              <Input
                id="create-admin-email"
                type="email"
                value={formData.admin_email}
                onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                placeholder="email@exemplo.com"
              />
              <p className="text-sm text-muted-foreground">
                A senha inicial será o próprio email
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-domain">Domínio</Label>
              <Input
                id="create-domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-brand_color">Cor da Marca</Label>
              <div className="flex gap-2">
                <Input
                  id="create-brand_color"
                  type="color"
                  value={formData.brand_color}
                  onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.brand_color}
                  onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-business_model">Modelo de Negócio</Label>
              <Select
                value={formData.business_model}
                onValueChange={(value) => setFormData({ ...formData, business_model: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MRR">MRR (Monthly Recurring Revenue)</SelectItem>
                  <SelectItem value="TCV">TCV (Total Contract Value)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-meta_ads_account_id">Meta Ads Account ID</Label>
              <Input
                id="create-meta_ads_account_id"
                value={formData.meta_ads_account_id}
                onChange={(e) => setFormData({ ...formData, meta_ads_account_id: e.target.value })}
                placeholder="act_123456789"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="create-team_competition"
                checked={formData.team_competition}
                onChange={(e) => setFormData({ ...formData, team_competition: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="create-team_competition" className="cursor-pointer">
                Habilitar Competição de Equipes
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
