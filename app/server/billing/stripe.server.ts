import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapeamento de preços Stripe para planos
export const priceToPlan: Record<string, string> = {
  [process.env.STRIPE_PRICE_PERSONAL_BRL!]: 'personal',
  [process.env.STRIPE_PRICE_PRO_BRL!]: 'pro',
  [process.env.STRIPE_PRICE_BUSINESS_BRL!]: 'business',
};

/**
 * Cria ou obtém um customer do Stripe para o usuário
 */
export async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  // Verificar se já existe customer_id no banco
  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (user?.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  // Criar novo customer no Stripe
  const customer = await stripe.customers.create({
    email,
    metadata: {
      user_id: userId,
    },
  });

  // Salvar customer_id no banco
  await supabase
    .from('users')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer.id;
}

/**
 * Cria uma sessão de checkout do Stripe
 */
export async function createCheckoutSession({
  userId,
  priceId,
}: {
  userId: string;
  priceId: string;
}): Promise<{ url: string }> {
  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();

  if (!user?.email) {
    throw new Error('User not found');
  }

  const customerId = await getOrCreateCustomer(userId, user.email);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.APP_BASE_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_BASE_URL}/billing/cancel`,
    currency: 'brl',
    metadata: {
      user_id: userId,
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return { url: session.url };
}

/**
 * Busca o histórico de pagamentos do Stripe para um usuário
 */
export async function getPaymentHistory(userId: string): Promise<{
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description: string;
}[]> {
  // Buscar customer_id do usuário
  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (!user?.stripe_customer_id) {
    return [];
  }

  try {
    // Buscar payment intents do customer
    const paymentIntents = await stripe.paymentIntents.list({
      customer: user.stripe_customer_id,
      limit: 50,
    });

    // Buscar invoices do customer para obter descrições mais detalhadas
    const invoices = await stripe.invoices.list({
      customer: user.stripe_customer_id,
      limit: 50,
    });

    // Mapear payment intents para o formato esperado
    const payments = paymentIntents.data.map((pi) => {
      // Tentar encontrar invoice relacionada
      const relatedInvoice = invoices.data.find(inv => 
        inv.payment_intent === pi.id
      );

      return {
        id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        created: pi.created * 1000, // Converter para milliseconds
        description: relatedInvoice?.description || 
                    relatedInvoice?.lines.data[0]?.description ||
                    `Pagamento ${pi.amount / 100} ${pi.currency.toUpperCase()}`,
      };
    });

    // Ordenar por data (mais recente primeiro)
    return payments.sort((a, b) => b.created - a.created);
  } catch (error) {
    console.error('Error fetching payment history from Stripe:', error);
    return [];
  }
}

/**
 * Cria uma sessão do portal de cobrança do Stripe
 */
export async function createPortalSession({
  userId,
}: {
  userId: string;
}): Promise<{ url: string }> {
  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (!user?.stripe_customer_id) {
    throw new Error('Customer not found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${process.env.APP_BASE_URL}/billing`,
  });

  return { url: session.url };
}

/**
 * Verifica a assinatura do webhook do Stripe
 */
export async function verifyWebhookSignature(body: string, signature: string): Promise<Stripe.Event> {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required');
  }

  try {
    return await stripe.webhooks.constructEventAsync(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error}`);
  }
}

/**
 * Processa eventos de webhook do Stripe
 */
export async function processWebhookEvent(event: Stripe.Event): Promise<void> {
  // Verificar idempotência
  const { data: existingEvent } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .single();

  if (existingEvent) {
    console.log(`Event ${event.id} already processed`);
    return;
  }

  // Salvar evento para idempotência
  await supabase
    .from('stripe_events')
    .insert({
      id: event.id,
      type: event.type,
      payload: event,
    });

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdate(subscription);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

/**
 * Atualiza a assinatura do usuário no banco
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    console.error('No price ID found in subscription');
    return;
  }

  const planId = priceToPlan[priceId];
  if (!planId) {
    console.error(`Unknown price ID: ${priceId}`);
    return;
  }

  const billingPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
  const billingPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

  await supabase
    .from('users')
    .update({
      plan_id: planId,
      stripe_subscription_id: subscription.id,
      billing_period_start: billingPeriodStart,
      billing_period_end: billingPeriodEnd,
    })
    .eq('stripe_customer_id', customerId);

  console.log(`Updated user subscription: plan=${planId}, customer=${customerId}`);
}

/**
 * Remove a assinatura do usuário no banco
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;

  await supabase
    .from('users')
    .update({
      plan_id: 'free',
      stripe_subscription_id: null,
      billing_period_start: null,
      billing_period_end: null,
    })
    .eq('stripe_customer_id', customerId);

  console.log(`Deleted user subscription: customer=${customerId}`);
}