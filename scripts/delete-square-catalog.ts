/**
 * Script to delete all Square catalog objects
 * Use this to clean up before re-seeding
 */

import 'dotenv/config';
import { SquareClient, SquareEnvironment } from 'square';
import { prisma } from '../packages/shared/src/db';
import { decryptToken } from '../packages/shared/src/utils/encryption';

async function main() {
  console.log('=== Deleting Square catalog ===\n');

  const tenant = await prisma.tenant.findFirst({
    where: { squareIntegrationEnabled: true },
    select: { squareAccessToken: true },
  });

  if (!tenant?.squareAccessToken) {
    console.error('No tenant with Square token found');
    process.exit(1);
  }

  const accessToken = decryptToken(tenant.squareAccessToken);
  const client = new SquareClient({
    token: accessToken,
    environment: SquareEnvironment.Sandbox,
  });

  // Fetch all catalog objects
  console.log('Fetching all catalog objects...');
  const allObjects: string[] = [];
  let cursor: string | undefined;

  do {
    const page = await client.catalog.list({ cursor, types: 'CATEGORY,ITEM' });
    if (page.data) {
      for (const obj of page.data) {
        if (obj.id) {
          allObjects.push(obj.id);
        }
      }
    }
    cursor = page.hasNextPage() ? page.response.cursor : undefined;
  } while (cursor);

  console.log(`Found ${allObjects.length} objects to delete`);

  if (allObjects.length === 0) {
    console.log('Nothing to delete');
    await prisma.$disconnect();
    return;
  }

  // Delete in batches of 200 (Square API limit)
  const batchSize = 200;
  for (let i = 0; i < allObjects.length; i += batchSize) {
    const batch = allObjects.slice(i, i + batchSize);
    console.log(`Deleting batch ${Math.floor(i / batchSize) + 1}: ${batch.length} objects...`);

    await client.catalog.batchDelete({
      objectIds: batch,
    });
  }

  console.log('\nAll catalog objects deleted!');
  console.log('Run seed-square-catalog.ts to create fresh data.');

  await prisma.$disconnect();
}

main();
