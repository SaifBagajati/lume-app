import { decryptToken } from './encryption';
import { prisma } from '../db';

/**
 * Toast API environments
 */
export type ToastEnvironment = 'sandbox' | 'production';

/**
 * Get the Toast environment based on configuration
 */
export function getToastEnvironment(): ToastEnvironment {
  return process.env.TOAST_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
}

/**
 * Get the Toast API base URL based on environment
 */
export function getToastApiBaseUrl(): string {
  const environment = getToastEnvironment();
  return environment === 'production'
    ? 'https://ws-api.toasttab.com'
    : 'https://ws-sandbox-api.toasttab.com';
}

/**
 * Toast API client interface
 */
export interface ToastClient {
  accessToken: string;
  restaurantGuid: string;
  baseUrl: string;

  /**
   * Make an authenticated request to Toast API
   */
  request: <T>(endpoint: string, options?: RequestInit) => Promise<T>;
}

/**
 * Create a Toast API client with the provided credentials
 */
export function createToastClient(accessToken: string, restaurantGuid: string): ToastClient {
  const baseUrl = getToastApiBaseUrl();

  return {
    accessToken,
    restaurantGuid,
    baseUrl,

    async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
      const url = `${baseUrl}${endpoint}`;

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Toast-Restaurant-External-ID': restaurantGuid,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Toast API error (${response.status}): ${errorText}`);
      }

      return response.json();
    },
  };
}

/**
 * Create a Toast client for a specific tenant
 * Retrieves and decrypts the tenant's Toast access token
 * Throws error if Toast integration is not enabled or credentials are missing
 */
export async function createToastClientForTenant(tenantId: string): Promise<ToastClient> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      toastAccessToken: true,
      toastRestaurantGuid: true,
      toastIntegrationEnabled: true,
      toastTokenExpiresAt: true,
    },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  if (!tenant.toastIntegrationEnabled) {
    throw new Error('Toast integration is not enabled for this tenant');
  }

  if (!tenant.toastAccessToken) {
    throw new Error('Toast access token is missing');
  }

  if (!tenant.toastRestaurantGuid) {
    throw new Error('Toast restaurant GUID is missing');
  }

  // Check if token is expired
  if (tenant.toastTokenExpiresAt && tenant.toastTokenExpiresAt < new Date()) {
    throw new Error('Toast access token has expired - refresh required');
  }

  // Decrypt the access token
  const accessToken = decryptToken(tenant.toastAccessToken);

  return createToastClient(accessToken, tenant.toastRestaurantGuid);
}

/**
 * Authenticate with Toast API using client credentials
 * Returns access token and expiration time
 */
export async function authenticateWithToast(
  clientId: string,
  clientSecret: string,
  restaurantGuid: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  const baseUrl = getToastApiBaseUrl();

  const response = await fetch(`${baseUrl}/authentication/v1/authentication/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clientId,
      clientSecret,
      userAccessType: 'TOAST_MACHINE_CLIENT',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Toast authentication failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // Toast tokens typically expire in 24 hours (86400 seconds)
  // Calculate expiration time
  const expiresInSeconds = data.token?.expiresIn || 86400;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  return {
    accessToken: data.token?.accessToken || data.accessToken,
    expiresAt,
  };
}

/**
 * Validate Toast credentials by attempting to authenticate and fetch restaurant info
 */
export async function validateToastCredentials(
  clientId: string,
  clientSecret: string,
  restaurantGuid: string
): Promise<{ valid: boolean; error?: string; restaurantName?: string }> {
  try {
    // First authenticate
    const { accessToken } = await authenticateWithToast(clientId, clientSecret, restaurantGuid);

    // Create client with the token
    const client = createToastClient(accessToken, restaurantGuid);

    // Try to fetch restaurant info to validate the GUID
    const restaurantInfo = await client.request<{ restaurantName?: string; general?: { name?: string } }>(
      `/restaurants/v1/restaurants/${restaurantGuid}`
    );

    return {
      valid: true,
      restaurantName: restaurantInfo.general?.name || restaurantInfo.restaurantName || 'Unknown Restaurant',
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
