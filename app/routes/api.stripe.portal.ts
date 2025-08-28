import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createPortalSession } from '~/server/billing/stripe.server';
import { requireAuth } from '~/lib/auth/middleware';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const user = await requireAuth(request);

    const { url } = await createPortalSession({
      userId: user.id,
    });

    return json({ url });
  } catch (error) {
    console.error('Portal error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}