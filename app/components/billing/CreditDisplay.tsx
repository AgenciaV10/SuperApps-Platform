import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '~/lib/hooks/useSupabaseAuth';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('CreditDisplay');

interface UserUsage {
  dailyInteractions: number;
  monthlyInteractions: number;
  monthlyTokens: number;
  plan: {
    name: string;
    daily_allowance: number;
    monthly_interaction_cap: number;
    monthly_token_cap: number;
  };
}

interface CreditDisplayProps {
  className?: string;
  showDetails?: boolean;
}

export function CreditDisplay({ className = '', showDetails = false }: CreditDisplayProps) {
  const { user } = useSupabaseAuth();
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchUsage();
  }, [user]);

  const fetchUsage = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/usage', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch usage: ${response.statusText}`);
      }

      const data = await response.json();
      setUsage(data);
    } catch (err) {
      logger.error('Failed to fetch user usage', err);
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-bolt-elements-textPrimary"></div>
        <span className="text-sm text-bolt-elements-textSecondary">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-sm text-red-500">Error loading credits</span>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const dailyRemaining = Math.max(0, usage.plan.daily_allowance - usage.dailyInteractions);
  const monthlyInteractionsRemaining = Math.max(0, usage.plan.monthly_interaction_cap - usage.monthlyInteractions);
  const monthlyTokensRemaining = Math.max(0, usage.plan.monthly_token_cap - usage.monthlyTokens);

  const dailyPercentage = (usage.dailyInteractions / usage.plan.daily_allowance) * 100;
  const monthlyInteractionPercentage = (usage.monthlyInteractions / usage.plan.monthly_interaction_cap) * 100;
  const monthlyTokenPercentage = (usage.monthlyTokens / usage.plan.monthly_token_cap) * 100;

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`w-2 h-2 rounded-full ${getProgressColor(Math.max(dailyPercentage, monthlyInteractionPercentage))}`}></div>
        <span className={`text-sm font-medium ${getStatusColor(dailyPercentage)}`}>
          {dailyRemaining} daily
        </span>
        <span className="text-xs text-bolt-elements-textSecondary">•</span>
        <span className="text-xs text-bolt-elements-textSecondary capitalize">
          {usage.plan.name}
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-bolt-elements-textPrimary">Usage Overview</h3>
        <span className="text-xs text-bolt-elements-textSecondary capitalize bg-bolt-elements-background-depth-2 px-2 py-1 rounded">
          {usage.plan.name} Plan
        </span>
      </div>

      {/* Daily Usage */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-bolt-elements-textSecondary">Daily Interactions</span>
          <span className={`font-medium ${getStatusColor(dailyPercentage)}`}>
            {usage.dailyInteractions} / {usage.plan.daily_allowance}
          </span>
        </div>
        <div className="w-full bg-bolt-elements-background-depth-2 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(dailyPercentage)}`}
            style={{ width: `${Math.min(100, dailyPercentage)}%` }}
          ></div>
        </div>
      </div>

      {/* Monthly Interactions */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-bolt-elements-textSecondary">Monthly Interactions</span>
          <span className={`font-medium ${getStatusColor(monthlyInteractionPercentage)}`}>
            {usage.monthlyInteractions.toLocaleString()} / {usage.plan.monthly_interaction_cap.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-bolt-elements-background-depth-2 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(monthlyInteractionPercentage)}`}
            style={{ width: `${Math.min(100, monthlyInteractionPercentage)}%` }}
          ></div>
        </div>
      </div>

      {/* Monthly Tokens */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-bolt-elements-textSecondary">Monthly Tokens</span>
          <span className={`font-medium ${getStatusColor(monthlyTokenPercentage)}`}>
            {usage.monthlyTokens.toLocaleString()} / {usage.plan.monthly_token_cap.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-bolt-elements-background-depth-2 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(monthlyTokenPercentage)}`}
            style={{ width: `${Math.min(100, monthlyTokenPercentage)}%` }}
          ></div>
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={fetchUsage}
        className="w-full text-xs text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors duration-200 py-1"
        disabled={loading}
      >
        {loading ? 'Refreshing...' : 'Refresh Usage'}
      </button>
    </div>
  );
}

export default CreditDisplay;