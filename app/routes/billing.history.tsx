import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { optionalAuth } from '~/lib/auth/middleware';
import { getSupabaseClient } from '~/lib/supabase/client';
import { logger } from '~/utils/logger';
import { Header } from '~/components/header/Header';

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description: string;
}

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
        },
        payments: [],
      });
    }
    
    const user = authResult.user;
    
    // Get user stripe customer ID
    const supabase = getSupabaseClient();
    const { data: userData, error } = await supabase
      .from('users')
      .select('stripe_customer_id, plan_id')
      .eq('id', user.id)
      .single();

    if (error) {
      logger.error('Failed to fetch user data', { userId: user.id, error });
      throw new Error('Failed to load user data');
    }

    // For now, return mock data since we don't have Stripe integration for payment history
    // In a real implementation, you would fetch from Stripe API
    const mockPayments: PaymentHistory[] = userData?.stripe_customer_id ? [
      {
        id: 'pi_mock_1',
        amount: 5900,
        currency: 'brl',
        status: 'succeeded',
        created: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
        description: 'Assinatura Personal - Janeiro 2025'
      },
      {
        id: 'pi_mock_2',
        amount: 5900,
        currency: 'brl',
        status: 'succeeded',
        created: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
        description: 'Assinatura Personal - Dezembro 2024'
      }
    ] : [];

    return json({
      user: {
        id: user.id,
        email: user.email,
        plan_id: userData?.plan_id || 'free',
        stripe_customer_id: userData?.stripe_customer_id,
      },
      payments: mockPayments,
    });
  } catch (error) {
    logger.error('Billing history loader error', error);
    throw new Response('Internal Server Error', { status: 500 });
  }
}

export default function BillingHistory() {
  const { user, payments } = useLoaderData<typeof loader>();

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      succeeded: { label: 'Pago', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      failed: { label: 'Falhou', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-bolt-elements-background-depth-1">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-bolt-elements-textPrimary mb-2">
            Histórico de Pagamentos
          </h1>
          <p className="text-bolt-elements-textSecondary">
            Visualize todos os seus pagamentos e faturas
          </p>
        </div>

        <div className="bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor">
          {payments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="i-ph:receipt text-4xl text-bolt-elements-textTertiary mb-4 mx-auto" />
              <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">
                Nenhum pagamento encontrado
              </h3>
              <p className="text-bolt-elements-textSecondary mb-6">
                {user.stripe_customer_id 
                  ? 'Você ainda não possui histórico de pagamentos.'
                  : 'Você está no plano gratuito. Faça upgrade para ver o histórico de pagamentos.'
                }
              </p>
              {!user.stripe_customer_id && (
                <a
                  href="/"
                  className="inline-block bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text py-2 px-4 rounded-md transition-colors font-medium"
                >
                  Ver Planos Disponíveis
                </a>
              )}
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="px-6 py-4 border-b border-bolt-elements-borderColor">
                <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">
                  Pagamentos Recentes
                </h2>
              </div>
              <div className="divide-y divide-bolt-elements-borderColor">
                {payments.map((payment) => (
                  <div key={payment.id} className="px-6 py-4 hover:bg-bolt-elements-background-depth-3 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="i-ph:credit-card text-lg text-bolt-elements-textSecondary" />
                          <div>
                            <h3 className="font-medium text-bolt-elements-textPrimary">
                              {payment.description}
                            </h3>
                            <p className="text-sm text-bolt-elements-textSecondary">
                              {formatDate(payment.created)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-bolt-elements-textPrimary mb-1">
                          {formatCurrency(payment.amount, payment.currency)}
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {user.stripe_customer_id && (
          <div className="mt-6 text-center">
            <button
              onClick={async () => {
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
                  }
                } catch (err) {
                  logger.error('Failed to open billing portal', err);
                  alert('Erro ao abrir portal de cobrança. Tente novamente.');
                }
              }}
              className="bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text py-2 px-4 rounded-md transition-colors font-medium"
            >
              Gerenciar Cobrança no Stripe
            </button>
          </div>
        )}

        {/* Back to App */}
        <div className="text-center mt-8">
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
  );
}