import { NextResponse } from 'next/server';
import { requireTenantContext } from '@lume-app/shared';
import { syncToastCatalog } from '@lume-app/shared/services/toastSync';

export async function POST() {
  try {
    const context = await requireTenantContext();

    // Run sync
    const result = await syncToastCatalog(context.tenantId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Sync failed',
          details: result.errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Toast catalog synced successfully',
      stats: {
        categories: result.categoriesSynced,
        items: result.itemsSynced,
        modifiers: result.modifiersSynced,
      },
    });
  } catch (error) {
    console.error('Error syncing Toast catalog:', error);
    return NextResponse.json(
      { error: 'Failed to sync Toast catalog' },
      { status: 500 }
    );
  }
}
