import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createCheckoutSession } from '~/server/billing/stripe.server';
import { requireAuth } from '~/lib/auth/middleware';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const user = await requireAuth(request);
    const { priceId } = await request.json() as { priceId: string };

    if (!priceId || typeof priceId !== 'string') {
      return json({ error: 'Price ID is required' }, { status: 400 });
    }

    const { url } = await createCheckoutSession({
      userId: user.id,
      priceId,
    });

    return json({ url });
  } catch (error) {
    console.error('Checkout error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}