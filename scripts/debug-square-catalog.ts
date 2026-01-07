/**
 * Debug script to see raw Square catalog data
 */

import 'dotenv/config';
import { SquareClient, SquareEnvironment } from 'square';
import { prisma } from '../packages/shared/src/db';
import { decryptToken } from '../packages/shared/src/utils/encryption';

async function main() {
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

  const result = await client.catalog.list({
    types: 'CATEGORY,ITEM',
  });

  console.log('=== Categories ===\n');
  for (const obj of result.data || []) {
    if (obj.type === 'CATEGORY') {
      console.log(`ID: ${obj.id}`);
      console.log(`Name: ${obj.categoryData?.name}`);
      console.log('');
    }
  }

  console.log('=== Items (first 3) ===\n');
  let count = 0;
  for (const obj of result.data || []) {
    if (obj.type === 'ITEM' && count < 3) {
      console.log(`ID: ${obj.id}`);
      console.log(`Name: ${obj.itemData?.name}`);
      console.log(`categoryId: ${obj.itemData?.categoryId || 'none'}`);
      const cats = obj.itemData?.categories;
      if (cats && cats.length > 0) {
        console.log(`categories: [${cats.map((c: any) => c.id).join(', ')}]`);
      } else {
        console.log('categories: none');
      }
      console.log(`Full itemData keys: ${Object.keys(obj.itemData || {}).join(', ')}`);
      console.log('');
      count++;
    }
  }

  await prisma.$disconnect();
}

main();
