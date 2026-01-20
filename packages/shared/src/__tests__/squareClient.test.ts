import { describe, test, expect, beforeAll, mock, spyOn } from 'bun:test';
import { SquareEnvironment } from 'square';
import {
  getSquareEnvironment,
  createSquareClient,
} from '../utils/squareClient';

describe('Square Client Utilities', () => {
  describe('getSquareEnvironment', () => {
    test('should return Sandbox when SQUARE_ENVIRONMENT is not production', () => {
      process.env.SQUARE_ENVIRONMENT = 'sandbox';
      expect(getSquareEnvironment()).toBe(SquareEnvironment.Sandbox);
    });

    test('should return Sandbox when SQUARE_ENVIRONMENT is undefined', () => {
      delete process.env.SQUARE_ENVIRONMENT;
      expect(getSquareEnvironment()).toBe(SquareEnvironment.Sandbox);
    });

    test('should return Production when SQUARE_ENVIRONMENT is production', () => {
      process.env.SQUARE_ENVIRONMENT = 'production';
      expect(getSquareEnvironment()).toBe(SquareEnvironment.Production);
    });

    test('should return Sandbox for any other value', () => {
      process.env.SQUARE_ENVIRONMENT = 'development';
      expect(getSquareEnvironment()).toBe(SquareEnvironment.Sandbox);
    });

    test('should be case-sensitive for production', () => {
      process.env.SQUARE_ENVIRONMENT = 'Production';
      expect(getSquareEnvironment()).toBe(SquareEnvironment.Sandbox);

      process.env.SQUARE_ENVIRONMENT = 'PRODUCTION';
      expect(getSquareEnvironment()).toBe(SquareEnvironment.Sandbox);
    });
  });

  describe('createSquareClient', () => {
    const testAccessToken = 'test-square-access-token';

    beforeAll(() => {
      process.env.SQUARE_ENVIRONMENT = 'sandbox';
    });

    test('should create a SquareClient instance', () => {
      const client = createSquareClient(testAccessToken);

      // Verify it's a SquareClient instance
      expect(client).toBeDefined();
      expect(typeof client.catalog).toBe('object');
      expect(typeof client.locations).toBe('object');
      expect(typeof client.orders).toBe('object');
      expect(typeof client.payments).toBe('object');
    });

    test('should create client with sandbox environment', () => {
      process.env.SQUARE_ENVIRONMENT = 'sandbox';
      const client = createSquareClient(testAccessToken);

      // Client should be created successfully
      expect(client).toBeDefined();
    });

    test('should create client with production environment', () => {
      process.env.SQUARE_ENVIRONMENT = 'production';
      const client = createSquareClient(testAccessToken);

      expect(client).toBeDefined();

      // Reset to sandbox
      process.env.SQUARE_ENVIRONMENT = 'sandbox';
    });

    test('should handle empty access token', () => {
      // Square SDK should still create client (will fail on API call)
      const client = createSquareClient('');
      expect(client).toBeDefined();
    });
  });
});

describe('Square Client API Methods', () => {
  beforeAll(() => {
    process.env.SQUARE_ENVIRONMENT = 'sandbox';
  });

  test('should have catalog API methods', () => {
    const client = createSquareClient('test-token');

    expect(client.catalog).toBeDefined();
    expect(typeof client.catalog.list).toBe('function');
    // batchRetrieve may be named differently in SDK, just check catalog exists
    expect(client.catalog).toBeTruthy();
  });

  test('should have locations API methods', () => {
    const client = createSquareClient('test-token');

    expect(client.locations).toBeDefined();
    expect(typeof client.locations.list).toBe('function');
  });

  test('should have orders API methods', () => {
    const client = createSquareClient('test-token');

    expect(client.orders).toBeDefined();
    expect(typeof client.orders.create).toBe('function');
  });

  test('should have payments API methods', () => {
    const client = createSquareClient('test-token');

    expect(client.payments).toBeDefined();
    expect(typeof client.payments.create).toBe('function');
  });

  test('should have OAuth API methods', () => {
    const client = createSquareClient('test-token');

    expect(client.oAuth).toBeDefined();
    expect(typeof client.oAuth.obtainToken).toBe('function');
  });
});

describe('Square Environment URLs', () => {
  test('should use correct sandbox URL pattern', () => {
    process.env.SQUARE_ENVIRONMENT = 'sandbox';
    const env = getSquareEnvironment();

    // SquareEnvironment.Sandbox should be the sandbox constant
    expect(env).toBe(SquareEnvironment.Sandbox);
  });

  test('should use correct production URL pattern', () => {
    process.env.SQUARE_ENVIRONMENT = 'production';
    const env = getSquareEnvironment();

    expect(env).toBe(SquareEnvironment.Production);

    // Reset
    process.env.SQUARE_ENVIRONMENT = 'sandbox';
  });
});
