import { NextRequest, NextResponse } from 'next/server';
import { requireTenantContext, prisma } from '@lume-app/shared';
import { randomBytes } from 'crypto';

// Force this route to use Node.js runtime (not Edge)
export const runtime = 'nodejs';

/**
 * GET /api/integrations/square/connect
 * Initiates the Square OAuth flow by generating an authorization URL
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireTenantContext();

    // Check if another POS integration is already enabled
    const tenant = await prisma.tenant.findUnique({
      where: { id: context.tenantId },
      select: {
        squareIntegrationEnabled: true,
        toastIntegrationEnabled: true,
      },
    });

    if (tenant?.toastIntegrationEnabled) {
      return NextResponse.json(
        { error: 'Please disconnect Toast before connecting Square. Only one POS integration can be active at a time.' },
        { status: 400 }
      );
    }

    if (tenant?.squareIntegrationEnabled) {
      return NextResponse.json(
        { error: 'Square is already connected' },
        { status: 400 }
      );
    }

    // Generate state for CSRF protection
    const state = randomBytes(32).toString('hex');
    const stateData = {
      state,
      tenantId: context.tenantId,
      timestamp: Date.now(),
    };

    // Encode state data
    const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64url');

    // Required OAuth scopes for Square integration
    const scopes = [
      'ITEMS_READ',         // Read catalog items
      'ITEMS_WRITE',        // Write catalog items
      'MERCHANT_PROFILE_READ', // Read merchant profile
      'PAYMENTS_READ',      // Read payment information
      'ORDERS_READ',        // Read orders
      'ORDERS_WRITE',       // Write orders
    ];

    // Determine Square OAuth URL based on environment
    const SQUARE_OAUTH_BASE_URL =
      process.env.SQUARE_ENVIRONMENT === 'production'
        ? 'https://connect.squareup.com'
        : 'https://connect.squareupsandbox.com';

    // Get redirect URI from environment
    const redirectUri = process.env.SQUARE_OAUTH_REDIRECT_URI;
    if (!redirectUri) {
      throw new Error('SQUARE_OAUTH_REDIRECT_URI not configured');
    }

    // Build authorization URL
    const authUrl = new URL(`${SQUARE_OAUTH_BASE_URL}/oauth2/authorize`);
    authUrl.searchParams.set('client_id', process.env.SQUARE_APPLICATION_ID!);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('session', 'false');
    authUrl.searchParams.set('state', stateParam);

    return NextResponse.json({
      authUrl: authUrl.toString(),
    });
  } catch (error) {
    console.error('Error initiating Square OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Square connection' },
      { status: 500 }
    );
  }
}
