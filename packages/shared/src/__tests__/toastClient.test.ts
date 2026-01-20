import { describe, test, expect, beforeAll, mock, spyOn } from 'bun:test';
import {
  getToastEnvironment,
  getToastApiBaseUrl,
  createToastClient,
} from '../utils/toastClient';

describe('Toast Client Utilities', () => {
  describe('getToastEnvironment', () => {
    test('should return sandbox when TOAST_ENVIRONMENT is not production', () => {
      process.env.TOAST_ENVIRONMENT = 'sandbox';
      expect(getToastEnvironment()).toBe('sandbox');
    });

    test('should return sandbox when TOAST_ENVIRONMENT is undefined', () => {
      delete process.env.TOAST_ENVIRONMENT;
      expect(getToastEnvironment()).toBe('sandbox');
    });

    test('should return production when TOAST_ENVIRONMENT is production', () => {
      process.env.TOAST_ENVIRONMENT = 'production';
      expect(getToastEnvironment()).toBe('production');
    });

    test('should return sandbox for any other value', () => {
      process.env.TOAST_ENVIRONMENT = 'development';
      expect(getToastEnvironment()).toBe('sandbox');
    });
  });

  describe('getToastApiBaseUrl', () => {
    test('should return sandbox URL for sandbox environment', () => {
      process.env.TOAST_ENVIRONMENT = 'sandbox';
      expect(getToastApiBaseUrl()).toBe('https://ws-sandbox-api.toasttab.com');
    });

    test('should return production URL for production environment', () => {
      process.env.TOAST_ENVIRONMENT = 'production';
      expect(getToastApiBaseUrl()).toBe('https://ws-api.toasttab.com');
    });
  });

  describe('createToastClient', () => {
    const testAccessToken = 'test-access-token';
    const testRestaurantGuid = 'test-restaurant-guid-12345';

    beforeAll(() => {
      process.env.TOAST_ENVIRONMENT = 'sandbox';
    });

    test('should create a client with correct properties', () => {
      const client = createToastClient(testAccessToken, testRestaurantGuid);

      expect(client.accessToken).toBe(testAccessToken);
      expect(client.restaurantGuid).toBe(testRestaurantGuid);
      expect(client.baseUrl).toBe('https://ws-sandbox-api.toasttab.com');
      expect(typeof client.request).toBe('function');
    });

    test('should make request with correct headers', async () => {
      const client = createToastClient(testAccessToken, testRestaurantGuid);

      const mockResponse = { data: 'test' };
      const mockFetch = spyOn(global, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await client.request('/test-endpoint');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://ws-sandbox-api.toasttab.com/test-endpoint',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${testAccessToken}`,
            'Toast-Restaurant-External-ID': testRestaurantGuid,
            'Content-Type': 'application/json',
          }),
        })
      );

      mockFetch.mockRestore();
    });

    test('should return parsed JSON response', async () => {
      const client = createToastClient(testAccessToken, testRestaurantGuid);

      const mockResponse = { menus: [{ name: 'Main Menu' }] };
      const mockFetch = spyOn(global, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.request<typeof mockResponse>('/menus/v2/menus');

      expect(result).toEqual(mockResponse);

      mockFetch.mockRestore();
    });

    test('should throw error for non-200 responses', async () => {
      const client = createToastClient(testAccessToken, testRestaurantGuid);

      const mockFetch = spyOn(global, 'fetch').mockResolvedValue(
        new Response('Unauthorized', { status: 401 })
      );

      await expect(client.request('/test-endpoint')).rejects.toThrow(
        'Toast API error (401): Unauthorized'
      );

      mockFetch.mockRestore();
    });

    test('should throw error for 500 responses', async () => {
      const client = createToastClient(testAccessToken, testRestaurantGuid);

      const mockFetch = spyOn(global, 'fetch').mockResolvedValue(
        new Response('Internal Server Error', { status: 500 })
      );

      await expect(client.request('/test-endpoint')).rejects.toThrow(
        'Toast API error (500): Internal Server Error'
      );

      mockFetch.mockRestore();
    });

    test('should pass through request options', async () => {
      const client = createToastClient(testAccessToken, testRestaurantGuid);

      const mockFetch = spyOn(global, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 })
      );

      await client.request('/test-endpoint', {
        method: 'POST',
        body: JSON.stringify({ test: true }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ test: true }),
        })
      );

      mockFetch.mockRestore();
    });
  });
});

describe('Toast Authentication', () => {
  beforeAll(() => {
    process.env.TOAST_ENVIRONMENT = 'sandbox';
  });

  test('authenticateWithToast should call login endpoint with correct payload', async () => {
    // Import here to avoid hoisting issues
    const { authenticateWithToast } = await import('../utils/toastClient');

    const mockResponse = {
      token: {
        accessToken: 'new-access-token',
        expiresIn: 86400,
      },
    };

    const mockFetch = spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await authenticateWithToast(
      'test-client-id',
      'test-client-secret',
      'test-restaurant-guid'
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://ws-sandbox-api.toasttab.com/authentication/v1/authentication/login',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          userAccessType: 'TOAST_MACHINE_CLIENT',
        }),
      })
    );

    expect(result.accessToken).toBe('new-access-token');
    expect(result.expiresAt).toBeInstanceOf(Date);

    mockFetch.mockRestore();
  });

  test('authenticateWithToast should throw error on failed authentication', async () => {
    const { authenticateWithToast } = await import('../utils/toastClient');

    const mockFetch = spyOn(global, 'fetch').mockResolvedValue(
      new Response('Invalid credentials', { status: 401 })
    );

    await expect(
      authenticateWithToast('bad-client-id', 'bad-secret', 'guid')
    ).rejects.toThrow('Toast authentication failed (401): Invalid credentials');

    mockFetch.mockRestore();
  });
});

describe('Toast Credential Validation', () => {
  beforeAll(() => {
    process.env.TOAST_ENVIRONMENT = 'sandbox';
  });

  test('validateToastCredentials should return valid for correct credentials', async () => {
    const { validateToastCredentials } = await import('../utils/toastClient');

    // Mock both auth and restaurant info requests
    let callCount = 0;
    const mockFetch = spyOn(global, 'fetch').mockImplementation(async (url) => {
      callCount++;
      if (callCount === 1) {
        // Auth request
        return new Response(
          JSON.stringify({ token: { accessToken: 'token', expiresIn: 86400 } }),
          { status: 200 }
        );
      } else {
        // Restaurant info request
        return new Response(
          JSON.stringify({ general: { name: 'Test Restaurant' } }),
          { status: 200 }
        );
      }
    });

    const result = await validateToastCredentials(
      'valid-client-id',
      'valid-secret',
      'valid-guid'
    );

    expect(result.valid).toBe(true);
    expect(result.restaurantName).toBe('Test Restaurant');
    expect(result.error).toBeUndefined();

    mockFetch.mockRestore();
  });

  test('validateToastCredentials should return invalid for bad credentials', async () => {
    const { validateToastCredentials } = await import('../utils/toastClient');

    const mockFetch = spyOn(global, 'fetch').mockResolvedValue(
      new Response('Unauthorized', { status: 401 })
    );

    const result = await validateToastCredentials(
      'invalid-client-id',
      'invalid-secret',
      'invalid-guid'
    );

    expect(result.valid).toBe(false);
    expect(result.error).toContain('401');

    mockFetch.mockRestore();
  });
});
