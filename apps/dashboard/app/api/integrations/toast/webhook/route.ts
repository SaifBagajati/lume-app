import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@lume-app/shared';
import { syncToastCatalog } from '@lume-app/shared/services/toastSync';
import { createHmac } from 'crypto';

/**
 * Verify Toast webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-toast-signature');
    const webhookSecret = process.env.TOAST_WEBHOOK_SECRET;

    // Verify signature if webhook secret is configured
    if (webhookSecret && !verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error('Invalid Toast webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);

    // Extract restaurant GUID from the webhook payload
    const restaurantGuid = event.restaurantGuid || event.restaurant?.guid;

    if (!restaurantGuid) {
      console.error('No restaurant GUID in Toast webhook');
      return NextResponse.json({ error: 'Missing restaurant GUID' }, { status: 400 });
    }

    // Find the tenant associated with this restaurant
    const tenant = await prisma.tenant.findFirst({
      where: {
        toastRestaurantGuid: restaurantGuid,
        toastIntegrationEnabled: true,
      },
      select: { id: true },
    });

    if (!tenant) {
      console.log(`No tenant found for Toast restaurant: ${restaurantGuid}`);
      // Return 200 to acknowledge receipt (Toast may send webhooks for unconnected restaurants)
      return NextResponse.json({ received: true });
    }

    // Handle different event types
    const eventType = event.eventType || event.type;

    console.log(`Received Toast webhook: ${eventType} for restaurant ${restaurantGuid}`);

    switch (eventType) {
      case 'MENU_PUBLISHED':
      case 'MENU_UPDATED':
      case 'MENU_ITEM_CREATED':
      case 'MENU_ITEM_UPDATED':
      case 'MENU_ITEM_DELETED':
      case 'MENU_GROUP_CREATED':
      case 'MENU_GROUP_UPDATED':
      case 'MENU_GROUP_DELETED':
        // Trigger async catalog sync
        console.log(`Triggering Toast catalog sync for tenant ${tenant.id}`);
        // Don't await - respond quickly to webhook
        syncToastCatalog(tenant.id).catch((err) =>
          console.error('Toast sync error from webhook:', err)
        );
        break;

      case 'ITEM_AVAILABILITY_CHANGED':
        // Handle inventory/availability changes
        // TODO: Implement targeted availability update
        console.log('Item availability changed, triggering full sync');
        syncToastCatalog(tenant.id).catch((err) =>
          console.error('Toast sync error from webhook:', err)
        );
        break;

      default:
        console.log(`Unhandled Toast webhook event type: ${eventType}`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Toast webhook:', error);
    // Return 200 to prevent webhook retries for parsing errors
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}
