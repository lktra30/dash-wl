'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts';

interface PipelineData {
  pipeline: string;
  total_leads: number;
  converted_leads: number;
  conversion_rate: number;
  percentage_of_total: number;
}

interface Props {
  dateRangeLabel?: string;
  brandColor?: string;
}

// Function to generate color variations based on brand color
const generateColorVariations = (baseColor: string, count: number) => {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const opacity = 1 - (i * 0.15); // Decrease opacity for each variant
    const opacityHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
    colors.push(`${baseColor}${opacityHex}`);
  }
  return colors;
};

export function PipelineBreakdownChart({ dateRangeLabel, brandColor = "#6366f1" }: Props) {
  const [data, setData] = useState<PipelineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ metric: 'pipeline-breakdown' });

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
          <CardTitle>Distribuição por Pipeline ({dateRangeLabel || "Últimos 12 Meses"})</CardTitle>
          <CardDescription>Distribuição de leads por pipeline</CardDescription>
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
          <CardTitle>Distribuição por Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Erro: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    name: item.pipeline,
    value: item.total_leads,
    percentage: item.percentage_of_total,
    conversionRate: item.conversion_rate
  }));

  // Generate color variations based on brand color
  const COLORS = generateColorVariations(brandColor, Math.max(chartData.length, 5));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Pipeline ({dateRangeLabel || "Últimos 12 Meses"})</CardTitle>
        <CardDescription>
          Distribuição de leads por pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Sem dados de pipelines disponíveis
          </p>
        ) : (
          <div className="space-y-4">
            {/* Mobile: Show chart without labels, Desktop: Show with labels */}
            <div className="hidden md:block">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{data.name}</p>
                          <p className="text-sm">Leads: {data.value}</p>
                          <p className="text-sm">Participação: {data.percentage.toFixed(1)}%</p>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Mobile version: Smaller chart without labels, legend below */}
            <div className="block md:hidden">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg p-2 shadow-lg text-xs">
                          <p className="font-semibold">{data.name}</p>
                          <p>Leads: {data.value}</p>
                          <p>{data.percentage.toFixed(1)}%</p>
                        </div>
                      );
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Table with detailed stats */}
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 whitespace-nowrap">Pipeline</th>
                    <th className="text-right p-2 whitespace-nowrap">Leads</th>
                    <th className="text-right p-2 whitespace-nowrap">Participação</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="truncate">{item.pipeline}</span>
                        </div>
                      </td>
                      <td className="text-right p-2 whitespace-nowrap">{item.total_leads}</td>
                      <td className="text-right p-2 whitespace-nowrap">{item.percentage_of_total.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
