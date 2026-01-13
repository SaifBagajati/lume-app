import { NextResponse } from 'next/server';
import { prisma, requireTenantContext } from '@lume-app/shared';

export async function POST() {
  try {
    const context = await requireTenantContext();

    // Clear Toast integration data
    await prisma.tenant.update({
      where: { id: context.tenantId },
      data: {
        toastRestaurantGuid: null,
        toastClientId: null,
        toastClientSecret: null,
        toastAccessToken: null,
        toastTokenExpiresAt: null,
        toastIntegrationEnabled: false,
        toastSyncStatus: null,
        toastSyncError: null,
        // Preserve lastToastSyncAt for historical reference
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Toast disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting Toast:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Toast' },
      { status: 500 }
    );
  }
}
