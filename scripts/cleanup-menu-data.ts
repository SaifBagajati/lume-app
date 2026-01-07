/**
 * Script to clean up old local menu data and prepare for fresh Square sync
 */

import 'dotenv/config';
import { prisma } from '../packages/shared/src/db';

async function main() {
  console.log('=== Cleaning up menu data ===\n');

  // Get tenant
  const tenant = await prisma.tenant.findFirst({
    where: { squareIntegrationEnabled: true },
    select: { id: true, name: true },
  });

  if (!tenant) {
    console.error('No tenant found');
    process.exit(1);
  }

  console.log(`Tenant: ${tenant.name}\n`);

  // Delete in proper order due to foreign key constraints:
  // 1. OrderItems (references MenuItem)
  // 2. MenuModifiers -> ModifierOptions (cascade should handle this)
  // 3. MenuItems
  // 4. MenuCategories

  // First, delete order items that reference menu items
  const deletedOrderItems = await prisma.orderItem.deleteMany({
    where: {
      order: { tenantId: tenant.id },
    },
  });
  console.log(`Deleted ${deletedOrderItems.count} order items`);

  // Delete menu modifiers (cascades to modifier options)
  const deletedModifiers = await prisma.menuModifier.deleteMany({
    where: {
      item: { tenantId: tenant.id },
    },
  });
  console.log(`Deleted ${deletedModifiers.count} menu modifiers`);

  // Delete all menu items
  const deletedItems = await prisma.menuItem.deleteMany({
    where: { tenantId: tenant.id },
  });
  console.log(`Deleted ${deletedItems.count} menu items`);

  // Delete all menu categories
  const deletedCategories = await prisma.menuCategory.deleteMany({
    where: { tenantId: tenant.id },
  });
  console.log(`Deleted ${deletedCategories.count} menu categories`);

  console.log('\nCleanup complete! Run sync-square-catalog.ts to re-sync from Square.');

  await prisma.$disconnect();
}

main();
