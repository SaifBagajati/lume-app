import { createToastClientForTenant } from '../utils/toastClient';
import { prisma } from '../db';

interface SyncResult {
  success: boolean;
  categoriesSynced: number;
  itemsSynced: number;
  modifiersSynced: number;
  errors: string[];
}

/**
 * Toast Menu Types based on Toast API response structure
 */
interface ToastMenuGroup {
  guid: string;
  name: string;
  description?: string;
  ordinal?: number;
  visibility?: string[];
  menuItems?: ToastMenuItem[];
}

interface ToastMenuItem {
  guid: string;
  name: string;
  description?: string;
  price?: number;
  pricingStrategy?: string;
  imageLink?: string;
  calories?: number;
  ordinal?: number;
  visibility?: string[];
  modifierGroups?: ToastModifierGroup[];
}

interface ToastModifierGroup {
  guid: string;
  name: string;
  minSelections?: number;
  maxSelections?: number;
  requiredMode?: string;
  modifiers?: ToastModifier[];
}

interface ToastModifier {
  guid: string;
  name: string;
  price?: number;
  ordinal?: number;
}

interface ToastMenu {
  guid: string;
  name: string;
  menuGroups?: ToastMenuGroup[];
}

interface ToastMenusResponse {
  menus?: ToastMenu[];
}

/**
 * Main function to sync Toast catalog to local database
 */
export async function syncToastCatalog(tenantId: string): Promise<SyncResult> {
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
        toastSyncStatus: 'SYNCING',
        toastSyncError: null,
      },
    });

    // Create Toast client for this tenant
    const client = await createToastClientForTenant(tenantId);

    // Fetch menus from Toast
    console.log('Fetching menus from Toast...');
    const menusResponse = await client.request<ToastMenusResponse>('/menus/v2/menus');

    if (!menusResponse.menus || menusResponse.menus.length === 0) {
      console.log('No menus found in Toast');
      result.success = true;
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          toastSyncStatus: 'IDLE',
          lastToastSyncAt: new Date(),
          toastSyncError: null,
        },
      });
      return result;
    }

    console.log(`Fetched ${menusResponse.menus.length} menus from Toast`);

    // Use Prisma transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Process each menu
      for (const menu of menusResponse.menus || []) {
        // Process menu groups as categories
        for (const menuGroup of menu.menuGroups || []) {
          await syncMenuGroup(tx, tenantId, menuGroup, result);
        }
      }
    });

    // Update sync status to IDLE on success
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        toastSyncStatus: 'IDLE',
        lastToastSyncAt: new Date(),
        toastSyncError: null,
      },
    });

    result.success = true;
    console.log('Toast sync completed successfully');
  } catch (error) {
    console.error('Toast sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);

    // Update sync status to ERROR
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        toastSyncStatus: 'ERROR',
        toastSyncError: errorMessage,
      },
    }).catch(err => console.error('Failed to update error status:', err));
  }

  return result;
}

/**
 * Sync a Toast menu group to local MenuCategory
 */
async function syncMenuGroup(
  tx: any,
  tenantId: string,
  menuGroup: ToastMenuGroup,
  result: SyncResult
): Promise<void> {
  // Check if category already exists
  const existingCategory = await tx.menuCategory.findFirst({
    where: {
      tenantId,
      toastMenuGroupId: menuGroup.guid,
    },
  });

  const categoryPayload = {
    name: menuGroup.name || 'Unnamed Category',
    description: menuGroup.description || null,
    toastMenuGroupId: menuGroup.guid,
    toastVersion: menuGroup.ordinal?.toString() || null,
    lastSyncedAt: new Date(),
  };

  let categoryId: string;

  if (existingCategory) {
    // Update existing category
    await tx.menuCategory.update({
      where: { id: existingCategory.id },
      data: categoryPayload,
    });
    categoryId = existingCategory.id;
    console.log(`Updated category: ${menuGroup.name}`);
  } else {
    // Create new category
    const newCategory = await tx.menuCategory.create({
      data: {
        ...categoryPayload,
        tenantId,
        sortOrder: menuGroup.ordinal || 0,
      },
    });
    categoryId = newCategory.id;
    console.log(`Created category: ${menuGroup.name}`);
  }

  result.categoriesSynced++;

  // Sync menu items within this group
  for (const menuItem of menuGroup.menuItems || []) {
    await syncMenuItem(tx, tenantId, categoryId, menuItem, result);
  }
}

/**
 * Sync a Toast menu item to local MenuItem
 */
async function syncMenuItem(
  tx: any,
  tenantId: string,
  categoryId: string,
  menuItem: ToastMenuItem,
  result: SyncResult
): Promise<void> {
  // Check if item exists
  const existingItem = await tx.menuItem.findFirst({
    where: {
      tenantId,
      toastMenuItemId: menuItem.guid,
    },
  });

  // Get price (Toast may have different pricing strategies)
  const price = menuItem.price || 0;

  const itemPayload = {
    name: menuItem.name || 'Unnamed Item',
    description: menuItem.description || null,
    price,
    imageUrl: menuItem.imageLink || null,
    available: true,
    categoryId,
    toastMenuItemId: menuItem.guid,
    toastVersion: menuItem.ordinal?.toString() || null,
    posItemId: menuItem.guid, // Also set generic POS ID for compatibility
    lastSyncedAt: new Date(),
  };

  let itemId: string;

  if (existingItem) {
    await tx.menuItem.update({
      where: { id: existingItem.id },
      data: itemPayload,
    });
    itemId = existingItem.id;
    console.log(`Updated item: ${menuItem.name} - $${price}`);
  } else {
    const newItem = await tx.menuItem.create({
      data: {
        ...itemPayload,
        tenantId,
      },
    });
    itemId = newItem.id;
    console.log(`Created item: ${menuItem.name} - $${price}`);
  }

  result.itemsSynced++;

  // Sync modifier groups
  for (const modifierGroup of menuItem.modifierGroups || []) {
    await syncModifierGroup(tx, itemId, modifierGroup, result);
  }
}

/**
 * Sync a Toast modifier group to local MenuModifier
 */
async function syncModifierGroup(
  tx: any,
  itemId: string,
  modifierGroup: ToastModifierGroup,
  result: SyncResult
): Promise<void> {
  // Check if modifier exists
  const existingModifier = await tx.menuModifier.findFirst({
    where: {
      itemId,
      toastOptionGroupId: modifierGroup.guid,
    },
  });

  const isRequired = modifierGroup.requiredMode === 'REQUIRED' ||
    (modifierGroup.minSelections && modifierGroup.minSelections > 0);

  const modifierPayload = {
    name: modifierGroup.name || 'Unnamed Modifier',
    required: isRequired,
    toastOptionGroupId: modifierGroup.guid,
    toastVersion: null,
    lastSyncedAt: new Date(),
  };

  let modifierId: string;

  if (existingModifier) {
    await tx.menuModifier.update({
      where: { id: existingModifier.id },
      data: modifierPayload,
    });
    modifierId = existingModifier.id;
  } else {
    const newModifier = await tx.menuModifier.create({
      data: {
        ...modifierPayload,
        itemId,
      },
    });
    modifierId = newModifier.id;
  }

  result.modifiersSynced++;

  // Sync modifier options
  for (const modifier of modifierGroup.modifiers || []) {
    await syncModifierOption(tx, modifierId, modifier);
  }
}

/**
 * Sync a Toast modifier to local ModifierOption
 */
async function syncModifierOption(
  tx: any,
  modifierId: string,
  modifier: ToastModifier
): Promise<void> {
  const existingOption = await tx.modifierOption.findFirst({
    where: {
      modifierId,
      toastModifierId: modifier.guid,
    },
  });

  const optionPayload = {
    name: modifier.name || 'Unnamed Option',
    price: modifier.price || 0,
    toastModifierId: modifier.guid,
    toastVersion: modifier.ordinal?.toString() || null,
    lastSyncedAt: new Date(),
  };

  if (existingOption) {
    await tx.modifierOption.update({
      where: { id: existingOption.id },
      data: optionPayload,
    });
  } else {
    await tx.modifierOption.create({
      data: {
        ...optionPayload,
        modifierId,
      },
    });
  }
}
