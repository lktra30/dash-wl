'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  ComposedChart, 
  Line, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface GrowthData {
  month: string;
  revenue: number;
  customerCount: number;
  growthRate: number | null;
  businessModel: 'MRR' | 'TCV';
}

interface Props {
  months?: number;
  brandColor?: string;
  fromDate?: string;
  toDate?: string;
}

export function GrowthRateChart({ months = 12, brandColor = "#6366f1", fromDate, toDate }: Props) {
  const [data, setData] = useState<GrowthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessModel, setBusinessModel] = useState<'MRR' | 'TCV'>('TCV');

  useEffect(() => {
    fetchData();
  }, [months, fromDate, toDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ 
        metric: 'growth-rate',
        months: months.toString()
      });
      
      // Add date filters if provided
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

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
          <CardTitle>Taxa de Crescimento</CardTitle>
          <CardDescription>Crescimento mensal de receita</CardDescription>
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
          <CardTitle>Taxa de Crescimento</CardTitle>
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
      currency: 'BRL',
      notation: 'compact'
    }).format(value);
  };

  const formatMonth = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  };

  // Calculate average growth rate
  const validGrowthRates = data.filter(d => d.growthRate !== null).map(d => d.growthRate!);
  const avgGrowthRate = validGrowthRates.length > 0
    ? validGrowthRates.reduce((sum, rate) => sum + rate, 0) / validGrowthRates.length
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Taxa de Crescimento</CardTitle>
            <CardDescription>
              Crescimento mensal de {businessModel === 'MRR' ? 'MRR' : 'receita'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {businessModel}
            </Badge>
            <Badge variant={avgGrowthRate >= 10 ? 'default' : avgGrowthRate >= 0 ? 'secondary' : 'destructive'}>
              Média: {avgGrowthRate.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Sem dados de crescimento disponíveis
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatMonth}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value) => formatCurrency(value)}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as GrowthData;
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold">{formatMonth(item.month)}</p>
                      <p className="text-sm">
                        Receita: {formatCurrency(item.revenue)}
                      </p>
                      <p className="text-sm">
                        Clientes: {item.customerCount}
                      </p>
                      {item.growthRate !== null && (
                        <p className={`text-sm font-medium ${item.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Crescimento: {item.growthRate > 0 ? '+' : ''}{item.growthRate.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="revenue" 
                fill={brandColor}
                name="Receita"
                radius={[8, 8, 0, 0]}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="growthRate" 
                stroke={brandColor}
                strokeWidth={2}
                dot={{ r: 4, fill: brandColor }}
                activeDot={{ r: 6, fill: brandColor }}
                name="Taxa de Crescimento (%)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
