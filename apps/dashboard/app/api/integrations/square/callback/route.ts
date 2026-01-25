import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@lume-app/shared';
import { encryptToken } from '@lume-app/shared/utils/encryption';
import { SquareClient, SquareEnvironment } from 'square';

// Force this route to use Node.js runtime (not Edge)
export const runtime = 'nodejs';

/**
 * Get the base URL for redirects, handling tunnels/proxies
 */
function getBaseUrl(request: NextRequest): string {
  // Use AUTH_URL if set (for tunnels like Cloudflare)
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL;
  }
  // Fall back to x-forwarded headers or request URL
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return request.url;
}

/**
 * GET /api/integrations/square/callback
 * Handles the Square OAuth callback
 * Exchanges authorization code for access tokens and stores them encrypted
 */
export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors from Square
    if (error) {
      console.error('Square OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(
          `/settings?error=${encodeURIComponent(errorDescription || error)}`,
          baseUrl
        )
      );
    }

    // Validate required parameters
    if (!code || !stateParam) {
      return NextResponse.redirect(
        new URL('/settings?error=Invalid OAuth callback parameters', baseUrl)
      );
    }

    // Verify and decode state parameter
    let stateData: { state: string; tenantId: string; timestamp: number };
    try {
      const stateJson = Buffer.from(stateParam, 'base64url').toString();
      stateData = JSON.parse(stateJson);
    } catch (e) {
      return NextResponse.redirect(
        new URL('/settings?error=Invalid state parameter', baseUrl)
      );
    }

    // Verify state is recent (within 10 minutes)
    const TEN_MINUTES = 10 * 60 * 1000;
    if (Date.now() - stateData.timestamp > TEN_MINUTES) {
      return NextResponse.redirect(
        new URL('/settings?error=OAuth session expired - please try again', baseUrl)
      );
    }

    const tenantId = stateData.tenantId;

    // Determine Square OAuth URL based on environment
    const SQUARE_OAUTH_BASE_URL =
      process.env.SQUARE_ENVIRONMENT === 'production'
        ? 'https://connect.squareup.com'
        : 'https://connect.squareupsandbox.com';

    // Exchange authorization code for access token
    const tokenResponse = await fetch(`${SQUARE_OAUTH_BASE_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Square-Version': process.env.SQUARE_API_VERSION || '2024-12-18',
      },
      body: JSON.stringify({
        client_id: process.env.SQUARE_APPLICATION_ID,
        client_secret: process.env.SQUARE_APPLICATION_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.SQUARE_OAUTH_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Square token exchange error:', errorData);
      return NextResponse.redirect(
        new URL('/settings?error=Failed to exchange authorization code', baseUrl)
      );
    }

    const tokenData = await tokenResponse.json();
    const {
      access_token,
      refresh_token,
      expires_at,
      merchant_id,
    } = tokenData;

    // Validate token data
    if (!access_token || !merchant_id) {
      return NextResponse.redirect(
        new URL('/settings?error=Invalid token response from Square', baseUrl)
      );
    }

    // Create Square client to get merchant info
    const client = new SquareClient({
      token: access_token,
      environment:
        process.env.SQUARE_ENVIRONMENT === 'production'
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
    });

    // Fetch locations to get primary location ID
    const locationsResult = await client.locations.list();
    const primaryLocation = locationsResult.locations?.[0];

    if (!primaryLocation) {
      return NextResponse.redirect(
        new URL('/settings?error=No Square location found for this account', baseUrl)
      );
    }

    // Store encrypted tokens in database
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        squareLocationId: primaryLocation.id,
        squareAccessToken: encryptToken(access_token),
        squareRefreshToken: refresh_token ? encryptToken(refresh_token) : null,
        squareTokenExpiresAt: new Date(expires_at),
        squareMerchantId: merchant_id,
        squareIntegrationEnabled: true,
        squareSyncStatus: 'IDLE',
        squareSyncError: null,
      },
    });

    // Redirect to settings page with success message
    return NextResponse.redirect(
      new URL('/settings?success=Square connected successfully', baseUrl)
    );
  } catch (error) {
    console.error('Error handling Square OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/settings?error=Failed to complete Square connection', baseUrl)
    );
  }
}
