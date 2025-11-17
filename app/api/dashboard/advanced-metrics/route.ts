import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    
    const metric = searchParams.get('metric');
    const pipelineId = searchParams.get('pipelineId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const months = searchParams.get('months');

    console.log('[Advanced Metrics] Request:', { metric, pipelineId, fromDate, toDate, months });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[Advanced Metrics] Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's whitelabel_id - try employees table first, then fallback to users table
    let whitelabelId: string | null = null;

    // Try employees table (new system)
    const { data: employee } = await supabase
      .from('employees')
      .select('whitelabel_id')
      .eq('auth_user_id', user.id)
      .single();

    if (employee?.whitelabel_id) {
      whitelabelId = employee.whitelabel_id;
    } else {
      // Fallback to users table (legacy system)
      const { data: legacyUser } = await supabase
        .from('users')
        .select('whitelabel_id')
        .eq('email', user.email)
        .single();

      if (legacyUser?.whitelabel_id) {
        whitelabelId = legacyUser.whitelabel_id;
      }
    }

    if (!whitelabelId) {
      console.error('[Advanced Metrics] Whitelabel not found for user:', user.id);
      return NextResponse.json({ error: 'Whitelabel not found' }, { status: 404 });
    }
    console.log('[Advanced Metrics] Whitelabel ID:', whitelabelId);

    // Get whitelabel business model
    const { data: whitelabel } = await supabase
      .from('whitelabels')
      .select('business_model, name')
      .eq('id', whitelabelId)
      .single();

    const businessModel = whitelabel?.business_model || 'TCV';
    console.log('[Advanced Metrics] Business model:', businessModel);

    switch (metric) {
      case 'funnel-conversion':
        return await getFunnelConversion(supabase, whitelabelId, pipelineId, fromDate, toDate);
      
      case 'channel-breakdown':
        return await getChannelBreakdown(supabase, whitelabelId, fromDate, toDate);
      
      case 'pipeline-breakdown':
        return await getPipelineBreakdown(supabase, whitelabelId, fromDate, toDate);
      
      case 'customer-evolution':
        return await getCustomerEvolution(supabase, whitelabelId, months, fromDate, toDate);
      
      case 'growth-rate':
        return await getGrowthRate(supabase, whitelabelId, businessModel, months, fromDate, toDate);
      
      case 'temporal-evolution':
        return await getTemporalEvolution(supabase, whitelabelId, businessModel, months, fromDate, toDate);
      
      case 'ltv-cac':
        return await getLtvCacComparison(supabase, whitelabelId, businessModel, fromDate, toDate);
      
      default:
        return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Advanced metrics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =====================================================
// Business Model INDEPENDENT Metrics (Database Functions)
// =====================================================

async function getFunnelConversion(
  supabase: any, 
  whitelabelId: string, 
  pipelineId: string | null,
  fromDate: string | null,
  toDate: string | null
) {
  try {
    const { data, error } = await supabase.rpc('get_funnel_conversion_rates', {
      p_whitelabel_id: whitelabelId,
      p_pipeline_id: pipelineId || null,
      p_from_date: fromDate || null,
      p_to_date: toDate || null
    });

    if (error) {
      console.error('[Funnel Conversion] RPC error:', error);
      throw error;
    }
    
    console.log('[Funnel Conversion] Data:', data?.length || 0, 'records');
    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('[Funnel Conversion] Error:', error);
    // Return empty data instead of error if it's just missing data
    return NextResponse.json({ data: [] });
  }
}

async function getChannelBreakdown(
  supabase: any,
  whitelabelId: string,
  fromDate: string | null,
  toDate: string | null
) {
  try {
    const { data, error } = await supabase.rpc('get_channel_breakdown', {
      p_whitelabel_id: whitelabelId,
      p_from_date: fromDate || null,
      p_to_date: toDate || null
    });

    if (error) {
      console.error('[Channel Breakdown] RPC error:', error);
      throw error;
    }

    console.log('[Channel Breakdown] Data:', data?.length || 0, 'records');
    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('[Channel Breakdown] Error:', error);
    return NextResponse.json({ data: [] });
  }
}

async function getPipelineBreakdown(
  supabase: any,
  whitelabelId: string,
  fromDate: string | null,
  toDate: string | null
) {
  try {
    // Build query
    let query = supabase
      .from('contacts')
      .select(`
        pipeline_id,
        pipelines (
          name
        )
      `)
      .eq('whitelabel_id', whitelabelId);

    // Apply date filters if provided
    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }
    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    const { data: contacts, error } = await query;

    if (error) {
      console.error('[Pipeline Breakdown] Query error:', error);
      throw error;
    }

    // Aggregate by pipeline
    const pipelineMap = new Map<string, { name: string; total_leads: number; converted_leads: number }>();

    for (const contact of contacts || []) {
      const pipelineId = contact.pipeline_id || 'sem-pipeline';
      const pipelineName = contact.pipelines?.name || 'Sem Pipeline';

      if (!pipelineMap.has(pipelineId)) {
        pipelineMap.set(pipelineId, {
          name: pipelineName,
          total_leads: 0,
          converted_leads: 0
        });
      }

      const stats = pipelineMap.get(pipelineId)!;
      stats.total_leads++;
    }

    // Convert to array and calculate percentages
    const totalLeads = contacts?.length || 0;
    const result = Array.from(pipelineMap.values()).map(item => ({
      pipeline: item.name,
      total_leads: item.total_leads,
      converted_leads: item.converted_leads,
      conversion_rate: item.total_leads > 0 
        ? parseFloat(((item.converted_leads / item.total_leads) * 100).toFixed(1))
        : 0,
      percentage_of_total: totalLeads > 0
        ? parseFloat(((item.total_leads / totalLeads) * 100).toFixed(1))
        : 0
    }));

    console.log('[Pipeline Breakdown] Data:', result.length, 'pipelines');
    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('[Pipeline Breakdown] Error:', error);
    return NextResponse.json({ data: [] });
  }
}

async function getCustomerEvolution(
  supabase: any,
  whitelabelId: string,
  months: string | null,
  fromDate: string | null = null,
  toDate: string | null = null
) {
  try {
    const { data, error } = await supabase.rpc('get_customer_evolution', {
      p_whitelabel_id: whitelabelId,
      p_months: months ? parseInt(months) : 12,
      p_from_date: fromDate || null,
      p_to_date: toDate || null
    });

    if (error) {
      console.error('[Customer Evolution] RPC error:', error);
      throw error;
    }

    console.log('[Customer Evolution] Data:', data?.length || 0, 'records');
    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('[Customer Evolution] Error:', error);
    return NextResponse.json({ data: [] });
  }
}

// =====================================================
// Business Model DEPENDENT Metrics (Backend Calculations)
// =====================================================

async function getGrowthRate(
  supabase: any,
  whitelabelId: string,
  businessModel: 'TCV' | 'MRR',
  months: string | null,
  fromDate: string | null = null,
  toDate: string | null = null
) {
  try {
    // Determine date range: use provided dates or calculate from months
    let startDate: Date;
    let endDate: Date;
    
    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
    } else {
      const monthsBack = months ? parseInt(months) : 12;
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsBack);
      endDate = new Date();
    }

    // Get sales data
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select(`
        id,
        sale_date,
        deal_value,
        stage_id,
        pipeline_stages!inner(counts_as_sale)
      `)
      .eq('whitelabel_id', whitelabelId)
      .eq('pipeline_stages.counts_as_sale', true)
      .not('sale_date', 'is', null)
      .gte('sale_date', startDate.toISOString())
      .lte('sale_date', endDate.toISOString())
      .order('sale_date', { ascending: true });

    if (error) {
      console.error('[Growth Rate] Query error:', error);
      throw error;
    }

    console.log('[Growth Rate] Contacts found:', contacts?.length || 0);

    // Return empty array if no data
    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Group by month and calculate revenue based on business model
    const monthlyRevenue = contacts.reduce((acc: any, contact: any) => {
      const month = new Date(contact.sale_date).toISOString().substring(0, 7);
      if (!acc[month]) acc[month] = { revenue: 0, count: 0 };

      if (businessModel === 'MRR') {
        // For MRR, each sale adds to recurring revenue
        acc[month].revenue += contact.deal_value || 0;
      } else {
        // For TCV, sum total contract values
        acc[month].revenue += contact.deal_value || 0;
      }
      acc[month].count += 1;

      return acc;
    }, {});

    // Calculate month-over-month growth rate
    const monthlyData = Object.keys(monthlyRevenue)
      .sort()
      .map((month, index, arr) => {
        const current = monthlyRevenue[month].revenue;
        const previous = index > 0 ? monthlyRevenue[arr[index - 1]].revenue : null;
        
        let growthRate = null;
        if (previous && previous > 0) {
          growthRate = ((current - previous) / previous) * 100;
        }

        return {
          month,
          revenue: current,
          customerCount: monthlyRevenue[month].count,
          growthRate: growthRate ? parseFloat(growthRate.toFixed(2)) : null,
          businessModel
        };
      });

    return NextResponse.json({ data: monthlyData });
  } catch (error: any) {
    console.error('[Growth Rate] Error:', error);
    return NextResponse.json({ data: [] });
  }
}

async function getTemporalEvolution(
  supabase: any,
  whitelabelId: string,
  businessModel: 'TCV' | 'MRR',
  months: string | null,
  fromDate: string | null = null,
  toDate: string | null = null
) {
  try {
    // Determine date range: use provided dates or calculate from months
    let startDate: Date;
    let endDate: Date;
    
    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
    } else {
      const monthsBack = months ? parseInt(months) : 12;
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsBack);
      endDate = new Date();
    }

    if (businessModel === 'MRR') {
      // MRR Evolution: Track recurring revenue over time
      const { data: deals, error } = await supabase
        .from('deals')
        .select('value, duration, sale_date, status')
        .eq('whitelabel_id', whitelabelId)
        .eq('status', 'won')
        .not('sale_date', 'is', null)
        .gte('sale_date', startDate.toISOString())
        .lte('sale_date', endDate.toISOString())
        .order('sale_date', { ascending: true });

      if (error) {
        console.error('[Temporal Evolution MRR] Query error:', error);
        throw error;
      }

      console.log('[Temporal Evolution MRR] Deals found:', deals?.length || 0);

      if (!deals || deals.length === 0) {
        return NextResponse.json({ data: [] });
      }

    // Calculate MRR per month (deals that are still active)
    const monthlyMRR: { [key: string]: { mrr: number; activeDeals: number; churnedDeals: number } } = {};
    
    deals.forEach((deal: any) => {
      const saleDate = new Date(deal.sale_date);
      const monthlyValue = deal.value || 0;
      const durationMonths = deal.duration || 12;
      
      // Add MRR for each month the deal is active
      for (let i = 0; i < durationMonths; i++) {
        const activeMonth = new Date(saleDate);
        activeMonth.setMonth(activeMonth.getMonth() + i);
        const monthKey = activeMonth.toISOString().substring(0, 7);
        
        if (!monthlyMRR[monthKey]) {
          monthlyMRR[monthKey] = { mrr: 0, activeDeals: 0, churnedDeals: 0 };
        }
        
        monthlyMRR[monthKey].mrr += monthlyValue;
        if (i === 0) monthlyMRR[monthKey].activeDeals += 1;
      }
    });

    const mrrData = Object.keys(monthlyMRR)
      .sort()
      .map((month) => ({
        month,
        value: parseFloat(monthlyMRR[month].mrr.toFixed(2)),
        activeDeals: monthlyMRR[month].activeDeals,
        metric: 'MRR',
        businessModel: 'MRR'
      }));

      return NextResponse.json({ data: mrrData });

    } else {
      // TCV Evolution: Track total contract value over time
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select(`
          sale_date,
          deal_value,
          pipeline_stages!inner(counts_as_sale)
        `)
        .eq('whitelabel_id', whitelabelId)
        .eq('pipeline_stages.counts_as_sale', true)
        .not('sale_date', 'is', null)
        .gte('sale_date', startDate.toISOString())
        .lte('sale_date', endDate.toISOString())
        .order('sale_date', { ascending: true });

      if (error) {
        console.error('[Temporal Evolution TCV] Query error:', error);
        throw error;
      }

      console.log('[Temporal Evolution TCV] Contacts found:', contacts?.length || 0);

      if (!contacts || contacts.length === 0) {
        return NextResponse.json({ data: [] });
      }

      const monthlyTCV: { [key: string]: { tcv: number; count: number } } = {};
      
      contacts.forEach((contact: any) => {
        const month = new Date(contact.sale_date).toISOString().substring(0, 7);
        if (!monthlyTCV[month]) monthlyTCV[month] = { tcv: 0, count: 0 };
        
        monthlyTCV[month].tcv += contact.deal_value || 0;
        monthlyTCV[month].count += 1;
      });

      const tcvData = Object.keys(monthlyTCV)
        .sort()
        .map((month) => ({
          month,
          value: parseFloat(monthlyTCV[month].tcv.toFixed(2)),
          salesCount: monthlyTCV[month].count,
          metric: 'TCV',
          businessModel: 'TCV'
        }));

      return NextResponse.json({ data: tcvData });
    }
  } catch (error: any) {
    console.error('[Temporal Evolution] Error:', error);
    return NextResponse.json({ data: [] });
  }
}
async function getLtvCacComparison(
  supabase: any,
  whitelabelId: string,
  businessModel: 'TCV' | 'MRR',
  fromDate: string | null = null,
  toDate: string | null = null
) {
  try {
    // Get CAC (Customer Acquisition Cost) - same for both models
    const { data: whitelabel } = await supabase
      .from('whitelabels')
      .select('meta_ads_spend')
      .eq('id', whitelabelId)
      .single();

    const totalAdSpend = whitelabel?.meta_ads_spend || 0;

    if (businessModel === 'MRR') {
      // MRR Model: LTV = Average Monthly Value × Average Customer Lifetime (months)
      let dealsQuery = supabase
        .from('deals')
        .select('value, duration, sale_date')
        .eq('whitelabel_id', whitelabelId)
        .eq('status', 'won');
      
      // Apply date filters if provided
      if (fromDate) dealsQuery = dealsQuery.gte('sale_date', fromDate);
      if (toDate) dealsQuery = dealsQuery.lte('sale_date', toDate);
      
      const { data: deals } = await dealsQuery;

      console.log('[LTV/CAC MRR] Deals found:', deals?.length || 0);

      const avgMonthlyValue = deals?.length 
        ? deals.reduce((sum: number, d: any) => sum + (d.value || 0), 0) / deals.length
        : 0;

      const avgLifetimeMonths = deals?.length
        ? deals.reduce((sum: number, d: any) => sum + (d.duration || 12), 0) / deals.length
        : 12;

      const ltv = avgMonthlyValue * avgLifetimeMonths;

      let customersQuery = supabase
        .from('contacts')
        .select('id, sale_date, pipeline_stages!inner(counts_as_sale)')
        .eq('whitelabel_id', whitelabelId)
        .eq('pipeline_stages.counts_as_sale', true);
      
      // Apply date filters if provided
      if (fromDate) customersQuery = customersQuery.gte('sale_date', fromDate);
      if (toDate) customersQuery = customersQuery.lte('sale_date', toDate);
      
      const { data: customers } = await customersQuery;

      const cac = customers?.length > 0 ? totalAdSpend / customers.length : 0;

      return NextResponse.json({
        data: {
          ltv: parseFloat(ltv.toFixed(2)),
          cac: parseFloat(cac.toFixed(2)),
          ltvCacRatio: cac > 0 ? parseFloat((ltv / cac).toFixed(2)) : null,
          avgMonthlyValue: parseFloat(avgMonthlyValue.toFixed(2)),
          avgLifetimeMonths: parseFloat(avgLifetimeMonths.toFixed(1)),
          totalCustomers: customers?.length || 0,
          businessModel: 'MRR'
        }
      });

    } else {
      // TCV Model: LTV = Average Deal Value (one-time purchase)
      let contactsQuery = supabase
        .from('contacts')
        .select(`
          deal_value,
          sale_date,
          pipeline_stages!inner(counts_as_sale)
        `)
        .eq('whitelabel_id', whitelabelId)
        .eq('pipeline_stages.counts_as_sale', true);
      
      // Apply date filters if provided
      if (fromDate) contactsQuery = contactsQuery.gte('sale_date', fromDate);
      if (toDate) contactsQuery = contactsQuery.lte('sale_date', toDate);
      
      const { data: contacts } = await contactsQuery;

      console.log('[LTV/CAC TCV] Contacts found:', contacts?.length || 0);

      const totalRevenue = contacts?.reduce((sum: number, c: any) => sum + (c.deal_value || 0), 0) || 0;
      const customerCount = contacts?.length || 0;
      const ltv = customerCount > 0 ? totalRevenue / customerCount : 0;
      const cac = customerCount > 0 ? totalAdSpend / customerCount : 0;

      return NextResponse.json({
        data: {
          ltv: parseFloat(ltv.toFixed(2)),
          cac: parseFloat(cac.toFixed(2)),
          ltvCacRatio: cac > 0 ? parseFloat((ltv / cac).toFixed(2)) : null,
          avgDealValue: parseFloat(ltv.toFixed(2)),
          totalCustomers: customerCount,
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          businessModel: 'TCV'
        }
      });
    }
  } catch (error: any) {
    console.error('[LTV/CAC] Error:', error);
    // Return default empty data
    return NextResponse.json({
      data: {
        ltv: 0,
        cac: 0,
        ltvCacRatio: null,
        totalCustomers: 0,
        businessModel
      }
    });
  }
}
