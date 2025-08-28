import { useState } from 'react';
import { useSupabaseAuth } from '~/lib/hooks/useSupabaseAuth';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('UpgradeModal');

interface Plan {
  id: string;
  name: string;
  daily_allowance: number;
  monthly_interaction_cap: number;
  monthly_token_cap: number;
  price_brl_cents: number;
  stripe_price_id?: string;
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    daily_allowance: 10,
    monthly_interaction_cap: 100,
    monthly_token_cap: 50000,
    price_brl_cents: 0,
  },
  {
    id: 'personal',
    name: 'Personal',
    daily_allowance: 50,
    monthly_interaction_cap: 1000,
    monthly_token_cap: 500000,
    price_brl_cents: 2900, // R$ 29,00
    stripe_price_id: 'price_personal_monthly',
  },
  {
    id: 'pro',
    name: 'Pro',
    daily_allowance: 200,
    monthly_interaction_cap: 5000,
    monthly_token_cap: 2000000,
    price_brl_cents: 9900, // R$ 99,00
    stripe_price_id: 'price_pro_monthly',
  },
  {
    id: 'business',
    name: 'Business',
    daily_allowance: 1000,
    monthly_interaction_cap: 25000,
    monthly_token_cap: 10000000,
    price_brl_cents: 29900, // R$ 299,00
    stripe_price_id: 'price_business_monthly',
  },
];

export function UpgradeModal({ isOpen, onClose, currentPlan = 'free' }: UpgradeModalProps) {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpgrade = async (plan: Plan) => {
    if (!user || !plan.stripe_price_id) return;

    try {
      setLoading(plan.id);
      setError(null);

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripe_price_id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create checkout session: ${response.statusText}`);
      }

      const { url } = await response.json() as { url: string };
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      logger.error('Failed to initiate upgrade', err);
      setError(err instanceof Error ? err.message : 'Failed to start upgrade process');
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!user) return;

    try {
      setLoading('portal');
      setError(null);

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
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    } finally {
      setLoading(null);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const getPlanFeatures = (plan: Plan) => {
    return [
      `${plan.daily_allowance} interações por dia`,
      `${formatNumber(plan.monthly_interaction_cap)} interações por mês`,
      `${formatNumber(plan.monthly_token_cap)} tokens por mês`,
    ];
  };

  const isCurrentPlan = (planId: string) => planId === currentPlan;
  const isPaidPlan = currentPlan !== 'free';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bolt-elements-background-depth-1 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-bolt-elements-textPrimary">Choose Your Plan</h2>
            <button
              onClick={onClose}
              className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => {
              const isCurrent = isCurrentPlan(plan.id);
              const isPopular = plan.id === 'pro';
              
              return (
                <div
                  key={plan.id}
                  className={`relative border rounded-lg p-6 transition-all duration-200 ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : isPopular
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 hover:border-bolt-elements-borderColorHover'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-bolt-elements-textPrimary capitalize">
                      {plan.name}
                    </h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-bolt-elements-textPrimary">
                        {plan.price_brl_cents === 0 ? 'Free' : formatPrice(plan.price_brl_cents)}
                      </span>
                      {plan.price_brl_cents > 0 && (
                        <span className="text-bolt-elements-textSecondary">/mês</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {getPlanFeatures(plan).map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-bolt-elements-textSecondary">
                        <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    {plan.id === 'free' ? (
                      <div className="text-center py-2 text-bolt-elements-textSecondary text-sm">
                        Always free
                      </div>
                    ) : isCurrent ? (
                      <button
                        onClick={handleManageBilling}
                        disabled={loading === 'portal'}
                        className="w-full bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary py-2 px-4 rounded-md hover:bg-bolt-elements-background-depth-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading === 'portal' ? 'Opening...' : 'Manage Billing'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(plan)}
                        disabled={loading === plan.id || !user}
                        className={`w-full py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          isPopular
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text'
                        }`}
                      >
                        {loading === plan.id ? 'Processing...' : `Upgrade to ${plan.name}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isPaidPlan && (
            <div className="mt-8 p-4 bg-bolt-elements-background-depth-2 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-bolt-elements-textPrimary">Need to manage your subscription?</h3>
                  <p className="text-sm text-bolt-elements-textSecondary mt-1">
                    Update payment methods, view invoices, or cancel your subscription.
                  </p>
                </div>
                <button
                  onClick={handleManageBilling}
                  disabled={loading === 'portal'}
                  className="bg-bolt-elements-button-secondary-background hover:bg-bolt-elements-button-secondary-backgroundHover text-bolt-elements-button-secondary-text px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === 'portal' ? 'Opening...' : 'Billing Portal'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-bolt-elements-textSecondary">
            <p>All plans include secure payment processing via Stripe.</p>
            <p className="mt-1">You can cancel or change your plan at any time.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;