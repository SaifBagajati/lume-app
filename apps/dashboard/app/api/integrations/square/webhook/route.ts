import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { prisma } from '@lume-app/shared';
import { syncSquareCatalog } from '@lume-app/shared/services/squareSync';

// Force this route to use Node.js runtime (not Edge)
export const runtime = 'nodejs';

/**
 * Verify Square webhook signature
 * See: https://developer.squareup.com/docs/webhooks/step3validate
 */
function verifyWebhookSignature(
  body: string,
  signature: string,
  url: string
): boolean {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

  if (!signatureKey) {
    console.error('SQUARE_WEBHOOK_SIGNATURE_KEY not configured');
    return false;
  }

  // Square webhook signature: HMAC-SHA256 of (url + body) with signature key
  const hmac = createHmac('sha256', signatureKey);
  hmac.update(url + body);
  const hash = hmac.digest('base64');

  return hash === signature;
}

/**
 * POST /api/integrations/square/webhook
 * Handles Square webhook notifications for catalog updates
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-square-hmacsha256-signature');
    const url = request.url;

    // Verify signature
    if (!signature) {
      console.error('No webhook signature provided');
      return NextResponse.json({ error: 'No signature provided' }, { status: 401 });
    }

    if (!verifyWebhookSignature(body, signature, url)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse webhook payload
    const payload = JSON.parse(body);
    console.log('Received Square webhook:', payload.type, payload.event_id);

    // Handle catalog.version.updated event
    if (payload.type === 'catalog.version.updated') {
      const merchantId = payload.merchant_id;

      // Find tenant by Square merchant ID
      const tenant = await prisma.tenant.findFirst({
        where: {
          squareMerchantId: merchantId,
          squareIntegrationEnabled: true,
        },
        select: { id: true, name: true },
      });

      if (!tenant) {
        console.warn(`No tenant found for Square merchant ${merchantId}`);
        return NextResponse.json(
          { message: 'Tenant not found or integration not enabled' },
          { status: 200 }
        );
      }

      console.log(`Triggering background sync for tenant ${tenant.name} (${tenant.id})`);

      // Trigger background sync (async)
      // In production, this should use a job queue (BullMQ, Inngest, etc.)
      syncSquareCatalog(tenant.id)
        .then((result: unknown) => {
          console.log('Background sync completed:', result);
        })
        .catch((error: unknown) => {
          console.error('Background sync error:', error);
        });

      return NextResponse.json({
        message: 'Webhook received, sync triggered',
        event_id: payload.event_id,
      });
    }

    // Handle other event types (future expansion)
    console.log(`Unhandled webhook event type: ${payload.type}`);
    return NextResponse.json({
      message: 'Event type not handled',
      type: payload.type,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/square/webhook
 * Health check endpoint for webhook configuration
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Square webhook endpoint is active',
    configuration: {
      signatureKeyConfigured: !!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
    },
  });
}
