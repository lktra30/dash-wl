"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Plus, Edit2, Trash2, GripVertical, Save, X } from "lucide-react"
import { PipelineWithStages, PipelineStage } from "@/lib/types"
import { toast } from "sonner"
import { useTheme } from "@/hooks/use-theme"

export function PipelinesConfig() {
  const { brandColor } = useTheme()
  const [pipelines, setPipelines] = useState<PipelineWithStages[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineWithStages | null>(null)

  // Dialog states
  const [showPipelineDialog, setShowPipelineDialog] = useState(false)
  const [showStageDialog, setShowStageDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: 'pipeline' | 'stage', id: string } | null>(null)

  // Form states
  const [pipelineForm, setPipelineForm] = useState({
    id: "",
    name: "",
    description: "",
    color: "#3b82f6",
    isDefault: false,
  })

  const [stageForm, setStageForm] = useState<Partial<PipelineStage>>({
    name: "",
    description: "",
    color: "#6366f1",
    orderPosition: 1,
    countsAsMeeting: false,
    countsAsSale: false,
    requiresSdr: false,
    requiresCloser: false,
    requiresDealValue: false,
  })

  const [editingStageId, setEditingStageId] = useState<string | null>(null)

  // Carregar pipelines
  useEffect(() => {
    loadPipelines()
  }, [])

  const loadPipelines = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dashboard/pipelines")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || "Erro ao carregar pipelines"

        if (response.status === 401) {
          toast.error("❌ Você não está autorizado. Faça login novamente.")
        } else if (response.status === 404) {
          toast.error("❌ Nenhum pipeline encontrado. Um pipeline padrão será criado automaticamente.")
        } else {
          toast.error(`❌ ${errorMessage}`)
        }
        return
      }

      const data = await response.json()
      setPipelines(data)

      // Selecionar o pipeline padrão por default
      const defaultPipeline = data.find((p: PipelineWithStages) => p.isDefault)
      if (defaultPipeline) {
        setSelectedPipeline(defaultPipeline)
      } else if (data.length > 0) {
        setSelectedPipeline(data[0])
      }
    } catch (error: any) {
      console.error("Error loading pipelines:", error)
      toast.error(`❌ Erro ao carregar pipelines: ${error.message || "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePipeline = () => {
    setPipelineForm({
      id: "",
      name: "",
      description: "",
      color: "#3b82f6",
      isDefault: false,
    })
    setShowPipelineDialog(true)
  }

  const handleEditPipeline = (pipeline: PipelineWithStages) => {
    setPipelineForm({
      id: pipeline.id,
      name: pipeline.name,
      description: pipeline.description || "",
      color: pipeline.color,
      isDefault: pipeline.isDefault,
    })
    setShowPipelineDialog(true)
  }

  const handleSavePipeline = async () => {
    try {
      // Validação do nome
      if (!pipelineForm.name || pipelineForm.name.trim() === "") {
        toast.error("❌ Nome do pipeline é obrigatório!")
        return
      }

      const isEditing = !!pipelineForm.id
      const url = isEditing
        ? `/api/dashboard/pipelines/${pipelineForm.id}`
        : "/api/dashboard/pipelines"

      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pipelineForm.name,
          description: pipelineForm.description,
          color: pipelineForm.color,
          isDefault: pipelineForm.isDefault,
          stages: isEditing ? undefined : [
            { name: "Novo Lead", orderPosition: 1, color: "#94a3b8" },
            { name: "Contatado", orderPosition: 2, color: "#60a5fa" },
            { name: "Qualificado", orderPosition: 3, color: "#a78bfa" },
          ],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || "Erro desconhecido"

        // Mensagens de erro mais amigáveis
        if (response.status === 401) {
          toast.error("❌ Você não está autorizado. Faça login novamente.")
        } else if (response.status === 400) {
          toast.error(`❌ Dados inválidos: ${errorMessage}`)
        } else if (response.status === 404) {
          toast.error("❌ Pipeline não encontrado.")
        } else if (response.status === 500) {
          toast.error(`❌ Erro no servidor: ${errorMessage}`)
        } else {
          toast.error(`❌ Erro ao salvar pipeline: ${errorMessage}`)
        }
        return
      }

      toast.success(isEditing ? "✅ Pipeline atualizado com sucesso!" : "✅ Pipeline criado com sucesso!")
      setShowPipelineDialog(false)
      await loadPipelines()
    } catch (error: any) {
      console.error("Error saving pipeline:", error)
      toast.error(`❌ Erro ao salvar pipeline: ${error.message || "Erro desconhecido"}`)
    }
  }

  const handleDeletePipeline = async (pipelineId: string) => {
    try {
      const response = await fetch(`/api/dashboard/pipelines/${pipelineId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || "Erro ao deletar pipeline"

        if (response.status === 400) {
          toast.error(`❌ ${errorMessage}`)
        } else if (response.status === 404) {
          toast.error("❌ Pipeline não encontrado.")
        } else {
          toast.error(`❌ Erro ao deletar: ${errorMessage}`)
        }
        return
      }

      toast.success("✅ Pipeline deletado com sucesso!")
      setShowDeleteDialog(false)
      setItemToDelete(null)
      await loadPipelines()
    } catch (error: any) {
      console.error("Error deleting pipeline:", error)
      toast.error(`❌ Erro ao deletar pipeline: ${error.message || "Erro desconhecido"}`)
    }
  }

  const handleCreateStage = () => {
    if (!selectedPipeline) return

    const maxOrder = selectedPipeline.stages.length > 0
      ? Math.max(...selectedPipeline.stages.map(s => s.orderPosition))
      : 0

    setStageForm({
      name: "",
      description: "",
      color: "#6366f1",
      orderPosition: maxOrder + 1,
      countsAsMeeting: false,
      countsAsSale: false,
      requiresSdr: false,
      requiresCloser: false,
      requiresDealValue: false,
    })
    setEditingStageId(null)
    setShowStageDialog(true)
  }

  const handleEditStage = (stage: PipelineStage) => {
    setStageForm({
      ...stage,
      description: stage.description || "", // Converter null/undefined para string vazia
    })
    setEditingStageId(stage.id)
    setShowStageDialog(true)
  }

  const handleSaveStage = async () => {
    if (!selectedPipeline) return

    try {
      // Validação do nome
      if (!stageForm.name || stageForm.name.trim() === "") {
        toast.error("❌ Nome do estágio é obrigatório!")
        return
      }

      const isEditing = !!editingStageId
      const url = isEditing
        ? `/api/dashboard/pipelines/${selectedPipeline.id}/stages/${editingStageId}`
        : `/api/dashboard/pipelines/${selectedPipeline.id}/stages`

      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stageForm),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || "Erro desconhecido"

        if (response.status === 400) {
          toast.error(`❌ Dados inválidos: ${errorMessage}`)
        } else if (response.status === 404) {
          toast.error("❌ Pipeline ou estágio não encontrado.")
        } else if (response.status === 500) {
          toast.error(`❌ Erro no servidor: ${errorMessage}`)
        } else {
          toast.error(`❌ Erro ao salvar estágio: ${errorMessage}`)
        }
        return
      }

      toast.success(isEditing ? "✅ Estágio atualizado com sucesso!" : "✅ Estágio criado com sucesso!")
      setShowStageDialog(false)
      await loadPipelines()
    } catch (error: any) {
      console.error("Error saving stage:", error)
      toast.error(`❌ Erro ao salvar estágio: ${error.message || "Erro desconhecido"}`)
    }
  }

  const handleDeleteStage = async (stageId: string) => {
    if (!selectedPipeline) return

    try {
      const response = await fetch(
        `/api/dashboard/pipelines/${selectedPipeline.id}/stages/${stageId}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || "Erro ao deletar estágio"

        if (response.status === 400) {
          toast.error(`❌ ${errorMessage}`)
        } else if (response.status === 404) {
          toast.error("❌ Estágio não encontrado.")
        } else {
          toast.error(`❌ Erro ao deletar: ${errorMessage}`)
        }
        return
      }

      toast.success("✅ Estágio deletado com sucesso!")
      setShowDeleteDialog(false)
      setItemToDelete(null)
      await loadPipelines()
    } catch (error: any) {
      console.error("Error deleting stage:", error)
      toast.error(`❌ Erro ao deletar estágio: ${error.message || "Erro desconhecido"}`)
    }
  }

  const confirmDelete = (type: 'pipeline' | 'stage', id: string) => {
    setItemToDelete({ type, id })
    setShowDeleteDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando pipelines...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configurar Pipelines</h2>
          <p className="text-muted-foreground">
            Gerencie seus pipelines de vendas e configure os estágios personalizados
          </p>
        </div>
        <Button
          onClick={handleCreatePipeline}
          style={{ backgroundColor: brandColor }}
          className="text-white hover:opacity-90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Pipeline
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Pipelines */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Pipelines</CardTitle>
            <CardDescription>Selecione um pipeline para configurar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pipelines.map((pipeline) => (
              <div
                key={pipeline.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPipeline?.id === pipeline.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedPipeline(pipeline)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: pipeline.color }}
                    />
                    <span className="font-medium">{pipeline.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {pipeline.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Padrão
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditPipeline(pipeline)
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    {!pipeline.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          confirmDelete('pipeline', pipeline.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pipeline.stages.length} estágios
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Configuração de Stages */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedPipeline?.name || "Selecione um pipeline"}
                </CardTitle>
                <CardDescription>
                  Configure os estágios e contabilizações
                </CardDescription>
              </div>
              {selectedPipeline && (
                <Button onClick={handleCreateStage} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Estágio
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedPipeline ? (
              <div className="space-y-3">
                {selectedPipeline.stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            <span className="font-medium">{stage.name}</span>
                            <Badge variant="outline" className="text-xs">
                              #{stage.orderPosition}
                            </Badge>
                          </div>
                          {stage.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {stage.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {stage.countsAsMeeting && (
                              <Badge variant="secondary" className="text-xs">
                                Conta como Reunião
                              </Badge>
                            )}
                            {stage.countsAsSale && (
                              <Badge variant="secondary" className="text-xs">
                                Conta como Venda
                              </Badge>
                            )}
                            {stage.requiresSdr && (
                              <Badge variant="outline" className="text-xs">
                                Requer SDR
                              </Badge>
                            )}
                            {stage.requiresCloser && (
                              <Badge variant="outline" className="text-xs">
                                Requer Closer
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditStage(stage)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => confirmDelete('stage', stage.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Selecione um pipeline para ver seus estágios
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog - Criar/Editar Pipeline */}
      <Dialog open={showPipelineDialog} onOpenChange={setShowPipelineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pipelineForm.id ? "Editar Pipeline" : "Criar Novo Pipeline"}
            </DialogTitle>
            <DialogDescription>
              Configure as informações do pipeline
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pipeline-name">Nome *</Label>
              <Input
                id="pipeline-name"
                value={pipelineForm.name}
                onChange={(e) =>
                  setPipelineForm({ ...pipelineForm, name: e.target.value })
                }
                placeholder="Ex: Pipeline de Vendas B2B"
              />
            </div>
            <div>
              <Label htmlFor="pipeline-description">Descrição</Label>
              <Textarea
                id="pipeline-description"
                value={pipelineForm.description}
                onChange={(e) =>
                  setPipelineForm({ ...pipelineForm, description: e.target.value })
                }
                placeholder="Descreva o propósito deste pipeline..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="pipeline-color">Cor</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pipeline-color"
                  type="color"
                  value={pipelineForm.color}
                  onChange={(e) =>
                    setPipelineForm({ ...pipelineForm, color: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  value={pipelineForm.color}
                  onChange={(e) =>
                    setPipelineForm({ ...pipelineForm, color: e.target.value })
                  }
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pipeline-default">Pipeline Padrão</Label>
                <p className="text-sm text-muted-foreground">
                  Usado automaticamente para novos contatos
                </p>
              </div>
              <Switch
                id="pipeline-default"
                checked={pipelineForm.isDefault}
                onCheckedChange={(checked) =>
                  setPipelineForm({ ...pipelineForm, isDefault: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPipelineDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePipeline}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Criar/Editar Stage */}
      <Dialog open={showStageDialog} onOpenChange={setShowStageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingStageId ? "Editar Estágio" : "Criar Novo Estágio"}
            </DialogTitle>
            <DialogDescription>
              Configure as informações e contabilizações do estágio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stage-name">Nome *</Label>
                <Input
                  id="stage-name"
                  value={stageForm.name}
                  onChange={(e) =>
                    setStageForm({ ...stageForm, name: e.target.value })
                  }
                  placeholder="Ex: Negociação"
                />
              </div>
              <div>
                <Label htmlFor="stage-order">Ordem</Label>
                <Input
                  id="stage-order"
                  type="number"
                  value={stageForm.orderPosition}
                  onChange={(e) =>
                    setStageForm({
                      ...stageForm,
                      orderPosition: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="stage-description">Descrição</Label>
              <Textarea
                id="stage-description"
                value={stageForm.description}
                onChange={(e) =>
                  setStageForm({ ...stageForm, description: e.target.value })
                }
                placeholder="Descreva o que significa este estágio..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="stage-color">Cor</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="stage-color"
                  type="color"
                  value={stageForm.color}
                  onChange={(e) =>
                    setStageForm({ ...stageForm, color: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  value={stageForm.color}
                  onChange={(e) =>
                    setStageForm({ ...stageForm, color: e.target.value })
                  }
                  placeholder="#6366f1"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Contabilizações</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="counts-meeting">Conta como Reunião</Label>
                    <p className="text-sm text-muted-foreground">
                      Contatos neste estágio contam como reunião realizada
                    </p>
                  </div>
                  <Switch
                    id="counts-meeting"
                    checked={stageForm.countsAsMeeting}
                    onCheckedChange={(checked) =>
                      setStageForm({ ...stageForm, countsAsMeeting: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="counts-sale">Conta como Venda</Label>
                    <p className="text-sm text-muted-foreground">
                      Contatos neste estágio contam como venda fechada
                    </p>
                  </div>
                  <Switch
                    id="counts-sale"
                    checked={stageForm.countsAsSale}
                    onCheckedChange={(checked) =>
                      setStageForm({ ...stageForm, countsAsSale: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Requisitos</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requires-sdr">Requer SDR</Label>
                    <p className="text-sm text-muted-foreground">
                      Exige que um SDR seja atribuído
                    </p>
                  </div>
                  <Switch
                    id="requires-sdr"
                    checked={stageForm.requiresSdr}
                    onCheckedChange={(checked) =>
                      setStageForm({ ...stageForm, requiresSdr: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requires-closer">Requer Closer</Label>
                    <p className="text-sm text-muted-foreground">
                      Exige que um Closer seja atribuído
                    </p>
                  </div>
                  <Switch
                    id="requires-closer"
                    checked={stageForm.requiresCloser}
                    onCheckedChange={(checked) =>
                      setStageForm({ ...stageForm, requiresCloser: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requires-deal-value">Requer Valor do Deal</Label>
                    <p className="text-sm text-muted-foreground">
                      Exige que o valor do deal seja preenchido
                    </p>
                  </div>
                  <Switch
                    id="requires-deal-value"
                    checked={stageForm.requiresDealValue}
                    onCheckedChange={(checked) =>
                      setStageForm({ ...stageForm, requiresDealValue: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStageDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveStage}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog - Confirmar Delete */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === 'pipeline'
                ? "Esta ação não pode ser desfeita. O pipeline e todos os seus estágios serão deletados permanentemente."
                : "Esta ação não pode ser desfeita. O estágio será deletado permanentemente."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (itemToDelete?.type === 'pipeline') {
                  handleDeletePipeline(itemToDelete.id)
                } else if (itemToDelete?.type === 'stage') {
                  handleDeleteStage(itemToDelete.id)
                }
              }}
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
