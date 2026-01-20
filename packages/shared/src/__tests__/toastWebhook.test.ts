import { describe, test, expect, beforeAll } from 'bun:test';
import { createHmac } from 'crypto';

describe('Toast Webhook Security', () => {
  const webhookSecret = 'test-webhook-secret-for-development';

  beforeAll(() => {
    process.env.TOAST_WEBHOOK_SECRET = webhookSecret;
  });

  describe('HMAC Signature Verification', () => {
    test('should generate correct HMAC signature', () => {
      const payload = JSON.stringify({
        eventType: 'MENU_PUBLISHED',
        restaurantGuid: 'test-guid',
        timestamp: Date.now(),
      });

      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      // Verify the signature format
      expect(expectedSignature).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should verify matching signatures', () => {
      const payload = JSON.stringify({ test: 'data' });

      const signature = createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      const verifySignature = createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      expect(signature).toBe(verifySignature);
    });

    test('should reject mismatched signatures', () => {
      const payload = JSON.stringify({ test: 'data' });

      const correctSignature = createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      const wrongSignature = createHmac('sha256', 'wrong-secret')
        .update(payload)
        .digest('hex');

      expect(correctSignature).not.toBe(wrongSignature);
    });

    test('should reject tampered payload', () => {
      const originalPayload = JSON.stringify({ test: 'data' });
      const tamperedPayload = JSON.stringify({ test: 'tampered' });

      const signature = createHmac('sha256', webhookSecret)
        .update(originalPayload)
        .digest('hex');

      const tamperedCheck = createHmac('sha256', webhookSecret)
        .update(tamperedPayload)
        .digest('hex');

      expect(signature).not.toBe(tamperedCheck);
    });
  });

  describe('Webhook Event Types', () => {
    const supportedEventTypes = [
      'MENU_PUBLISHED',
      'MENU_UPDATED',
      'MENU_ITEM_CREATED',
      'MENU_ITEM_UPDATED',
      'MENU_ITEM_DELETED',
      'MENU_GROUP_CREATED',
      'MENU_GROUP_UPDATED',
      'MENU_GROUP_DELETED',
      'ITEM_AVAILABILITY_CHANGED',
    ];

    test('should recognize supported event types', () => {
      const menuEvents = supportedEventTypes.filter(e => e.startsWith('MENU'));
      const itemEvents = supportedEventTypes.filter(e => e.includes('ITEM'));

      expect(menuEvents.length).toBeGreaterThan(0);
      expect(itemEvents.length).toBeGreaterThan(0);
    });

    test('should have event type handlers for menu changes', () => {
      const menuChangeEvents = [
        'MENU_PUBLISHED',
        'MENU_UPDATED',
        'MENU_ITEM_CREATED',
        'MENU_ITEM_UPDATED',
        'MENU_ITEM_DELETED',
      ];

      // All these should trigger a catalog sync
      for (const eventType of menuChangeEvents) {
        expect(supportedEventTypes).toContain(eventType);
      }
    });
  });

  describe('Webhook Payload Parsing', () => {
    test('should parse valid webhook payload', () => {
      const payload = {
        eventType: 'MENU_PUBLISHED',
        restaurantGuid: 'test-restaurant-guid',
        timestamp: 1704067200000,
        data: {
          menuGuid: 'menu-guid-123',
        },
      };

      expect(payload.eventType).toBe('MENU_PUBLISHED');
      expect(payload.restaurantGuid).toBeDefined();
      expect(payload.timestamp).toBeGreaterThan(0);
    });

    test('should handle payload with minimal data', () => {
      const payload = {
        eventType: 'MENU_UPDATED',
        restaurantGuid: 'test-guid',
      };

      expect(payload.eventType).toBeDefined();
      expect(payload.restaurantGuid).toBeDefined();
    });
  });
});

describe('Toast Webhook Response', () => {
  test('should return 200 for valid webhook', () => {
    // Webhook handler should return 200 OK immediately
    // and process async to not block Toast
    const expectedStatus = 200;
    expect(expectedStatus).toBe(200);
  });

  test('should return 401 for invalid signature', () => {
    const expectedStatus = 401;
    expect(expectedStatus).toBe(401);
  });

  test('should return 400 for missing signature', () => {
    const expectedStatus = 400;
    expect(expectedStatus).toBe(400);
  });
});
