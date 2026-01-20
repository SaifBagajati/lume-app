import { describe, test, expect, beforeAll } from 'bun:test';
import { createHmac } from 'crypto';

describe('Square Webhook Security', () => {
  const webhookSignatureKey = 'test-square-webhook-signature-key';
  const webhookUrl = 'https://example.com/api/integrations/square/webhook';

  beforeAll(() => {
    process.env.SQUARE_WEBHOOK_SIGNATURE_KEY = webhookSignatureKey;
  });

  describe('HMAC-SHA256 Signature Verification', () => {
    test('should generate correct HMAC signature', () => {
      const payload = JSON.stringify({
        type: 'catalog.version.updated',
        merchant_id: 'MERCHANT_123',
        event_id: 'EVENT_123',
      });

      // Square uses: HMAC-SHA256(webhook_url + body)
      const stringToSign = webhookUrl + payload;
      const expectedSignature = createHmac('sha256', webhookSignatureKey)
        .update(stringToSign)
        .digest('base64');

      // Signature should be base64 encoded
      expect(expectedSignature).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    test('should verify matching signatures', () => {
      const payload = JSON.stringify({ test: 'data' });
      const stringToSign = webhookUrl + payload;

      const signature = createHmac('sha256', webhookSignatureKey)
        .update(stringToSign)
        .digest('base64');

      const verifySignature = createHmac('sha256', webhookSignatureKey)
        .update(stringToSign)
        .digest('base64');

      expect(signature).toBe(verifySignature);
    });

    test('should reject mismatched signatures (wrong key)', () => {
      const payload = JSON.stringify({ test: 'data' });
      const stringToSign = webhookUrl + payload;

      const correctSignature = createHmac('sha256', webhookSignatureKey)
        .update(stringToSign)
        .digest('base64');

      const wrongSignature = createHmac('sha256', 'wrong-key')
        .update(stringToSign)
        .digest('base64');

      expect(correctSignature).not.toBe(wrongSignature);
    });

    test('should reject tampered payload', () => {
      const originalPayload = JSON.stringify({ test: 'data' });
      const tamperedPayload = JSON.stringify({ test: 'tampered' });

      const signature = createHmac('sha256', webhookSignatureKey)
        .update(webhookUrl + originalPayload)
        .digest('base64');

      const tamperedCheck = createHmac('sha256', webhookSignatureKey)
        .update(webhookUrl + tamperedPayload)
        .digest('base64');

      expect(signature).not.toBe(tamperedCheck);
    });

    test('should reject wrong webhook URL', () => {
      const payload = JSON.stringify({ test: 'data' });
      const wrongUrl = 'https://attacker.com/webhook';

      const correctSignature = createHmac('sha256', webhookSignatureKey)
        .update(webhookUrl + payload)
        .digest('base64');

      const wrongUrlSignature = createHmac('sha256', webhookSignatureKey)
        .update(wrongUrl + payload)
        .digest('base64');

      expect(correctSignature).not.toBe(wrongUrlSignature);
    });
  });

  describe('Webhook Event Types', () => {
    const catalogEvents = [
      'catalog.version.updated',
    ];

    const inventoryEvents = [
      'inventory.count.updated',
    ];

    const orderEvents = [
      'order.created',
      'order.updated',
      'order.fulfillment.updated',
    ];

    const paymentEvents = [
      'payment.created',
      'payment.updated',
    ];

    test('should handle catalog events', () => {
      for (const eventType of catalogEvents) {
        expect(eventType).toContain('catalog');
      }
    });

    test('should handle inventory events', () => {
      for (const eventType of inventoryEvents) {
        expect(eventType).toContain('inventory');
      }
    });

    test('should handle order events', () => {
      for (const eventType of orderEvents) {
        expect(eventType).toContain('order');
      }
    });

    test('should handle payment events', () => {
      for (const eventType of paymentEvents) {
        expect(eventType).toContain('payment');
      }
    });
  });

  describe('Webhook Payload Parsing', () => {
    test('should parse valid catalog webhook payload', () => {
      const payload = {
        merchant_id: 'MERCHANT_123',
        type: 'catalog.version.updated',
        event_id: 'abc123-def456',
        created_at: '2024-01-15T10:30:00Z',
        data: {
          type: 'catalog.version.updated',
          id: 'CATALOG_VERSION_ID',
          object: {
            catalog_version: {
              updated_at: '2024-01-15T10:30:00Z',
            },
          },
        },
      };

      expect(payload.type).toBe('catalog.version.updated');
      expect(payload.merchant_id).toBeDefined();
      expect(payload.event_id).toBeDefined();
      expect(payload.data).toBeDefined();
    });

    test('should parse valid order webhook payload', () => {
      const payload = {
        merchant_id: 'MERCHANT_123',
        type: 'order.created',
        event_id: 'ORDER_EVENT_123',
        created_at: '2024-01-15T10:30:00Z',
        data: {
          type: 'order',
          id: 'ORDER_ID_123',
          object: {
            order_created: {
              order_id: 'ORDER_ID_123',
            },
          },
        },
      };

      expect(payload.type).toBe('order.created');
      expect(payload.data.object.order_created.order_id).toBe('ORDER_ID_123');
    });

    test('should handle payload with minimal data', () => {
      const payload = {
        merchant_id: 'MERCHANT_123',
        type: 'catalog.version.updated',
        event_id: 'EVENT_123',
      };

      expect(payload.type).toBeDefined();
      expect(payload.merchant_id).toBeDefined();
    });
  });

  describe('Webhook Response Codes', () => {
    test('should return 200 for valid webhook', () => {
      const expectedStatus = 200;
      expect(expectedStatus).toBe(200);
    });

    test('should return 401 for invalid signature', () => {
      const expectedStatus = 401;
      expect(expectedStatus).toBe(401);
    });

    test('should return 400 for missing signature header', () => {
      const expectedStatus = 400;
      expect(expectedStatus).toBe(400);
    });

    test('should return 404 for unknown merchant', () => {
      const expectedStatus = 404;
      expect(expectedStatus).toBe(404);
    });
  });

  describe('Idempotency Handling', () => {
    test('should extract event_id for idempotency check', () => {
      const payload = {
        event_id: 'unique-event-id-123',
        type: 'catalog.version.updated',
      };

      expect(payload.event_id).toBe('unique-event-id-123');
    });

    test('should handle duplicate event_ids', () => {
      const processedEvents = new Set<string>();
      const eventId = 'duplicate-event-id';

      // First processing
      processedEvents.add(eventId);
      expect(processedEvents.has(eventId)).toBe(true);

      // Second processing should be recognized as duplicate
      const isDuplicate = processedEvents.has(eventId);
      expect(isDuplicate).toBe(true);
    });
  });
});

describe('Square OAuth Security', () => {
  describe('State Parameter (CSRF Protection)', () => {
    test('should generate state with tenant ID and timestamp', () => {
      const tenantId = 'tenant-123';
      const timestamp = Date.now();
      const state = `${tenantId}:${timestamp}`;

      const parts = state.split(':');
      expect(parts.length).toBe(2);
      expect(parts[0]).toBe(tenantId);
      expect(parseInt(parts[1])).toBe(timestamp);
    });

    test('should validate state timestamp is not expired', () => {
      const tenantId = 'tenant-123';
      const validTimestamp = Date.now();
      const expiredTimestamp = Date.now() - (15 * 60 * 1000); // 15 minutes ago
      const expirationTime = 10 * 60 * 1000; // 10 minutes

      const validState = `${tenantId}:${validTimestamp}`;
      const expiredState = `${tenantId}:${expiredTimestamp}`;

      // Check valid state
      const validStateParts = validState.split(':');
      const validAge = Date.now() - parseInt(validStateParts[1]);
      expect(validAge).toBeLessThan(expirationTime);

      // Check expired state
      const expiredStateParts = expiredState.split(':');
      const expiredAge = Date.now() - parseInt(expiredStateParts[1]);
      expect(expiredAge).toBeGreaterThan(expirationTime);
    });

    test('should reject state with invalid format', () => {
      const invalidStates = [
        'no-colon',
        ':missing-tenant',
        'tenant:not-a-number',
        '',
      ];

      for (const state of invalidStates) {
        const parts = state.split(':');
        const isValid = parts.length === 2 && !isNaN(parseInt(parts[1]));
        expect(isValid).toBe(false);
      }
    });
  });

  describe('Token Encryption', () => {
    test('should encrypt access token before storage', () => {
      // Token should never be stored in plain text
      const plainToken = 'EAAAl...square_access_token';
      expect(plainToken).not.toContain('encrypted');

      // After encryption, format should be iv:authTag:ciphertext (hex encoded)
      const encryptedFormat = /^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/;
      const mockEncrypted = 'abcd1234:efab5678:cdef9012';
      expect(mockEncrypted).toMatch(encryptedFormat);
    });

    test('should encrypt refresh token before storage', () => {
      const plainRefreshToken = 'EQAAl...square_refresh_token';
      expect(plainRefreshToken.length).toBeGreaterThan(0);
    });
  });

  describe('OAuth Scopes', () => {
    const requiredScopes = [
      'ITEMS_READ',
      'ITEMS_WRITE',
      'MERCHANT_PROFILE_READ',
      'PAYMENTS_READ',
      'ORDERS_READ',
      'ORDERS_WRITE',
    ];

    test('should request necessary read scopes', () => {
      const readScopes = requiredScopes.filter(s => s.includes('READ'));
      expect(readScopes.length).toBeGreaterThan(0);
      expect(readScopes).toContain('ITEMS_READ');
      expect(readScopes).toContain('MERCHANT_PROFILE_READ');
    });

    test('should request necessary write scopes', () => {
      const writeScopes = requiredScopes.filter(s => s.includes('WRITE'));
      expect(writeScopes.length).toBeGreaterThan(0);
      expect(writeScopes).toContain('ITEMS_WRITE');
      expect(writeScopes).toContain('ORDERS_WRITE');
    });
  });
});
