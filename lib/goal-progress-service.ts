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
 * Busca o progresso de reuniões realizadas (PIPELINE-AWARE)
 * Conta contatos que chegaram em stages com countsAsMeeting: true
 * ou em stages 'meeting'/'reuniao' (fallback para compatibilidade)
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

  // Query base para contacts com pipeline stages
  const buildQuery = (startDate: Date) => {
    const query = supabase
      .from('contacts')
      .select(`
        id,
        meeting_date,
        funnel_stage,
        sdr_id,
        pipeline_stages!stage_id (
          counts_as_meeting,
          counts_as_sale
        )
      `)
      .eq('whitelabel_id', whitelabelId)
      .not('meeting_date', 'is', null)
      .gte('meeting_date', startDate.toISOString())
      .lte('meeting_date', now.toISOString());

    if (employeeId) {
      query.eq('sdr_id', employeeId);
    }

    return query;
  };

  // Buscar contacts de cada período
  const { data: dailyContacts } = await buildQuery(startOfDay);
  const { data: weeklyContacts } = await buildQuery(startOfWeek);
  const { data: monthlyContacts } = await buildQuery(startOfMonth);

  // Função para contar reuniões (prioriza flag, fallback para stage name)
  // Note: All sales should count as meetings, but not all meetings are sales
  const countMeetings = (contacts: any[]) => {
    if (!contacts) return 0;
    return contacts.filter((contact: any) => {
      return (
        contact.pipeline_stages?.counts_as_meeting === true ||
        contact.pipeline_stages?.counts_as_sale === true ||
        contact.funnel_stage === 'meeting' ||
        contact.funnel_stage === 'reuniao'
        // REMOVED: contact.funnel_stage === 'won' - This was causing duplicate counting
        // Sales are already counted via counts_as_sale flag above
      );
    }).length;
  };

  const dailyCount = countMeetings(dailyContacts || []);
  const weeklyCount = countMeetings(weeklyContacts || []);
  const monthlyCount = countMeetings(monthlyContacts || []);

  return {
    daily: {
      current: dailyCount,
      target: dailyTarget,
      percentage: calculatePercentage(dailyCount, dailyTarget),
    },
    weekly: {
      current: weeklyCount,
      target: weeklyTarget,
      percentage: calculatePercentage(weeklyCount, weeklyTarget),
    },
    monthly: {
      current: monthlyCount,
      target: monthlyTarget,
      percentage: calculatePercentage(monthlyCount, monthlyTarget),
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
 * Busca o progresso de vendas realizadas (PIPELINE-AWARE)
 * Conta contatos que chegaram em stages com countsAsSale: true
 * ou com status 'won' (fallback para compatibilidade)
 *
 * NOTE: Ainda usa 'deals' table para valores, mas valida com pipeline stages
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

  // Query base para deals com valores (ainda precisamos dos valores de deals)
  const buildDealsQuery = (startDate: Date) => {
    const query = supabase
      .from('deals')
      .select('value, duration, sale_date')
      .eq('whitelabel_id', whitelabelId)
      .eq('status', 'won')
      .not('sale_date', 'is', null)
      .gte('sale_date', startDate.toISOString())
      .lte('sale_date', now.toISOString());

    if (employeeId) {
      query.eq('closer_id', employeeId);
    }

    return query;
  };

  // Buscar deals de cada período
  const { data: dailyDeals } = await buildDealsQuery(startOfDay);
  const { data: weeklyDeals } = await buildDealsQuery(startOfWeek);
  const { data: monthlyDeals } = await buildDealsQuery(startOfMonth);

  const dailySales = calculateSalesValue(dailyDeals || [], businessModel);
  const weeklySales = calculateSalesValue(weeklyDeals || [], businessModel);
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
