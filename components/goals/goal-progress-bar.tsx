import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface GoalProgressBarProps {
  label: string;
  current: number;
  target: number;
  percentage: number;
  period: 'day' | 'week' | 'month';
  type: 'meetings' | 'sales';
  brandColor?: string;
  className?: string;
}

export function GoalProgressBar({
  label,
  current,
  target,
  percentage,
  period,
  type,
  brandColor = '#3b82f6',
  className,
}: GoalProgressBarProps) {
  // Define cores baseadas no percentual de progresso
  const getProgressColor = () => {
    // Sempre usar brandColor, variando apenas a opacidade baseado no progresso
    if (percentage >= 100) return brandColor; // 100%+: cor cheia (meta atingida)
    if (percentage >= 75) return brandColor; // 75-99%: cor cheia
    if (percentage >= 50) return `${brandColor}CC`; // 50-74%: 80% opacidade
    return `${brandColor}99`; // 0-49%: 60% opacidade
  };

  // Define texto do badge
  const getBadgeVariant = () => {
    if (percentage >= 100) return 'default';
    if (percentage >= 75) return 'secondary';
    return 'outline';
  };

  // Formata valores de vendas com moeda
  const formatValue = (value: number) => {
    if (type === 'sales') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    }
    return value.toString();
  };

  // Traduz período
  const getPeriodLabel = () => {
    switch (period) {
      case 'day':
        return 'Hoje';
      case 'week':
        return 'Esta Semana';
      case 'month':
        return 'Este Mês';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-base font-semibold leading-none">{label}</p>
          <p className="text-sm text-muted-foreground">{getPeriodLabel()}</p>
        </div>
        <Badge 
          variant={getBadgeVariant()} 
          className="text-sm px-3 py-1"
          style={percentage >= 100 ? { backgroundColor: brandColor, color: 'white' } : {}}
        >
          {percentage >= 100 ? '✓ ' : ''}
          {percentage.toFixed(0)}%
        </Badge>
      </div>
      
      <div className="relative w-full h-4 bg-primary/20 rounded-full overflow-hidden">
        <div
          className="h-full transition-all rounded-full"
          style={{ 
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: getProgressColor()
          }}
        />
      </div>
      
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          <span className="text-foreground text-sm">{formatValue(current)}</span>
          {' de '}
          <span className="">{formatValue(target)}</span>
        </span>
        {percentage > 100 && (
          <span className="font-semibold text-sm" style={{ color: brandColor }}>
            +{formatValue(current - target)} acima da meta
          </span>
        )}
      </div>
    </div>
  );
}
