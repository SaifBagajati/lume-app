import { SquareClient, SquareEnvironment } from 'square';
import { decryptToken } from './encryption';
import { prisma } from '../db';

/**
 * Get the Square environment based on configuration
 */
export function getSquareEnvironment(): SquareEnvironment {
  return process.env.SQUARE_ENVIRONMENT === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;
}

/**
 * Create a Square client with the provided access token
 */
export function createSquareClient(accessToken: string): SquareClient {
  return new SquareClient({
    token: accessToken,
    environment: getSquareEnvironment(),
  });
}

/**
 * Create a Square client for a specific tenant
 * Retrieves and decrypts the tenant's Square access token
 * Throws error if Square integration is not enabled or token is missing/expired
 */
export async function createSquareClientForTenant(tenantId: string): Promise<SquareClient> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      squareAccessToken: true,
      squareIntegrationEnabled: true,
      squareTokenExpiresAt: true,
    },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  if (!tenant.squareIntegrationEnabled) {
    throw new Error('Square integration is not enabled for this tenant');
  }

  if (!tenant.squareAccessToken) {
    throw new Error('Square access token is missing');
  }

  // Check if token is expired
  if (tenant.squareTokenExpiresAt && tenant.squareTokenExpiresAt < new Date()) {
    throw new Error('Square access token has expired - refresh required');
  }

  // Decrypt the access token
  const accessToken = decryptToken(tenant.squareAccessToken);

  return createSquareClient(accessToken);
}
