'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface FunnelData {
  pipeline_id: string;
  pipeline_name: string;
  stage_name: string;
  stage_order: number;
  contacts_in_stage: number;
  contacts_in_next_stage: number;
  conversion_rate: number | null;
}

interface Props {
  pipelineId?: string;
  fromDate?: string;
  toDate?: string;
  brandColor?: string;
}

export function FunnelConversionChart({ pipelineId, fromDate, toDate, brandColor = "#6366f1" }: Props) {
  const [data, setData] = useState<FunnelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [pipelineId, fromDate, toDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ metric: 'funnel-conversion' });
      if (pipelineId) params.append('pipelineId', pipelineId);
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
          <CardTitle>Taxa de Conversão do Funil</CardTitle>
          <CardDescription>Conversão entre etapas do pipeline</CardDescription>
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
          <CardTitle>Taxa de Conversão do Funil</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Erro: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for chart
  const chartData = data
    .filter(item => item.conversion_rate !== null)
    .map(item => ({
      stage: item.stage_name,
      rate: item.conversion_rate,
      from: item.contacts_in_stage,
      to: item.contacts_in_next_stage
    }));

  // Color scale based on conversion rate - using brand color with opacity variations
  const getColor = (rate: number) => {
    // High conversion (70%+): full brand color
    if (rate >= 70) return brandColor;
    // Medium conversion (40-69%): 70% opacity
    if (rate >= 40) return `${brandColor}B3`; // B3 = 70% in hex
    // Low conversion (<40%): 40% opacity
    return `${brandColor}66`; // 66 = 40% in hex
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxa de Conversão do Funil</CardTitle>
        <CardDescription>
          Conversão entre etapas do pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Sem dados de conversão disponíveis
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="stage" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                label={{ value: 'Taxa (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold">{data.stage}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.from} → {data.to} contatos
                      </p>
                      <p className="text-sm font-medium">
                        Taxa: {data.rate.toFixed(1)}%
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.rate || 0)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
