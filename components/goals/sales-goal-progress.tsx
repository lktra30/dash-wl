'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoalProgressBar } from './goal-progress-bar';
import { getSalesProgress, type GoalData } from '@/lib/goal-progress-service';
import { useAuth } from '@/hooks/use-auth';
import { TrendingUp } from 'lucide-react';

export interface SalesGoalProgressProps {
  whitelabelId: string;
  employeeId?: string;
  className?: string;
}

export function SalesGoalProgress({
  whitelabelId,
  employeeId,
  className,
}: SalesGoalProgressProps) {
  const { whitelabel } = useAuth();
  const [progress, setProgress] = useState<GoalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const brandColor = whitelabel?.brandColor || '#ffffff';

  useEffect(() => {
    async function fetchProgress() {
      try {
        setLoading(true);
        setError(null);
        const data = await getSalesProgress(
          whitelabelId, 
          employeeId, 
          whitelabel?.businessModel || "TCV"
        );

        setProgress(data);
      } catch (err) {
        setError('Não foi possível carregar o progresso de vendas');
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();

    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchProgress, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [whitelabelId, employeeId, whitelabel?.businessModel]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Meta de Vendas
          </CardTitle>
          <CardDescription className="text-base">Progresso de vendas realizadas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !progress) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-4 w-4" style={{ color: brandColor }} />
            Meta de Vendas
          </CardTitle>
          <CardDescription className="text-base">Progresso de vendas realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-base text-muted-foreground">
            {error || 'Não foi possível carregar os dados'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="h-6 w-6" style={{ color: brandColor }} />
          Meta de Vendas
        </CardTitle>
        <CardDescription className="text-base">
          Progresso de vendas realizadas{' '}
          {employeeId ? 'pelo colaborador' : 'pela equipe'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-7">
        <GoalProgressBar
          label="Vendas Hoje"
          current={progress.daily.current}
          target={progress.daily.target}
          percentage={progress.daily.percentage}
          period="day"
          type="sales"
          brandColor={brandColor}
        />
        
        <GoalProgressBar
          label="Vendas Semanais"
          current={progress.weekly.current}
          target={progress.weekly.target}
          percentage={progress.weekly.percentage}
          period="week"
          type="sales"
          brandColor={brandColor}
        />
        
        <GoalProgressBar
          label="Vendas Mensais"
          current={progress.monthly.current}
          target={progress.monthly.target}
          percentage={progress.monthly.percentage}
          period="month"
          type="sales"
          brandColor={brandColor}
        />
      </CardContent>
    </Card>
  );
}
