import { NextResponse } from 'next/server';
import { prisma, requireTenantContext } from '@lume-app/shared';

export async function GET() {
  try {
    const context = await requireTenantContext();

    const tenant = await prisma.tenant.findUnique({
      where: { id: context.tenantId },
      select: {
        toastIntegrationEnabled: true,
        toastRestaurantGuid: true,
        lastToastSyncAt: true,
        toastSyncStatus: true,
        toastSyncError: true,
        toastTokenExpiresAt: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check if token is expiring soon (within 7 days)
    const tokenExpiring = tenant.toastTokenExpiresAt
      ? tenant.toastTokenExpiresAt < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      : false;

    return NextResponse.json({
      enabled: tenant.toastIntegrationEnabled,
      restaurantGuid: tenant.toastRestaurantGuid,
      lastSyncAt: tenant.lastToastSyncAt?.toISOString(),
      syncStatus: tenant.toastSyncStatus,
      syncError: tenant.toastSyncError,
      tokenExpiring,
    });
  } catch (error) {
    console.error('Error fetching Toast status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Toast status' },
      { status: 500 }
    );
  }
}
