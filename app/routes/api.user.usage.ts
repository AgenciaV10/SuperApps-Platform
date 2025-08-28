import { type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { requireAuth } from '~/lib/auth/middleware';
import { getUserUsage } from '~/server/billing/credits.server';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.user.usage');

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Require authentication for this endpoint
    const { user } = await requireAuth(request);

    logger.debug('Fetching usage for user', { userId: user.id });

    // Get user usage data
    const usage = await getUserUsage(user.id);

    if (!usage.success) {
      logger.error('Failed to fetch user usage', {
        userId: user.id,
        error: usage.error,
      });
      
      return new Response(
        JSON.stringify({
          error: true,
          message: usage.error || 'Failed to fetch usage data',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    logger.debug('Successfully fetched user usage', {
      userId: user.id,
      planName: usage.data?.plan.name,
      dailyInteractions: usage.data?.dailyInteractions,
      monthlyInteractions: usage.data?.monthlyInteractions,
    });

    return new Response(
      JSON.stringify(usage.data),
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