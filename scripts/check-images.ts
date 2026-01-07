/**
 * Script to check if images are stored in the database
 */

import 'dotenv/config';
import { prisma } from '../packages/shared/src/db';

async function main() {
  const items = await prisma.menuItem.findMany({
    select: {
      name: true,
      imageUrl: true,
    },
    orderBy: { name: 'asc' },
    take: 5,
  });

  console.log('=== First 5 Menu Items with Images ===\n');
  for (const item of items) {
    console.log(`${item.name}:`);
    console.log(`  ${item.imageUrl || '(no image)'}`);
    console.log('');
  }

  const withImages = await prisma.menuItem.count({
    where: { imageUrl: { not: null } },
  });
  const total = await prisma.menuItem.count();

  console.log(`\nSummary: ${withImages}/${total} items have images`);

  await prisma.$disconnect();
}

main();
