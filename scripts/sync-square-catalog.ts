/**
 * Script to sync Square catalog to local database
 *
 * Usage: npx tsx scripts/sync-square-catalog.ts
 */

import 'dotenv/config';
import { prisma } from '../packages/shared/src/db';
import { syncSquareCatalog } from '../packages/shared/src/services/squareSync';

async function main() {
  console.log('Starting Square catalog sync...\n');

  // Get tenant with Square integration
  const tenant = await prisma.tenant.findFirst({
    where: {
      squareIntegrationEnabled: true,
      squareAccessToken: { not: null },
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!tenant) {
    console.error('No tenant found with active Square integration.');
    process.exit(1);
  }

  console.log(`Syncing catalog for tenant: ${tenant.name} (${tenant.id})\n`);

  try {
    const result = await syncSquareCatalog(tenant.id);

    console.log('\n--- Sync Results ---');
    console.log(`Success: ${result.success}`);
    console.log(`Categories synced: ${result.categoriesSynced}`);
    console.log(`Items synced: ${result.itemsSynced}`);
    console.log(`Modifiers synced: ${result.modifiersSynced}`);

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
