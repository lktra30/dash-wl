'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoalProgressBar } from './goal-progress-bar';
import { getMeetingsProgress, type GoalData } from '@/lib/goal-progress-service';
import { useAuth } from '@/hooks/use-auth';
import { Calendar } from 'lucide-react';

export interface MeetingsGoalProgressProps {
  whitelabelId: string;
  employeeId?: string;
  className?: string;
}

export function MeetingsGoalProgress({
  whitelabelId,
  employeeId,
  className,
}: MeetingsGoalProgressProps) {
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
        const data = await getMeetingsProgress(whitelabelId, employeeId);
        setProgress(data);
      } catch (err) {
        setError('Não foi possível carregar o progresso de reuniões');
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();

    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchProgress, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [whitelabelId, employeeId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6" style={{ color: brandColor }} />
            Meta de Reuniões
          </CardTitle>
          <CardDescription className="text-base">Progresso de reuniões realizadas</CardDescription>
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
            <Calendar className="h-6 w-6" style={{ color: brandColor }} />
            Meta de Reuniões
          </CardTitle>
          <CardDescription className="text-base">Progresso de reuniões realizadas</CardDescription>
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
          <Calendar className="h-6 w-6" style={{ color: brandColor }} />
          Meta de Reuniões
        </CardTitle>
        <CardDescription className="text-base">
          Progresso de reuniões realizadas{' '}
          {employeeId ? 'pelo colaborador' : 'pela equipe'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-7">
        <GoalProgressBar
          label="Reuniões Hoje"
          current={progress.daily.current}
          target={progress.daily.target}
          percentage={progress.daily.percentage}
          period="day"
          type="meetings"
          brandColor={brandColor}
        />
        
        <GoalProgressBar
          label="Reuniões Semanais"
          current={progress.weekly.current}
          target={progress.weekly.target}
          percentage={progress.weekly.percentage}
          period="week"
          type="meetings"
          brandColor={brandColor}
        />
        
        <GoalProgressBar
          label="Reuniões Mensais"
          current={progress.monthly.current}
          target={progress.monthly.target}
          percentage={progress.monthly.percentage}
          period="month"
          type="meetings"
          brandColor={brandColor}
        />
      </CardContent>
    </Card>
  );
}
