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
  saleDate?: string;
  status: string;
}

interface Contact {
  id: string;
  meetingDate?: string;
  status?: string;
  sdrId?: string;
}

/**
 * Busca as metas configuradas para o whitelabel via API segura
 */
export async function getGoalTargets(whitelabelId: string): Promise<GoalTargets> {
  try {
    const response = await fetch("/api/dashboard/commissions/settings", {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      return {
        sdrMeetingsTarget: 20,
        closerSalesTarget: 10000,
      };
    }

    const data = await response.json();

    if (!data) {
      return {
        sdrMeetingsTarget: 20,
        closerSalesTarget: 10000,
      };
    }

    return {
      sdrMeetingsTarget: data.sdrMeetingsTarget || 20,
      closerSalesTarget: data.closerSalesTarget || 10000,
    };
  } catch (error) {
    return {
      sdrMeetingsTarget: 20,
      closerSalesTarget: 10000,
    };
  }
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
 * Helper function to check if date is within date range
 */
function isWithinDateRange(dateStr: string | undefined, startDate: Date, endDate: Date): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date >= startDate && date <= endDate;
}

/**
 * Busca o progresso de reuniões realizadas via API segura
 * Conta contatos que chegaram em stages de reunião
 */
export async function getMeetingsProgress(
  whitelabelId: string,
  employeeId?: string
): Promise<GoalData> {
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

  // Buscar metas via API segura
  const targets = await getGoalTargets(whitelabelId);
  const monthlyTarget = targets.sdrMeetingsTarget;
  const dailyTarget = getDailyTarget(monthlyTarget);
  const weeklyTarget = getWeeklyTarget(monthlyTarget);

  try {
    // Fetch contacts via secure API route
    const response = await fetch("/api/dashboard/contacts", {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch contacts");
    }

    const contacts: Contact[] = await response.json();

    // Filter contacts by employee if specified
    let filteredContacts = contacts;
    if (employeeId) {
      filteredContacts = contacts.filter(c => c.sdrId === employeeId);
    }

    // Filter contacts with meeting dates
    const contactsWithMeetings = filteredContacts.filter(c => c.meetingDate);

    // Count meetings for each period
    const dailyCount = contactsWithMeetings.filter(c =>
      isWithinDateRange(c.meetingDate, startOfDay, now)
    ).length;

    const weeklyCount = contactsWithMeetings.filter(c =>
      isWithinDateRange(c.meetingDate, startOfWeek, now)
    ).length;

    const monthlyCount = contactsWithMeetings.filter(c =>
      isWithinDateRange(c.meetingDate, startOfMonth, now)
    ).length;

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
  } catch (error) {
    return {
      daily: { current: 0, target: dailyTarget, percentage: 0 },
      weekly: { current: 0, target: weeklyTarget, percentage: 0 },
      monthly: { current: 0, target: monthlyTarget, percentage: 0 },
    };
  }
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
    return deals.reduce((sum: number, deal: Deal) => {
      const value = Number(deal.value) || 0;
      const duration = Number(deal.duration) || 0;

      // Only include deals with valid duration > 0
      if (duration > 0) {
        return sum + (value / duration);
      }
      return sum;
    }, 0);
  } else {
    // TCV: sum the total values of all deals
    return deals.reduce((sum: number, deal: Deal) => {
      const value = Number(deal.value) || 0;
      return sum + value;
    }, 0);
  }
}

/**
 * Busca o progresso de vendas realizadas via API segura
 * Conta deals com status 'won'
 */
export async function getSalesProgress(
  whitelabelId: string,
  employeeId?: string,
  businessModel: "TCV" | "MRR" = "TCV"
): Promise<GoalData> {
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

  // Buscar metas via API segura
  const targets = await getGoalTargets(whitelabelId);
  const monthlyTarget = targets.closerSalesTarget;
  const dailyTarget = getDailyTarget(monthlyTarget);
  const weeklyTarget = getWeeklyTarget(monthlyTarget);

  try {
    // Fetch deals via secure API route
    const response = await fetch("/api/dashboard/deals", {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch deals");
    }

    const deals: Deal[] = await response.json();

    // Filter won deals only
    const wonDeals = deals.filter(d => d.status === 'won');

    // Filter deals for each period based on saleDate
    const dailyDeals = wonDeals.filter(d =>
      isWithinDateRange(d.saleDate, startOfDay, now)
    );

    const weeklyDeals = wonDeals.filter(d =>
      isWithinDateRange(d.saleDate, startOfWeek, now)
    );

    const monthlyDeals = wonDeals.filter(d =>
      isWithinDateRange(d.saleDate, startOfMonth, now)
    );

    const dailySales = calculateSalesValue(dailyDeals, businessModel);
    const weeklySales = calculateSalesValue(weeklyDeals, businessModel);
    const monthlySales = calculateSalesValue(monthlyDeals, businessModel);

    return {
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
  } catch (error) {
    return {
      daily: { current: 0, target: dailyTarget, percentage: 0 },
      weekly: { current: 0, target: weeklyTarget, percentage: 0 },
      monthly: { current: 0, target: monthlyTarget, percentage: 0 },
    };
  }
}
