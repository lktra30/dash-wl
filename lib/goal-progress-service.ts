import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface GoalTargets {
  sdrMeetingsTarget: number;
  closerSalesTarget: number;
}

export interface GoalProgress {
  current: number;
  target: number;
  percentage: number;
}

export interface GoalData {
  daily: GoalProgress;
  weekly: GoalProgress;
  monthly: GoalProgress;
} 

interface Deal {
  value: number;
  duration?: number;
  updated_at: string;
}

/**
 * Busca as metas configuradas para o whitelabel
 */
export async function getGoalTargets(whitelabelId: string): Promise<GoalTargets> {
  const supabase = getSupabaseBrowserClient();
  
  const { data, error } = await supabase
    .from('commissions_settings')
    .select('sdr_meetings_target, closer_sales_target')
    .eq('whitelabel_id', whitelabelId)
    .single();

  if (error) {
    return {
      sdrMeetingsTarget: 20,
      closerSalesTarget: 10000,
    };
  }

  if (!data) {
    return {
      sdrMeetingsTarget: 20,
      closerSalesTarget: 10000,
    };
  }

  return {
    sdrMeetingsTarget: data.sdr_meetings_target || 20,
    closerSalesTarget: data.closer_sales_target || 10000,
  };
}

/**
 * Calcula a meta diária baseada na meta mensal
 */
function getDailyTarget(monthlyTarget: number): number {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.round((monthlyTarget / daysInMonth) * 100) / 100;
}

/**
 * Calcula a meta semanal baseada na meta mensal
 */
function getWeeklyTarget(monthlyTarget: number): number {
  // Aproximadamente 4.33 semanas por mês
  return Math.round((monthlyTarget / 4.33) * 100) / 100;
}

/**
 * Calcula o percentual de progresso
 */
function calculatePercentage(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.round((current / target) * 100 * 100) / 100;
}

/**
 * Busca o progresso de reuniões realizadas
 */
export async function getMeetingsProgress(
  whitelabelId: string,
  employeeId?: string
): Promise<GoalData> {
  const supabase = getSupabaseBrowserClient();
  const now = new Date();
  
  // Início do dia (00:00:00 UTC)
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  
  // Início da semana (segunda-feira 00:00:00 UTC)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getUTCDay();
  const diff = startOfWeek.getUTCDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setUTCDate(diff);
  startOfWeek.setUTCHours(0, 0, 0, 0);
  
  // Início do mês (00:00:00 UTC)
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));

  // Buscar metas
  const targets = await getGoalTargets(whitelabelId);
  const monthlyTarget = targets.sdrMeetingsTarget;
  const dailyTarget = getDailyTarget(monthlyTarget);
  const weeklyTarget = getWeeklyTarget(monthlyTarget);

  // Reuniões do dia
  const dailyQuery = supabase
    .from('meetings')
    .select('id, completed_at', { count: 'exact' })
    .eq('whitelabel_id', whitelabelId)
    .eq('status', 'completed');

  if (employeeId) {
    dailyQuery.eq('sdr_id', employeeId);
  }

  const { data: dailyData, count: dailyCount, error: dailyError } = await dailyQuery
    .gte('completed_at', startOfDay.toISOString())
    .lte('completed_at', now.toISOString());

  // Reuniões da semana
  const weeklyQuery = supabase
    .from('meetings')
    .select('id, completed_at', { count: 'exact' })
    .eq('whitelabel_id', whitelabelId)
    .eq('status', 'completed');

  if (employeeId) {
    weeklyQuery.eq('sdr_id', employeeId);
  }
  
  const { data: weeklyData, count: weeklyCount, error: weeklyError } = await weeklyQuery
    .gte('completed_at', startOfWeek.toISOString())
    .lte('completed_at', now.toISOString());

  // Reuniões do mês
  const monthlyQuery = supabase
    .from('meetings')
    .select('id, completed_at', { count: 'exact' })
    .eq('whitelabel_id', whitelabelId)
    .eq('status', 'completed');

  if (employeeId) {
    monthlyQuery.eq('sdr_id', employeeId);
  }
  
  const { data: monthlyData, count: monthlyCount, error: monthlyError } = await monthlyQuery
    .gte('completed_at', startOfMonth.toISOString())
    .lte('completed_at', now.toISOString());

  return {
    daily: {
      current: dailyCount || 0,
      target: dailyTarget,
      percentage: calculatePercentage(dailyCount || 0, dailyTarget),
    },
    weekly: {
      current: weeklyCount || 0,
      target: weeklyTarget,
      percentage: calculatePercentage(weeklyCount || 0, weeklyTarget),
    },
    monthly: {
      current: monthlyCount || 0,
      target: monthlyTarget,
      percentage: calculatePercentage(monthlyCount || 0, monthlyTarget),
    },
  };
}

/**
 * Calcula o valor de vendas baseado no modelo de negócio
 */
function calculateSalesValue(deals: Deal[], businessModel: "TCV" | "MRR"): number {

  if (!deals || deals.length === 0) {
    return 0;
  }
  
  if (businessModel === "MRR") {
    // MRR: divide each deal value by its duration to get monthly recurring revenue
    const result = deals.reduce((sum: number, deal: Deal, index: number) => {
      const value = Number(deal.value) || 0;
      const duration = Number(deal.duration) || 0;
      
      
      // Only include deals with valid duration > 0
      if (duration > 0) {
        return sum + (value / duration);
      }
      return sum;
    }, 0);
    
    return result;
  } else {
    // TCV: sum the total values of all deals
    const result = deals.reduce((sum: number, deal: Deal, index: number) => {
      const value = Number(deal.value) || 0;
      return sum + value;
    }, 0);
    
    return result;
  }
}

/**
 * Busca o progresso de vendas realizadas
 */
export async function getSalesProgress(
  whitelabelId: string,
  employeeId?: string,
  businessModel: "TCV" | "MRR" = "TCV"
): Promise<GoalData> {

  const supabase = getSupabaseBrowserClient();
  const now = new Date();
  
  // Início do dia (00:00:00 UTC)
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  
  // Início da semana (segunda-feira 00:00:00 UTC)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getUTCDay();
  const diff = startOfWeek.getUTCDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setUTCDate(diff);
  startOfWeek.setUTCHours(0, 0, 0, 0);
  
  // Início do mês (00:00:00 UTC)
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));


  // Buscar metas
  const targets = await getGoalTargets(whitelabelId);
  const monthlyTarget = targets.closerSalesTarget;
  const dailyTarget = getDailyTarget(monthlyTarget);
  const weeklyTarget = getWeeklyTarget(monthlyTarget);


  // Vendas do dia
  const dailyQuery = supabase
    .from('deals')
    .select('value, duration, updated_at')
    .eq('whitelabel_id', whitelabelId)
    .eq('status', 'won');
  
  if (employeeId) {
    dailyQuery.eq('closer_id', employeeId);
  }
  
  const { data: dailyDeals, error: dailyError } = await dailyQuery
    .gte('updated_at', startOfDay.toISOString())
    .lte('updated_at', now.toISOString());
  

  const dailySales = calculateSalesValue(dailyDeals || [], businessModel);


  // Vendas da semana
  const weeklyQuery = supabase
    .from('deals')
    .select('value, duration, updated_at')
    .eq('whitelabel_id', whitelabelId)
    .eq('status', 'won');
  
  if (employeeId) {
    weeklyQuery.eq('closer_id', employeeId);
  }
  
  const { data: weeklyDeals, error: weeklyError } = await weeklyQuery
    .gte('updated_at', startOfWeek.toISOString())
    .lte('updated_at', now.toISOString());
  

  const weeklySales = calculateSalesValue(weeklyDeals || [], businessModel);


  // Vendas do mês
  const monthlyQuery = supabase
    .from('deals')
    .select('value, duration, updated_at')
    .eq('whitelabel_id', whitelabelId)
    .eq('status', 'won');
  
  if (employeeId) {
    monthlyQuery.eq('closer_id', employeeId);
  }
  
  const { data: monthlyDeals, error: monthlyError } = await monthlyQuery
    .gte('updated_at', startOfMonth.toISOString())
    .lte('updated_at', now.toISOString());
  

  const monthlySales = calculateSalesValue(monthlyDeals || [], businessModel);


  const result = {
    daily: {
      current: Math.round(dailySales * 100) / 100,
      target: dailyTarget,
      percentage: calculatePercentage(dailySales, dailyTarget),
    },
    weekly: {
      current: Math.round(weeklySales * 100) / 100,
      target: weeklyTarget,
      percentage: calculatePercentage(weeklySales, weeklyTarget),
    },
    monthly: {
      current: Math.round(monthlySales * 100) / 100,
      target: monthlyTarget,
      percentage: calculatePercentage(monthlySales, monthlyTarget),
    },
  };


  return result;
}
