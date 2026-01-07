import { createSquareClientForTenant } from '../utils/squareClient';
import { prisma } from '../db';
import type { SquareClient } from 'square';

interface SyncResult {
  success: boolean;
  categoriesSynced: number;
  itemsSynced: number;
  modifiersSynced: number;
  errors: string[];
}

/**
 * Main function to sync Square catalog to local database
 */
export async function syncSquareCatalog(tenantId: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    categoriesSynced: 0,
    itemsSynced: 0,
    modifiersSynced: 0,
    errors: [],
  };

  try {
    // Update sync status to SYNCING
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        squareSyncStatus: 'SYNCING',
        squareSyncError: null,
      },
    });

    // Create Square client for this tenant
    const client = await createSquareClientForTenant(tenantId);

    // Fetch all catalog objects from Square
    console.log('Fetching catalog from Square...');
    const catalogObjects = await fetchAllCatalogObjects(client);
    console.log(`Fetched ${catalogObjects.length} catalog objects from Square`);

    // Separate objects by type
    const categories = catalogObjects.filter((obj) => obj.type === 'CATEGORY');
    const items = catalogObjects.filter((obj) => obj.type === 'ITEM');
    const modifierLists = catalogObjects.filter((obj) => obj.type === 'MODIFIER_LIST');
    const images = catalogObjects.filter((obj) => obj.type === 'IMAGE');

    // Build image ID to URL map
    const imageMap = new Map<string, string>();
    for (const img of images) {
      if (img.id && img.imageData?.url) {
        imageMap.set(img.id, img.imageData.url);
      }
    }

    console.log(`Categories: ${categories.length}, Items: ${items.length}, Images: ${images.length}, Modifier Lists: ${modifierLists.length}`);

    // Use Prisma transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Sync Categories
      for (const category of categories) {
        if (!category.isDeleted) {
          await syncCategory(tx, tenantId, category);
          result.categoriesSynced++;
        }
      }

      // 2. Sync Items (with variations for pricing)
      for (const item of items) {
        await syncItem(tx, tenantId, item, imageMap);
        if (!item.isDeleted) {
          result.itemsSynced++;
        }
      }

      // 3. Sync Modifier Lists (optional - skipping for MVP)
      // TODO: Implement modifier sync in future version
      // for (const modifierList of modifierLists) {
      //   await syncModifierList(tx, tenantId, modifierList);
      //   result.modifiersSynced++;
      // }
    });

    // Update sync status to IDLE on success
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        squareSyncStatus: 'IDLE',
        lastSquareSyncAt: new Date(),
        squareSyncError: null,
      },
    });

    result.success = true;
    console.log('Sync completed successfully');
  } catch (error) {
    console.error('Square sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);

    // Update sync status to ERROR
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        squareSyncStatus: 'ERROR',
        squareSyncError: errorMessage,
      },
    }).catch(err => console.error('Failed to update error status:', err));
  }

  return result;
}

/**
 * Fetch all catalog objects from Square with pagination
 */
async function fetchAllCatalogObjects(client: SquareClient): Promise<any[]> {
  const allObjects: any[] = [];
  let cursor: string | undefined;

  do {
    try {
      const page = await client.catalog.list({
        cursor,
        types: 'CATEGORY,ITEM,MODIFIER_LIST,IMAGE',
      });

      // Page.data contains the CatalogObject[] items
      if (page.data) {
        allObjects.push(...page.data);
      }

      // Check if there's a next page
      if (page.hasNextPage()) {
        cursor = page.response.cursor;
      } else {
        cursor = undefined;
      }
    } catch (error) {
      console.error('Error fetching catalog page:', error);
      throw error;
    }
  } while (cursor);

  return allObjects;
}

/**
 * Sync a Square category to local database
 */
async function syncCategory(tx: any, tenantId: string, squareCategory: any): Promise<void> {
  const categoryData = squareCategory.categoryData;

  if (!categoryData) {
    console.warn(`Category ${squareCategory.id} has no category_data, skipping`);
    return;
  }

  // Check if category already exists
  const existingCategory = await tx.menuCategory.findFirst({
    where: {
      tenantId,
      squareCategoryId: squareCategory.id,
    },
  });

  const categoryPayload = {
    name: categoryData.name || 'Unnamed Category',
    description: null, // Square categories don't have descriptions
    squareCategoryId: squareCategory.id,
    squareCategoryVersion: squareCategory.version ? BigInt(squareCategory.version) : null,
    lastSyncedAt: new Date(),
  };

  if (existingCategory) {
    // Update existing category
    await tx.menuCategory.update({
      where: { id: existingCategory.id },
      data: categoryPayload,
    });
    console.log(`Updated category: ${categoryData.name}`);
  } else {
    // Create new category
    await tx.menuCategory.create({
      data: {
        ...categoryPayload,
        tenantId,
        sortOrder: 0,
      },
    });
    console.log(`Created category: ${categoryData.name}`);
  }
}

/**
 * Sync a Square item (with variation for pricing) to local database
 */
async function syncItem(tx: any, tenantId: string, squareItem: any, imageMap: Map<string, string>): Promise<void> {
  const itemData = squareItem.itemData;

  if (!itemData) {
    console.warn(`Item ${squareItem.id} has no item_data, skipping`);
    return;
  }

  // Skip if deleted - mark as unavailable instead
  if (squareItem.isDeleted) {
    await tx.menuItem.updateMany({
      where: {
        tenantId,
        squareItemId: squareItem.id,
      },
      data: {
        available: false,
        lastSyncedAt: new Date(),
      },
    });
    console.log(`Marked item ${squareItem.id} as unavailable (deleted in Square)`);
    return;
  }

  // Get first variation for price
  const variation = itemData.variations?.[0];
  if (!variation || !variation.itemVariationData) {
    console.warn(`Item ${squareItem.id} has no variations, skipping`);
    return;
  }

  const priceMoney = variation.itemVariationData.priceMoney;
  const price = priceMoney && priceMoney.amount
    ? Number(priceMoney.amount) / 100 // Convert cents to dollars
    : 0;

  // Find category mapping - check both categoryId and categories array
  let squareCategoryId = itemData.categoryId;

  // Newer Square API uses categories array
  if (!squareCategoryId && itemData.categories && itemData.categories.length > 0) {
    squareCategoryId = itemData.categories[0].id;
  }

  let categoryId: string | undefined;

  if (squareCategoryId) {
    const category = await tx.menuCategory.findFirst({
      where: {
        tenantId,
        squareCategoryId,
      },
      select: { id: true },
    });
    categoryId = category?.id;
  }

  // If no category found, create/use "Uncategorized"
  if (!categoryId) {
    let uncategorized = await tx.menuCategory.findFirst({
      where: {
        tenantId,
        name: 'Uncategorized',
      },
    });

    if (!uncategorized) {
      uncategorized = await tx.menuCategory.create({
        data: {
          name: 'Uncategorized',
          tenantId,
          sortOrder: 999,
        },
      });
    }

    categoryId = uncategorized.id;
  }

  // Check if item exists
  const existingItem = await tx.menuItem.findFirst({
    where: {
      tenantId,
      squareItemId: squareItem.id,
    },
  });

  // Get image URL from imageMap if item has associated images
  let imageUrl: string | null = null;
  if (itemData.imageIds && itemData.imageIds.length > 0) {
    // Use the first image
    imageUrl = imageMap.get(itemData.imageIds[0]) || null;
  }

  const itemPayload = {
    name: itemData.name || 'Unnamed Item',
    description: itemData.description || null,
    price,
    imageUrl,
    available: true,
    categoryId,
    squareItemId: squareItem.id,
    squareItemVersion: squareItem.version ? BigInt(squareItem.version) : null,
    squareVariationId: variation.id,
    posItemId: squareItem.id, // Also set generic POS ID for compatibility
    lastSyncedAt: new Date(),
  };

  if (existingItem) {
    await tx.menuItem.update({
      where: { id: existingItem.id },
      data: itemPayload,
    });
    console.log(`Updated item: ${itemData.name} - $${price}`);
  } else {
    await tx.menuItem.create({
      data: {
        ...itemPayload,
        tenantId,
      },
    });
    console.log(`Created item: ${itemData.name} - $${price}`);
  }
}
