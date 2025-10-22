"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  Calculator, 
  TrendingUp, 
  Users, 
  DollarSign,
  Target,
  Award,
  Info
} from "lucide-react"

export function CommissionGuideCard() {
  return (
    <div className="w-full">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sdr">SDR</TabsTrigger>
          <TabsTrigger value="closer">Closer</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
        </TabsList>

          {/* VISÃO GERAL */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Como funciona o sistema de comissionamento?</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p>
                  O sistema calcula comissões baseado em <strong>metas mensais</strong> e <strong>checkpoints de desempenho</strong>.
                  Quanto melhor o desempenho, maior o multiplicador aplicado sobre a comissão base.
                </p>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">Checkpoints de Desempenho</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Os checkpoints são níveis de performance que multiplicam a comissão base do colaborador:
                </p>
                <div className="grid gap-3 mt-3">
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
                    <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900">CP1</Badge>
                    <div className="text-sm">
                      <strong>Checkpoint 1:</strong> Atingiu 50% da meta → Recebe 50% da comissão base
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-md">
                    <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900">CP2</Badge>
                    <div className="text-sm">
                      <strong>Checkpoint 2:</strong> Atingiu 75% da meta → Recebe 75% da comissão base
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900">CP3</Badge>
                    <div className="text-sm">
                      <strong>Checkpoint 3:</strong> Atingiu 100% da meta → Recebe 100% da comissão base
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-md">
                    <Badge variant="outline">Abaixo</Badge>
                    <div className="text-sm">
                      <strong>Abaixo do CP1:</strong> Não atingiu 50% da meta → Não recebe comissão
                    </div>
                  </div>
                </div>
              </div>

              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200">
                <Calculator className="h-4 w-4" />
                <AlertTitle>Fórmula Geral</AlertTitle>
                <AlertDescription className="mt-2 font-mono text-xs">
                  <strong>Comissão Final = Comissão Base × Multiplicador do Checkpoint</strong>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          {/* SDR */}
          <TabsContent value="sdr" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Comissionamento para SDR</h3>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>O que é um SDR?</AlertTitle>
              <AlertDescription className="mt-2">
                <strong>SDR (Sales Development Representative)</strong> é o profissional responsável por 
                prospectar leads, qualificá-los e agendar reuniões para o time de Closers.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm">Campos de Configuração</h4>
                
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-md">
                    <div className="font-medium text-sm mb-1">💰 Comissão por Reunião</div>
                    <p className="text-sm text-muted-foreground">
                      Valor fixo pago por cada reunião realizada (independente de fechar venda)
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Exemplo: R$ 50,00 por reunião
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded-md">
                    <div className="font-medium text-sm mb-1">🎯 Meta Mensal de Reuniões</div>
                    <p className="text-sm text-muted-foreground">
                      Número de reuniões que o SDR precisa fazer por mês para atingir 100% da meta
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Exemplo: 20 reuniões por mês
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded-md">
                    <div className="font-medium text-sm mb-1">🎁 Bônus por Reunião Convertida</div>
                    <p className="text-sm text-muted-foreground">
                      Valor extra quando a reunião resulta em venda fechada
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Exemplo: R$ 100,00 por venda convertida
                    </p>
                  </div>
                </div>
              </div>

              <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
                <Calculator className="h-4 w-4" />
                <AlertTitle>Fórmula de Cálculo - SDR</AlertTitle>
                <AlertDescription className="mt-2 space-y-2 font-mono text-xs">
                  <p><strong>Comissão Base =</strong></p>
                  <p className="pl-4">
                    (Reuniões Realizadas × Valor por Reunião) +<br />
                    (Reuniões Convertidas × Bônus)
                  </p>
                  <p className="mt-2"><strong>Comissão Final =</strong></p>
                  <p className="pl-4">Comissão Base × Multiplicador do Checkpoint</p>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          {/* CLOSER */}
          <TabsContent value="closer" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold">Comissionamento para Closer</h3>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>O que é um Closer?</AlertTitle>
              <AlertDescription className="mt-2">
                <strong>Closer (Account Executive)</strong> é o profissional responsável por 
                conduzir negociações e fechar vendas com os leads qualificados pelo SDR.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm">Campos de Configuração</h4>
                
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-md">
                    <div className="font-medium text-sm mb-1 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Comissão Fixa Mensal
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Valor fixo garantido por mês, independente de vendas
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Exemplo: R$ 1.000,00 por mês (salário base)
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded-md">
                    <div className="font-medium text-sm mb-1 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Comissão por Venda
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Valor fixo pago por cada venda fechada (independente do valor da venda)
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Exemplo: R$ 200,00 por venda fechada
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded-md">
                    <div className="font-medium text-sm mb-1">📊 Comissão Percentual</div>
                    <p className="text-sm text-muted-foreground">
                      Percentual aplicado sobre o valor total de vendas fechadas
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Exemplo: 10% sobre vendas (R$ 5.000 em vendas = R$ 500 de comissão)
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded-md">
                    <div className="font-medium text-sm mb-1">🎯 Meta Mensal de Vendas</div>
                    <p className="text-sm text-muted-foreground">
                      Valor total de vendas que o Closer precisa fechar para atingir 100% da meta
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Exemplo: R$ 10.000,00 por mês
                    </p>
                  </div>
                </div>
              </div>

              <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
                <Calculator className="h-4 w-4" />
                <AlertTitle>Fórmula de Cálculo - Closer</AlertTitle>
                <AlertDescription className="mt-2 space-y-2 font-mono text-xs">
                  <p><strong>Comissão Base =</strong></p>
                  <p className="pl-4">
                    Comissão Fixa Mensal +<br />
                    (Quantidade de Vendas × Comissão por Venda) +<br />
                    (Total de Vendas × Percentual de Comissão / 100)
                  </p>
                  <p className="mt-2"><strong>Comissão Final =</strong></p>
                  <p className="pl-4">Comissão Base × Multiplicador do Checkpoint</p>
                </AlertDescription>
              </Alert>

              <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200">
                <Info className="h-4 w-4" />
                <AlertTitle>💡 Dica</AlertTitle>
                <AlertDescription className="mt-2 text-sm">
                  Você pode usar apenas um tipo de comissão (fixa, por venda ou percentual) ou 
                  combiná-los! Por exemplo: R$ 500 fixo + R$ 100 por venda + 5% sobre vendas.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          {/* EXEMPLOS PRÁTICOS */}
          <TabsContent value="examples" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5 text-purple-500" />
              <h3 className="text-lg font-semibold">Exemplos Práticos de Configuração</h3>
            </div>

            <div className="space-y-6">
              {/* Exemplo 1: SDR */}
              <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500">Exemplo 1</Badge>
                  <h4 className="font-semibold">SDR - Empresa de SaaS</h4>
                </div>
                
                <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
                  <p><strong>Configuração:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Comissão por Reunião: R$ 50,00</li>
                    <li>Meta Mensal: 20 reuniões</li>
                    <li>Bônus por Conversão: R$ 100,00</li>
                    <li>Checkpoints: 50%, 75%, 100% (multiplicadores: 50%, 75%, 100%)</li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-md space-y-2 text-sm">
                  <p><strong>Cenário:</strong> SDR realizou 16 reuniões, 4 converteram em vendas</p>
                  <div className="space-y-1 font-mono text-xs mt-2">
                    <p>Comissão Base = (16 × R$ 50) + (4 × R$ 100) = R$ 1.200</p>
                    <p>Performance = 16 / 20 = 80% da meta → <strong>Checkpoint 2</strong></p>
                    <p>Multiplicador = 75%</p>
                    <p className="text-green-600 dark:text-green-400 font-bold mt-2">
                      ✓ Comissão Final = R$ 1.200 × 0,75 = R$ 900,00
                    </p>
                  </div>
                </div>
              </div>

              {/* Exemplo 2: Closer - Apenas Percentual */}
              <div className="border-2 border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500">Exemplo 2</Badge>
                  <h4 className="font-semibold">Closer - Apenas Comissão Percentual</h4>
                </div>
                
                <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
                  <p><strong>Configuração:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Comissão Fixa: R$ 0,00</li>
                    <li>Comissão por Venda: R$ 0,00</li>
                    <li>Comissão Percentual: 10%</li>
                    <li>Meta Mensal: R$ 10.000,00</li>
                    <li>Checkpoints: 50%, 75%, 100% (multiplicadores: 50%, 75%, 100%)</li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-md space-y-2 text-sm">
                  <p><strong>Cenário:</strong> Closer fechou R$ 12.000 em vendas (3 vendas)</p>
                  <div className="space-y-1 font-mono text-xs mt-2">
                    <p>Comissão Base = R$ 0 + R$ 0 + (R$ 12.000 × 10%) = R$ 1.200</p>
                    <p>Performance = R$ 12.000 / R$ 10.000 = 120% da meta → <strong>Checkpoint 3</strong></p>
                    <p>Multiplicador = 100%</p>
                    <p className="text-green-600 dark:text-green-400 font-bold mt-2">
                      ✓ Comissão Final = R$ 1.200 × 1,00 = R$ 1.200,00
                    </p>
                  </div>
                </div>
              </div>

              {/* Exemplo 3: Closer - Modelo Híbrido */}
              <div className="border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-500">Exemplo 3</Badge>
                  <h4 className="font-semibold">Closer - Modelo Híbrido (Recomendado)</h4>
                </div>
                
                <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
                  <p><strong>Configuração:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Comissão Fixa: R$ 500,00</li>
                    <li>Comissão por Venda: R$ 150,00</li>
                    <li>Comissão Percentual: 5%</li>
                    <li>Meta Mensal: R$ 15.000,00</li>
                    <li>Checkpoints: 50%, 75%, 100% (multiplicadores: 50%, 75%, 100%)</li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-md space-y-2 text-sm">
                  <p><strong>Cenário:</strong> Closer fechou R$ 18.000 em vendas (6 vendas)</p>
                  <div className="space-y-1 font-mono text-xs mt-2">
                    <p>Comissão Fixa = R$ 500</p>
                    <p>Comissão por Venda = 6 × R$ 150 = R$ 900</p>
                    <p>Comissão Percentual = R$ 18.000 × 5% = R$ 900</p>
                    <p>Comissão Base = R$ 500 + R$ 900 + R$ 900 = <strong>R$ 2.300</strong></p>
                    <p>Performance = R$ 18.000 / R$ 15.000 = 120% da meta → <strong>Checkpoint 3</strong></p>
                    <p>Multiplicador = 100%</p>
                    <p className="text-green-600 dark:text-green-400 font-bold mt-2">
                      ✓ Comissão Final = R$ 2.300 × 1,00 = R$ 2.300,00
                    </p>
                  </div>
                </div>

                <Alert className="bg-purple-50 dark:bg-purple-950 border-purple-200">
                  <Award className="h-4 w-4" />
                  <AlertTitle>Por que esse modelo é recomendado?</AlertTitle>
                  <AlertDescription className="mt-2 text-sm">
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Comissão Fixa:</strong> Garante uma base mínima de ganhos</li>
                      <li><strong>Por Venda:</strong> Incentiva volume de vendas</li>
                      <li><strong>Percentual:</strong> Incentiva vendas de maior valor</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>

              {/* Exemplo 4: Abaixo da Meta */}
              <div className="border-2 border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Exemplo 4</Badge>
                  <h4 className="font-semibold">Closer - Performance Abaixo da Meta</h4>
                </div>
                
                <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
                  <p><strong>Configuração:</strong> (mesmo do Exemplo 3)</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Comissão Fixa: R$ 500,00</li>
                    <li>Comissão por Venda: R$ 150,00</li>
                    <li>Comissão Percentual: 5%</li>
                    <li>Meta Mensal: R$ 15.000,00</li>
                  </ul>
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-md space-y-2 text-sm">
                  <p><strong>Cenário:</strong> Closer fechou apenas R$ 6.000 em vendas (2 vendas)</p>
                  <div className="space-y-1 font-mono text-xs mt-2">
                    <p>Comissão Base = R$ 500 + R$ 300 + R$ 300 = R$ 1.100</p>
                    <p>Performance = R$ 6.000 / R$ 15.000 = 40% da meta → <strong>Abaixo CP1</strong></p>
                    <p>Multiplicador = 0% (não atingiu nenhum checkpoint)</p>
                    <p className="text-red-600 dark:text-red-400 font-bold mt-2">
                      ✗ Comissão Final = R$ 1.100 × 0 = R$ 0,00
                    </p>
                  </div>
                </div>

                <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200">
                  <Info className="h-4 w-4" />
                  <AlertTitle>⚠️ Atenção</AlertTitle>
                  <AlertDescription className="mt-2 text-sm">
                    Se o colaborador não atingir o Checkpoint 1 (50% da meta neste exemplo), 
                    ele não recebe comissão. Ajuste os checkpoints de acordo com a realidade da sua empresa!
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200">
              <BookOpen className="h-4 w-4" />
              <AlertTitle>💡 Dicas Finais</AlertTitle>
              <AlertDescription className="mt-2 text-sm space-y-2">
                <ul className="list-disc list-inside space-y-1">
                  <li>Comece com checkpoints baixos (30%, 60%, 90%) se sua equipe está começando</li>
                  <li>Use checkpoints altos (70%, 85%, 100%) para equipes maduras</li>
                  <li>Combine diferentes tipos de comissão para balancear incentivos</li>
                  <li>Revise as configurações trimestralmente baseado nos resultados</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
  )
}
