"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserCommissionCard } from "./user-commission-card"
import { SDRMetrics, CloserMetrics } from "@/lib/types"
import { Users, Target } from "lucide-react"

interface IndividualCommissionCardsProps {
  sdrMetrics: SDRMetrics[]
  closerMetrics: CloserMetrics[]
  businessModel?: "TCV" | "MRR"
}

export function IndividualCommissionCards({ 
  sdrMetrics, 
  closerMetrics,
  businessModel = 'TCV'
}: IndividualCommissionCardsProps) {
  const hasSdrs = sdrMetrics.length > 0
  const hasClosers = closerMetrics.length > 0

  // Sort by final commission (highest first)
  const sortedSdrMetrics = [...sdrMetrics].sort((a, b) => b.finalCommission - a.finalCommission)
  const sortedCloserMetrics = [...closerMetrics].sort((a, b) => b.finalCommission - a.finalCommission)

  if (!hasSdrs && !hasClosers) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Nenhum colaborador com função SDR ou Closer cadastrado.
          </p>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Configure os colaboradores na seção de Colaboradores para rastrear comissões individuais.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* SDR Section */}
      {hasSdrs && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">SDRs</h3>
              <p className="text-sm text-muted-foreground">
                {sdrMetrics.length} {sdrMetrics.length === 1 ? 'SDR' : 'SDRs'} com atividade
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSdrMetrics.map((metrics, index) => (
              <div key={metrics.userId} className="relative">
                {index < 3 && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <div className={`
                      px-2 py-1 rounded-full text-xs font-bold
                      ${index === 0 ? 'bg-yellow-500 text-white' : ''}
                      ${index === 1 ? 'bg-gray-400 text-white' : ''}
                      ${index === 2 ? 'bg-orange-600 text-white' : ''}
                    `}>
                      #{index + 1}
                    </div>
                  </div>
                )}
                <UserCommissionCard 
                  metrics={metrics} 
                  role="sdr"
                  businessModel={businessModel}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closer Section */}
      {hasClosers && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Closers</h3>
              <p className="text-sm text-muted-foreground">
                {closerMetrics.length} {closerMetrics.length === 1 ? 'Closer' : 'Closers'} com atividade
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedCloserMetrics.map((metrics, index) => (
              <div key={metrics.userId} className="relative">
                {index < 3 && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <div className={`
                      px-2 py-1 rounded-full text-xs font-bold
                      ${index === 0 ? 'bg-yellow-500 text-white' : ''}
                      ${index === 1 ? 'bg-gray-400 text-white' : ''}
                      ${index === 2 ? 'bg-orange-600 text-white' : ''}
                    `}>
                      #{index + 1}
                    </div>
                  </div>
                )}
                <UserCommissionCard 
                  metrics={metrics} 
                  role="closer"
                  businessModel={businessModel}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
