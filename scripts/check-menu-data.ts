/**
 * Script to check and display current menu data
 */

import 'dotenv/config';
import { prisma } from '../packages/shared/src/db';

async function main() {
  console.log('=== Menu Categories ===\n');

  const categories = await prisma.menuCategory.findMany({
    include: {
      _count: {
        select: { items: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  for (const cat of categories) {
    console.log(`- ${cat.name} (${cat._count.items} items)`);
    console.log(`  ID: ${cat.id}`);
    console.log(`  Square ID: ${cat.squareCategoryId || 'none'}`);
    console.log('');
  }

  console.log(`\nTotal categories: ${categories.length}`);

  console.log('\n=== Menu Items ===\n');

  const items = await prisma.menuItem.findMany({
    include: {
      category: {
        select: { name: true },
      },
    },
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
  });

  let currentCategory = '';
  for (const item of items) {
    if (item.category.name !== currentCategory) {
      currentCategory = item.category.name;
      console.log(`\n[${currentCategory}]`);
    }
    console.log(`  - ${item.name} ($${item.price}) ${item.squareItemId ? '(Square)' : '(Local)'}`);
  }

  console.log(`\n\nTotal items: ${items.length}`);

  await prisma.$disconnect();
}

main();
