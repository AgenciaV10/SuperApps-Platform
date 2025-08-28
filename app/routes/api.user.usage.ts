import { type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { optionalAuth } from '~/lib/auth/middleware';
import { getUserUsage } from '~/server/billing/credits.server';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.user.usage');

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Use optional auth for testing - change back to requireAuth in production
    const authResult = await optionalAuth(request);
    
    if (!authResult.isAuthenticated || !authResult.user) {
      logger.debug('No authenticated user, returning mock data for testing');
      
      // Return mock data for testing
      return new Response(
        JSON.stringify({
          dailyInteractions: 0,
          monthlyInteractions: 0,
          monthlyTokens: 0,
          plan: {
            name: 'Free',
            daily_allowance: 5,
            monthly_interaction_cap: 30,
            monthly_token_cap: 0,
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }
    
    const user = authResult.user;

    logger.debug('Fetching usage for user', { userId: user.id });

    // Get user usage data
    const usage = await getUserUsage(user.id);

    if (!usage) {
      logger.error('Failed to fetch user usage', {
        userId: user.id,
        error: 'User usage data not found',
      });
      
      return new Response(
        JSON.stringify({
          error: true,
          message: 'Failed to fetch usage data',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Transform the data to match the expected format
    const responseData = {
      dailyInteractions: usage.dailyRequestCount,
      monthlyInteractions: usage.monthlyInteractionCount,
      monthlyTokens: usage.dailyUsage,
      plan: {
        name: usage.plan.name,
        daily_allowance: usage.plan.dailyAllowance,
        monthly_interaction_cap: usage.plan.monthlyInteractionCap,
        monthly_token_cap: usage.plan.monthlyTokenCap,
      },
    };

    logger.debug('Successfully fetched user usage', {
      userId: user.id,
      dailyInteractions: responseData.dailyInteractions,
      monthlyInteractions: responseData.monthlyInteractions,
    });

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    logger.error('Unexpected error in usage endpoint', error);
    
    return new Response(
      JSON.stringify({
        error: true,
        message: 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle unsupported methods
export async function action() {
  return new Response(
    JSON.stringify({
      error: true,
      message: 'Method not allowed',
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}