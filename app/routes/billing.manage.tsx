import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { optionalAuth } from '~/lib/auth/middleware';
import { getSupabaseClient } from '~/lib/supabase/client';
import { logger } from '~/utils/logger';
import { Header } from '~/components/header/Header';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Use optional auth for testing - change back to requireAuth in production
    const authResult = await optionalAuth(request);
    
    if (!authResult.isAuthenticated || !authResult.user) {
      logger.debug('No authenticated user, returning mock data for testing');
      
      // Return mock data for testing
      return json({
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          plan_id: 'free',
          stripe_customer_id: null,
          stripe_subscription_id: null,
          billing_period_start: null,
          billing_period_end: null,
        },
      });
    }
    
    const user = authResult.user;
    
    // Get user plan information
    const supabase = getSupabaseClient();
    const { data: userData, error } = await supabase
      .from('users')
      .select('plan_id, stripe_customer_id, stripe_subscription_id, billing_period_start, billing_period_end')
      .eq('id', user.id)
      .single();

    if (error) {
      logger.error('Failed to fetch user data', { userId: user.id, error });
      throw new Error('Failed to load user data');
    }

    return json({
      user: {
        id: user.id,
        email: user.email,
        plan_id: userData?.plan_id || 'free',
        stripe_customer_id: userData?.stripe_customer_id,
        stripe_subscription_id: userData?.stripe_subscription_id,
        billing_period_start: userData?.billing_period_start,
        billing_period_end: userData?.billing_period_end,
      },
    });
  } catch (error) {
    logger.error('Billing manage loader error', error);
    throw new Response('Internal Server Error', { status: 500 });
  }
}

export default function BillingManage() {
  const { user } = useLoaderData<typeof loader>();

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to create portal session: ${response.statusText}`);
      }

      const { url } = await response.json() as { url: string };
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (err) {
      logger.error('Failed to open billing portal', err);
      alert('Erro ao abrir portal de cobrança. Tente novamente.');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPlanName = (planId: string) => {
    switch (planId) {
      case 'personal': return 'Personal';
      case 'pro': return 'Pro';
      case 'business': return 'Business';
      default: return 'Free';
    }
  };

  return (
    <div className="min-h-screen bg-bolt-elements-background-depth-1">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-bolt-elements-textPrimary mb-2">
            Gerenciar Plano
          </h1>
          <p className="text-bolt-elements-textSecondary">
            Gerencie sua assinatura e informações de cobrança
          </p>
        </div>

        <div className="grid gap-6">
          {/* Current Plan Card */}
          <div className="bg-bolt-elements-background-depth-2 rounded-lg p-6 border border-bolt-elements-borderColor">
            <h2 className="text-xl font-semibold text-bolt-elements-textPrimary mb-4">
              Plano Atual
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-bolt-elements-textSecondary">Plano:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary border border-bolt-elements-borderColor">
                  {getPlanName(user.plan_id)}
                </span>
              </div>
              {user.billing_period_start && (
                <div className="flex justify-between items-center">
                  <span className="text-bolt-elements-textSecondary">Período de cobrança:</span>
                  <span className="text-bolt-elements-textPrimary">
                    {formatDate(user.billing_period_start)} - {formatDate(user.billing_period_end)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-bolt-elements-textSecondary">Status:</span>
                <span className="text-green-500 font-medium">
                  {user.stripe_subscription_id ? 'Ativo' : 'Gratuito'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-bolt-elements-background-depth-2 rounded-lg p-6 border border-bolt-elements-borderColor">
            <h2 className="text-xl font-semibold text-bolt-elements-textPrimary mb-4">
              Ações
            </h2>
            <div className="space-y-4">
              {user.stripe_customer_id ? (
                <button
                  onClick={handleManageBilling}
                  className="w-full bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text py-3 px-4 rounded-md transition-colors font-medium"
                >
                  Abrir Portal de Cobrança do Stripe
                </button>
              ) : (
                <div className="text-center py-4">
                  <p className="text-bolt-elements-textSecondary mb-4">
                    Você está no plano gratuito. Faça upgrade para acessar recursos premium.
                  </p>
                  <a
                    href="/"
                    className="inline-block bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text py-2 px-4 rounded-md transition-colors font-medium"
                  >
                    Ver Planos Disponíveis
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Back to App */}
          <div className="text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
            >
              <span className="i-ph:arrow-left text-base" />
              Voltar ao App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}