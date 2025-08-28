import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { verifyWebhookSignature, processWebhookEvent } from '~/server/billing/stripe.server';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    // Verificar assinatura do webhook
    const event = verifyWebhookSignature(body, signature);

    // Processar evento
    await processWebhookEvent(event);

    return json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 400 }
    );
  }
}