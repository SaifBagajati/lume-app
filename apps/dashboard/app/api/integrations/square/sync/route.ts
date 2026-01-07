import { NextRequest, NextResponse } from 'next/server';
import { requireTenantContext } from '@lume-app/shared';
import { syncSquareCatalog } from '@lume-app/shared/services/squareSync';

// Force this route to use Node.js runtime (not Edge)
export const runtime = 'nodejs';

/**
 * POST /api/integrations/square/sync
 * Manually triggers a full sync of the Square catalog
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireTenantContext();

    console.log(`Starting Square catalog sync for tenant: ${context.tenantId}`);

    // Trigger the sync (runs synchronously for now - should use job queue in production)
    const result = await syncSquareCatalog(context.tenantId);

    if (result.success) {
      console.log('Sync completed successfully:', result);
      return NextResponse.json({
        success: true,
        message: 'Menu synced successfully from Square',
        stats: {
          categories: result.categoriesSynced,
          items: result.itemsSynced,
          modifiers: result.modifiersSynced,
        },
      });
    } else {
      console.error('Sync failed:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Sync completed with errors',
          errors: result.errors,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error triggering Square sync:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to sync with Square',
      },
      { status: 500 }
    );
  }
}
