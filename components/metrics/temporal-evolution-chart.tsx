'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface TemporalData {
  month: string;
  value: number;
  activeDeals?: number;
  salesCount?: number;
  metric: 'MRR' | 'TCV';
  businessModel: 'MRR' | 'TCV';
}

interface Props {
  months?: number;
  brandColor?: string;
  dateRangeLabel?: string;
}

export function TemporalEvolutionChart({ months = 12, brandColor = "#6366f1", dateRangeLabel }: Props) {
  const [data, setData] = useState<TemporalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessModel, setBusinessModel] = useState<'MRR' | 'TCV'>('TCV');

  useEffect(() => {
    fetchData();
  }, [months]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ 
        metric: 'temporal-evolution',
        months: months.toString()
      });

      const response = await fetch(`/api/dashboard/advanced-metrics?${params}`);
      if (!response.ok) throw new Error('Falha ao carregar dados');

      const result = await response.json();
      const fetchedData = result.data || [];
      setData(fetchedData);
      
      if (fetchedData.length > 0) {
        setBusinessModel(fetchedData[0].businessModel);
      }
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
          <CardTitle>Evolução Temporal ({dateRangeLabel || "Últimos 12 Meses"})</CardTitle>
          <CardDescription>Receita ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução Temporal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Erro: {error}</p>
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

  const formatMonth = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Evolução Temporal ({dateRangeLabel || "Últimos 12 Meses"})</CardTitle>
            <CardDescription>
              {businessModel === 'MRR' ? 'Receita Recorrente Mensal (MRR)' : 'Valor Total dos Contratos (TCV)'}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {businessModel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Sem dados de evolução disponíveis
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatMonth}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as TemporalData;
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold">{formatMonth(item.month)}</p>
                      <p className="text-sm">
                        {businessModel === 'MRR' ? 'MRR' : 'TCV'}: {formatCurrency(item.value)}
                      </p>
                      {businessModel === 'MRR' && item.activeDeals && (
                        <p className="text-sm text-muted-foreground">
                          Contratos ativos: {item.activeDeals}
                        </p>
                      )}
                      {businessModel === 'TCV' && item.salesCount && (
                        <p className="text-sm text-muted-foreground">
                          Vendas: {item.salesCount}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={brandColor}
                strokeWidth={2}
                dot={{ r: 4, fill: brandColor }}
                activeDot={{ r: 6, fill: brandColor }}
                name={businessModel === 'MRR' ? 'MRR' : 'TCV'}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
