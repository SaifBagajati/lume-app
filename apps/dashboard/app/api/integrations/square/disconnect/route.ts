import { NextRequest, NextResponse } from 'next/server';
import { requireTenantContext, prisma } from '@lume-app/shared';

// Force this route to use Node.js runtime (not Edge)
export const runtime = 'nodejs';

/**
 * POST /api/integrations/square/disconnect
 * Disconnects the Square integration for the tenant
 * Clears all Square-related data from the tenant record
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireTenantContext();

    // Clear all Square integration data
    await prisma.tenant.update({
      where: { id: context.tenantId },
      data: {
        squareLocationId: null,
        squareAccessToken: null,
        squareRefreshToken: null,
        squareTokenExpiresAt: null,
        squareMerchantId: null,
        squareIntegrationEnabled: false,
        lastSquareSyncAt: null,
        squareSyncStatus: null,
        squareSyncError: null,
      },
    });

    // Note: Menu items synced from Square are preserved
    // Only the Square-specific IDs and sync metadata are retained
    // The menu data itself remains intact

    return NextResponse.json({
      success: true,
      message: 'Square integration disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting Square integration:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Square integration' },
      { status: 500 }
    );
  }
}
