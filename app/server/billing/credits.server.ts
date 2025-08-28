import { createClient } from '@supabase/supabase-js';
import { generateId } from 'ai';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export interface UserUsage {
  userId: string;
  planId: string;
  dailyUsage: number;
  dailyUsageDate: string;
  dailyRequestCount: number;
  monthlyInteractionCount: number;
  remainingBudget: number;
  planStartDate: string;
  plan: {
    name: string;
    dailyAllowance: number;
    monthlyInteractionCap: number;
    monthlyTokenCap: number;
  };
}

export interface DebitResult {
  success: boolean;
  error?: string;
  remainingBudget?: number;
  dailyUsage?: number;
  dailyRequestCount?: number;
}

/**
 * Obtém informações de uso do usuário
 */
export async function getUserUsage(userId: string): Promise<UserUsage | null> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      plan_id,
      daily_usage,
      daily_usage_date,
      daily_request_count,
      remaining_budget,
      plan_start_date,
      plans!inner(
        name,
        daily_allowance,
        monthly_interaction_cap,
        monthly_token_cap
      )
    `)
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching user usage:', error);
    return null;
  }

  // Calcular uso mensal real baseado na tabela credit_ledger
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: monthlyUsageData, error: monthlyError } = await supabase
    .from('credit_ledger')
    .select('amount')
    .eq('user_id', userId)
    .gte('created_at', monthStart.toISOString());

  const monthlyInteractionCount = monthlyUsageData?.reduce((total, record) => total + (record.amount || 0), 0) || 0;

  if (monthlyError) {
    console.error('Error fetching monthly usage:', monthlyError);
  }

  return {
    userId: data.id,
    planId: data.plan_id,
    dailyUsage: data.daily_usage || 0,
    dailyUsageDate: data.daily_usage_date || new Date().toISOString().split('T')[0],
    dailyRequestCount: data.daily_request_count || 0,
    monthlyInteractionCount,
    remainingBudget: data.remaining_budget || 0,
    planStartDate: data.plan_start_date || new Date().toISOString(),
    plan: {
      name: data.plans[0]?.name || 'Free',
      dailyAllowance: data.plans[0]?.daily_allowance || 0,
      monthlyInteractionCap: data.plans[0]?.monthly_interaction_cap || 0,
      monthlyTokenCap: data.plans[0]?.monthly_token_cap || 0,
    },
  };
}

/**
 * Verifica se o usuário pode fazer uma nova interação
 */
export async function canUserInteract(userId: string): Promise<{ canInteract: boolean; reason?: string; usage?: UserUsage }> {
  const usage = await getUserUsage(userId);
  
  if (!usage) {
    return { canInteract: false, reason: 'User not found' };
  }

  const today = new Date().toISOString().split('T')[0];
  const isNewDay = usage.dailyUsageDate !== today;

  // Verificar limite diário de interações
  const currentDailyCount = isNewDay ? 0 : usage.dailyRequestCount;
  if (currentDailyCount >= usage.plan.dailyAllowance) {
    return { 
      canInteract: false, 
      reason: `Daily interaction limit reached (${usage.plan.dailyAllowance})`,
      usage 
    };
  }

  // Verificar limite mensal de interações (baseado na data de início do plano)
  const planStartDate = new Date(usage.planStartDate);
  const now = new Date();
  const monthsSinceStart = (now.getFullYear() - planStartDate.getFullYear()) * 12 + 
                          (now.getMonth() - planStartDate.getMonth());
  
  const currentMonthStart = new Date(planStartDate);
  currentMonthStart.setMonth(planStartDate.getMonth() + monthsSinceStart);
  
  const { data: monthlyUsage } = await supabase
    .from('credit_ledger')
    .select('amount')
    .eq('user_id', userId)
    .gte('created_at', currentMonthStart.toISOString())
    .eq('source', 'interaction');

  const monthlyInteractionCount = monthlyUsage?.length || 0;
  if (monthlyInteractionCount >= usage.plan.monthlyInteractionCap) {
    return { 
      canInteract: false, 
      reason: `Monthly interaction limit reached (${usage.plan.monthlyInteractionCap})`,
      usage 
    };
  }

  return { canInteract: true, usage };
}

/**
 * Registra o uso de tokens na tabela usage_log
 */
export async function logTokenUsage(
  userId: string,
  requestId: string,
  modelUsed: string,
  tokensUsed: number,
  costInUsd: number,
  requestType: string = 'chat'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Converter USD para BRL (taxa aproximada de 5.5)
    const costInReais = costInUsd * 5.5;

    const { error } = await supabase
      .from('usage_log')
      .insert({
        user_id: userId,
        request_id: requestId,
        model_used: modelUsed,
        tokens_used: tokensUsed,
        cost_in_usd: costInUsd,
        cost_in_reais: costInReais,
        request_type: requestType
      });

    if (error) {
      console.error('Error logging token usage:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error logging token usage:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Debita uma interação do usuário usando a função SQL segura
 */
export async function debitUserInteraction(
  userId: string, 
  requestId: string, 
  tokenCount: number = 1
): Promise<DebitResult> {
  try {
    const { data, error } = await supabase.rpc('debit_credit_safely', {
      p_user_id: userId,
      p_request_id: requestId,
      p_amount: tokenCount,
      p_timestamp: new Date().toISOString()
    });

    if (error) {
      console.error('Error debiting user interaction:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // A função retorna um objeto com informações atualizadas
    return {
      success: true,
      remainingBudget: data?.remaining_budget,
      dailyUsage: data?.daily_usage,
      dailyRequestCount: data?.daily_request_count
    };
  } catch (error) {
    console.error('Unexpected error debiting user interaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Estima o número de tokens em uma mensagem (aproximação simples)
 */
export function estimateTokenCount(text: string): number {
  // Estimativa simples: ~4 caracteres por token
  // Para uma estimativa mais precisa, seria necessário usar uma biblioteca como tiktoken
  return Math.ceil(text.length / 4);
}

/**
 * Calcula o total de tokens estimados para todas as mensagens
 */
export function calculateTotalTokens(messages: Array<{ content: string }>): number {
  return messages.reduce((total, message) => {
    return total + estimateTokenCount(message.content);
  }, 0);
}