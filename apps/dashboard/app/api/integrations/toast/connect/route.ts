import { NextRequest, NextResponse } from 'next/server';
import { prisma, requireTenantContext } from '@lume-app/shared';
import { encryptToken } from '@lume-app/shared/utils/encryption';
import { validateToastCredentials, authenticateWithToast } from '@lume-app/shared/utils/toastClient';

export async function POST(request: NextRequest) {
  try {
    const context = await requireTenantContext();

    const body = await request.json();
    const { clientId, clientSecret, restaurantGuid } = body;

    if (!clientId || !clientSecret || !restaurantGuid) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, clientSecret, restaurantGuid' },
        { status: 400 }
      );
    }

    // Check if another POS integration is already enabled
    const tenant = await prisma.tenant.findUnique({
      where: { id: context.tenantId },
      select: {
        squareIntegrationEnabled: true,
        toastIntegrationEnabled: true,
      },
    });

    if (tenant?.squareIntegrationEnabled) {
      return NextResponse.json(
        { error: 'Please disconnect Square before connecting Toast. Only one POS integration can be active at a time.' },
        { status: 400 }
      );
    }

    if (tenant?.toastIntegrationEnabled) {
      return NextResponse.json(
        { error: 'Toast is already connected' },
        { status: 400 }
      );
    }

    // Validate credentials with Toast API
    const validation = await validateToastCredentials(clientId, clientSecret, restaurantGuid);

    if (!validation.valid) {
      return NextResponse.json(
        { error: `Invalid Toast credentials: ${validation.error}` },
        { status: 400 }
      );
    }

    // Authenticate and get access token
    const { accessToken, expiresAt } = await authenticateWithToast(clientId, clientSecret, restaurantGuid);

    // Encrypt sensitive data
    const encryptedAccessToken = encryptToken(accessToken);
    const encryptedClientSecret = encryptToken(clientSecret);

    // Store credentials in database
    await prisma.tenant.update({
      where: { id: context.tenantId },
      data: {
        toastRestaurantGuid: restaurantGuid,
        toastClientId: clientId,
        toastClientSecret: encryptedClientSecret,
        toastAccessToken: encryptedAccessToken,
        toastTokenExpiresAt: expiresAt,
        toastIntegrationEnabled: true,
        toastSyncStatus: 'IDLE',
        toastSyncError: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Toast connected successfully',
      restaurantName: validation.restaurantName,
    });
  } catch (error) {
    console.error('Error connecting Toast:', error);
    return NextResponse.json(
      { error: 'Failed to connect Toast' },
      { status: 500 }
    );
  }
}
