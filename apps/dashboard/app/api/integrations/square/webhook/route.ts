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
 * Map Square order state to Lume order status
 */
function mapSquareOrderState(squareState: string): string {
  const stateMap: Record<string, string> = {
    'OPEN': 'OPEN',
    'COMPLETED': 'COMPLETED',
    'CANCELED': 'CANCELLED',
    'DRAFT': 'OPEN',
  };
  return stateMap[squareState] || 'OPEN';
}

/**
 * Map Square payment status to Lume payment status
 */
function mapSquarePaymentStatus(squareStatus: string): string {
  const statusMap: Record<string, string> = {
    'APPROVED': 'PROCESSING',
    'COMPLETED': 'COMPLETED',
    'CANCELED': 'FAILED',
    'FAILED': 'FAILED',
    'PENDING': 'PENDING',
  };
  return statusMap[squareStatus] || 'PENDING';
}

/**
 * Handle order events from Square
 */
async function handleOrderEvent(payload: any, tenantId: string): Promise<{ handled: boolean; message: string }> {
  const eventType = payload.type;
  const orderData = payload.data?.object?.order_created ||
                    payload.data?.object?.order_updated ||
                    payload.data?.object;

  if (!orderData) {
    return { handled: false, message: 'No order data in payload' };
  }

  const squareOrderId = orderData.order_id || orderData.id;

  if (!squareOrderId) {
    return { handled: false, message: 'No order ID in payload' };
  }

  // Find existing order by Square order ID
  const existingOrder = await prisma.order.findFirst({
    where: {
      tenantId,
      posOrderId: squareOrderId,
    },
  });

  if (eventType === 'order.created') {
    if (existingOrder) {
      return { handled: true, message: `Order ${squareOrderId} already exists in Lume` };
    }

    // For orders created in Square POS (not Lume), we log but don't create
    // since we don't have table mapping. In production, you might want to
    // create these orders or handle them differently.
    console.log(`New order created in Square: ${squareOrderId}`);
    return { handled: true, message: `Order ${squareOrderId} created in Square (not synced - no table mapping)` };
  }

  if (eventType === 'order.updated' || eventType === 'order.fulfillment.updated') {
    if (!existingOrder) {
      console.log(`Order ${squareOrderId} not found in Lume - may have been created in Square POS`);
      return { handled: true, message: `Order ${squareOrderId} not found in Lume` };
    }

    // Update order status
    const newStatus = orderData.state ? mapSquareOrderState(orderData.state) : existingOrder.status;

    await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        status: newStatus,
        updatedAt: new Date(),
        ...(newStatus === 'COMPLETED' && !existingOrder.sessionEndedAt ? { sessionEndedAt: new Date() } : {}),
      },
    });

    console.log(`Updated order ${existingOrder.id} status to ${newStatus}`);
    return { handled: true, message: `Order ${existingOrder.id} updated to ${newStatus}` };
  }

  return { handled: false, message: `Unhandled order event type: ${eventType}` };
}

/**
 * Handle payment events from Square
 */
async function handlePaymentEvent(payload: any, tenantId: string): Promise<{ handled: boolean; message: string }> {
  const eventType = payload.type;
  const paymentData = payload.data?.object?.payment;

  if (!paymentData) {
    return { handled: false, message: 'No payment data in payload' };
  }

  const squarePaymentId = paymentData.id;
  const squareOrderId = paymentData.order_id;
  const amountMoney = paymentData.amount_money;
  const amount = amountMoney ? Number(amountMoney.amount) / 100 : 0;
  const status = mapSquarePaymentStatus(paymentData.status);

  // Find existing payment by transaction ID
  const existingPayment = await prisma.payment.findFirst({
    where: {
      tenantId,
      transactionId: squarePaymentId,
    },
  });

  if (eventType === 'payment.created') {
    if (existingPayment) {
      return { handled: true, message: `Payment ${squarePaymentId} already exists` };
    }

    // Find the order this payment belongs to
    if (!squareOrderId) {
      return { handled: false, message: 'Payment has no associated order ID' };
    }

    const order = await prisma.order.findFirst({
      where: {
        tenantId,
        posOrderId: squareOrderId,
      },
    });

    if (!order) {
      console.log(`Order ${squareOrderId} not found for payment ${squarePaymentId}`);
      return { handled: true, message: `Order not found for payment - may be Square POS order` };
    }

    // Create payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        tenantId,
        amount,
        method: paymentData.source_type || 'CARD',
        status,
        transactionId: squarePaymentId,
      },
    });

    console.log(`Created payment ${squarePaymentId} for order ${order.id}`);

    // If payment is completed, update order status
    if (status === 'COMPLETED') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'COMPLETED',
          sessionEndedAt: new Date(),
        },
      });
    }

    return { handled: true, message: `Payment ${squarePaymentId} created` };
  }

  if (eventType === 'payment.updated') {
    if (!existingPayment) {
      return { handled: true, message: `Payment ${squarePaymentId} not found in Lume` };
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    console.log(`Updated payment ${existingPayment.id} status to ${status}`);

    // If payment completed, update associated order
    if (status === 'COMPLETED') {
      await prisma.order.update({
        where: { id: existingPayment.orderId },
        data: {
          status: 'COMPLETED',
          sessionEndedAt: new Date(),
        },
      });
    }

    return { handled: true, message: `Payment ${existingPayment.id} updated to ${status}` };
  }

  return { handled: false, message: `Unhandled payment event type: ${eventType}` };
}

/**
 * POST /api/integrations/square/webhook
 * Handles Square webhook notifications for catalog, orders, and payments
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

    // Handle catalog.version.updated event
    if (payload.type === 'catalog.version.updated') {
      console.log(`Triggering background sync for tenant ${tenant.name} (${tenant.id})`);

      // Trigger background sync (async)
      syncSquareCatalog(tenant.id)
        .then((result: unknown) => {
          console.log('Background sync completed:', result);
        })
        .catch((error: unknown) => {
          console.error('Background sync error:', error);
        });

      return NextResponse.json({
        message: 'Webhook received, catalog sync triggered',
        event_id: payload.event_id,
      });
    }

    // Handle order events
    if (payload.type.startsWith('order.')) {
      const result = await handleOrderEvent(payload, tenant.id);
      console.log(`Order event handled: ${result.message}`);

      return NextResponse.json({
        message: result.message,
        event_id: payload.event_id,
        handled: result.handled,
      });
    }

    // Handle payment events
    if (payload.type.startsWith('payment.')) {
      const result = await handlePaymentEvent(payload, tenant.id);
      console.log(`Payment event handled: ${result.message}`);

      return NextResponse.json({
        message: result.message,
        event_id: payload.event_id,
        handled: result.handled,
      });
    }

    // Handle other event types
    console.log(`Unhandled webhook event type: ${payload.type}`);
    return NextResponse.json({
      message: 'Event type not handled',
      type: payload.type,
      event_id: payload.event_id,
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
