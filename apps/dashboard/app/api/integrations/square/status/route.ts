import { NextRequest, NextResponse } from 'next/server';
import { requireTenantContext, prisma } from '@lume-app/shared';

// Force this route to use Node.js runtime (not Edge)
export const runtime = 'nodejs';

/**
 * GET /api/integrations/square/status
 * Returns the current Square integration status for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireTenantContext();

    const tenant = await prisma.tenant.findUnique({
      where: { id: context.tenantId },
      select: {
        squareIntegrationEnabled: true,
        squareLocationId: true,
        squareMerchantId: true,
        lastSquareSyncAt: true,
        squareSyncStatus: true,
        squareSyncError: true,
        squareTokenExpiresAt: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check if token is expiring soon (within 7 days)
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const tokenExpiring = tenant.squareTokenExpiresAt
      ? tenant.squareTokenExpiresAt < sevenDaysFromNow
      : false;

    return NextResponse.json({
      enabled: tenant.squareIntegrationEnabled,
      locationId: tenant.squareLocationId,
      merchantId: tenant.squareMerchantId,
      lastSyncAt: tenant.lastSquareSyncAt,
      syncStatus: tenant.squareSyncStatus,
      syncError: tenant.squareSyncError,
      tokenExpiring,
    });
  } catch (error) {
    console.error('Error fetching Square integration status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Square integration status' },
      { status: 500 }
    );
  }
}
