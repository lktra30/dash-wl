'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface CustomerData {
  month: string;
  new_customers: number;
  cumulative_customers: number;
}

interface Props {
  months?: number;
  brandColor?: string;
  fromDate?: string;
  toDate?: string;
}

export function CustomerEvolutionChart({ months = 12, brandColor = "#6366f1", fromDate, toDate }: Props) {
  const [data, setData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [months, fromDate, toDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ 
        metric: 'customer-evolution',
        months: months.toString()
      });
      
      // Add date filters if provided
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const response = await fetch(`/api/dashboard/advanced-metrics?${params}`);
      if (!response.ok) throw new Error('Falha ao carregar dados');

      const result = await response.json();
      setData(result.data || []);
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
          <CardTitle>Evolução de Clientes</CardTitle>
          <CardDescription>Novos clientes por mês</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Erro: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  };

  // Calculate total and average
  const totalNewCustomers = data.reduce((sum, item) => sum + item.new_customers, 0);
  const avgNewCustomers = data.length > 0 ? totalNewCustomers / data.length : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Evolução de Clientes</CardTitle>
            <CardDescription>
              Novos clientes por mês
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Média mensal</p>
            <p className="text-2xl font-bold">{avgNewCustomers.toFixed(0)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Sem dados de clientes disponíveis
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={brandColor} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={brandColor} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={brandColor} stopOpacity={0.5}/>
                  <stop offset="95%" stopColor={brandColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatMonth}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as CustomerData;
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold">{formatMonth(item.month)}</p>
                      <p className="text-sm" style={{ color: brandColor }}>
                        Novos: {item.new_customers}
                      </p>
                      <p className="text-sm" style={{ color: brandColor, opacity: 0.7 }}>
                        Total acumulado: {item.cumulative_customers}
                      </p>
                    </div>
                  );
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="new_customers"
                stroke={brandColor}
                fillOpacity={1}
                fill="url(#colorNew)"
                name="Novos Clientes"
              />
              <Area
                type="monotone"
                dataKey="cumulative_customers"
                stroke={brandColor}
                strokeOpacity={0.7}
                fillOpacity={1}
                fill="url(#colorCumulative)"
                name="Total Acumulado"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
