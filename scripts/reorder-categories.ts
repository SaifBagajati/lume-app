/**
 * Script to set category sort order
 */

import 'dotenv/config';
import { prisma } from '../packages/shared/src/db';

const categoryOrder = [
  'Appetizers',
  'Main Dishes',
  'Cold Drinks',
  'Hot Drinks',
  'Desserts',
];

async function main() {
  console.log('Updating category sort order...\n');

  for (let i = 0; i < categoryOrder.length; i++) {
    const name = categoryOrder[i];
    const result = await prisma.menuCategory.updateMany({
      where: { name },
      data: { sortOrder: i },
    });
    console.log(`${i + 1}. ${name} (updated ${result.count})`);
  }

  console.log('\nDone!');
  await prisma.$disconnect();
}

main();
