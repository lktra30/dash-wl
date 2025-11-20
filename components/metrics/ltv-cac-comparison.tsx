'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface LtvCacData {
  ltv: number;
  cac: number;
  ltvCacRatio: number | null;
  avgMonthlyValue?: number;
  avgLifetimeMonths?: number;
  avgDealValue?: number;
  totalCustomers: number;
  totalRevenue?: number;
  businessModel: 'MRR' | 'TCV';
}

interface Props {
  brandColor?: string;
  dateRangeLabel?: string;
}

export function LtvCacComparison({ brandColor = "#6366f1", dateRangeLabel }: Props = {}) {
  const [data, setData] = useState<LtvCacData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ metric: 'ltv-cac' });
      
      const response = await fetch(`/api/dashboard/advanced-metrics?${params}`);
      if (!response.ok) throw new Error('Falha ao carregar dados');

      const result = await response.json();
      setData(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>LTV vs CAC ({dateRangeLabel || "Últimos 12 Meses"})</CardTitle>
          <CardDescription>Lifetime Value vs Customer Acquisition Cost</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>LTV vs CAC</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Erro: {error || 'Dados não disponíveis'}</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getRatioStatus = (ratio: number | null) => {
    if (!ratio) return { text: 'N/A', color: 'text-muted-foreground', icon: AlertCircle };
    if (ratio >= 3) return { text: 'Excelente', color: 'text-green-600', icon: TrendingUp };
    if (ratio >= 1) return { text: 'Aceitável', color: 'text-yellow-600', icon: TrendingUp };
    return { text: 'Crítico', color: 'text-red-600', icon: TrendingDown };
  };

  const ratioStatus = getRatioStatus(data.ltvCacRatio);
  const StatusIcon = ratioStatus.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>LTV vs CAC ({dateRangeLabel || "Últimos 12 Meses"})</CardTitle>
            <CardDescription>
              Lifetime Value vs Customer Acquisition Cost
            </CardDescription>
          </div>
          <Badge variant="outline">
            {data.businessModel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">LTV</p>
            <p className="text-2xl font-bold">{formatCurrency(data.ltv)}</p>
            {data.businessModel === 'MRR' && data.avgMonthlyValue && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(data.avgMonthlyValue)}/mês × {data.avgLifetimeMonths?.toFixed(1)} meses
              </p>
            )}
            {data.businessModel === 'TCV' && data.avgDealValue && (
              <p className="text-xs text-muted-foreground">
                Ticket médio: {formatCurrency(data.avgDealValue)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">CAC</p>
            <p className="text-2xl font-bold">{formatCurrency(data.cac)}</p>
            <p className="text-xs text-muted-foreground">
              {data.totalCustomers} clientes
            </p>
          </div>
        </div>

        {/* LTV:CAC Ratio */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Relação LTV:CAC</p>
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 ${ratioStatus.color}`} />
              <span className={`text-sm font-medium ${ratioStatus.color}`}>
                {ratioStatus.text}
              </span>
            </div>
          </div>
          
          {data.ltvCacRatio ? (
            <>
              <p className="text-3xl font-bold">
                {data.ltvCacRatio.toFixed(2)}:1
              </p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all"
                  style={{ 
                    width: `${Math.min((data.ltvCacRatio / 5) * 100, 100)}%`,
                    backgroundColor: data.ltvCacRatio >= 3 
                      ? brandColor 
                      : data.ltvCacRatio >= 1 
                        ? '#eab308' 
                        : '#dc2626'
                  }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Dados insuficientes para calcular a relação
            </p>
          )}
        </div>

        {/* Insights */}
        <div className="border-t pt-4 space-y-2">
          <p className="text-sm font-medium">Análise</p>
          {data.ltvCacRatio ? (
            <>
              {data.ltvCacRatio >= 3 ? (
                <p className="text-xs text-muted-foreground">
                  ✅ Excelente! Seu LTV é {data.ltvCacRatio.toFixed(1)}x maior que o CAC. 
                  Continue investindo em aquisição de clientes.
                </p>
              ) : data.ltvCacRatio >= 1 ? (
                <p className="text-xs text-muted-foreground">
                  ⚠️ Relação aceitável, mas pode melhorar. Tente aumentar o LTV 
                  (retenção, upsell) ou reduzir o CAC (otimizar canais).
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  🚨 Atenção! Você está gastando mais para adquirir clientes do que eles geram. 
                  Revise sua estratégia de aquisição urgentemente.
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Adicione mais dados de vendas e gastos para análise completa.
            </p>
          )}
        </div>

        {/* Additional context for MRR */}
        {data.businessModel === 'MRR' && data.totalRevenue && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            Receita total: {formatCurrency(data.totalRevenue)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
