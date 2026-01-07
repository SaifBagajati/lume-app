/**
 * Script to seed Square sandbox with sample menu data
 * Creates 5 categories with 5 items each
 *
 * Usage: npx tsx scripts/seed-square-catalog.ts
 */

import 'dotenv/config';
import { SquareClient, SquareEnvironment } from 'square';
import { prisma } from '../packages/shared/src/db';
import { decryptToken } from '../packages/shared/src/utils/encryption';
import { randomUUID } from 'crypto';

interface MenuItem {
  name: string;
  description: string;
  price: number; // in cents
  imageUrl?: string;
}

interface MenuCategory {
  name: string;
  items: MenuItem[];
}

// Sample menu data with realistic descriptions and prices
const menuData: MenuCategory[] = [
  {
    name: 'Appetizers',
    items: [
      {
        name: 'Crispy Calamari',
        description: 'Lightly breaded calamari rings served with marinara and lemon aioli',
        price: 1495,
      },
      {
        name: 'Spinach Artichoke Dip',
        description: 'Creamy blend of spinach, artichokes, and parmesan served with tortilla chips',
        price: 1295,
      },
      {
        name: 'Buffalo Wings',
        description: 'Crispy chicken wings tossed in buffalo sauce, served with celery and ranch',
        price: 1595,
      },
      {
        name: 'Loaded Nachos',
        description: 'Tortilla chips topped with cheese, jalapeños, sour cream, and guacamole',
        price: 1395,
      },
      {
        name: 'Bruschetta',
        description: 'Toasted baguette topped with fresh tomatoes, basil, and balsamic glaze',
        price: 1095,
      },
    ],
  },
  {
    name: 'Main Dishes',
    items: [
      {
        name: 'Grilled Salmon',
        description: 'Atlantic salmon with lemon herb butter, served with seasonal vegetables',
        price: 2695,
      },
      {
        name: 'Ribeye Steak',
        description: '12oz USDA Choice ribeye, grilled to perfection with garlic butter',
        price: 3495,
      },
      {
        name: 'Chicken Parmesan',
        description: 'Breaded chicken breast with marinara and melted mozzarella, served with pasta',
        price: 2195,
      },
      {
        name: 'Fish and Chips',
        description: 'Beer-battered cod with crispy fries, coleslaw, and tartar sauce',
        price: 1995,
      },
      {
        name: 'BBQ Bacon Burger',
        description: 'Half-pound beef patty with bacon, cheddar, onion rings, and BBQ sauce',
        price: 1795,
      },
    ],
  },
  {
    name: 'Cold Drinks',
    items: [
      {
        name: 'Fresh Lemonade',
        description: 'House-made lemonade with fresh lemons and a hint of mint',
        price: 495,
      },
      {
        name: 'Iced Tea',
        description: 'Freshly brewed black tea served over ice, sweetened or unsweetened',
        price: 395,
      },
      {
        name: 'Fruit Smoothie',
        description: 'Blended strawberries, bananas, and orange juice',
        price: 695,
      },
      {
        name: 'Sparkling Water',
        description: 'San Pellegrino sparkling mineral water',
        price: 395,
      },
      {
        name: 'Milkshake',
        description: 'Thick and creamy vanilla, chocolate, or strawberry shake',
        price: 695,
      },
    ],
  },
  {
    name: 'Hot Drinks',
    items: [
      {
        name: 'Espresso',
        description: 'Double shot of rich Italian espresso',
        price: 395,
      },
      {
        name: 'Cappuccino',
        description: 'Espresso with steamed milk and velvety foam',
        price: 495,
      },
      {
        name: 'Hot Chocolate',
        description: 'Rich Belgian chocolate with whipped cream',
        price: 495,
      },
      {
        name: 'Herbal Tea',
        description: 'Selection of chamomile, peppermint, or green tea',
        price: 395,
      },
      {
        name: 'Café Latte',
        description: 'Espresso with steamed milk and a light layer of foam',
        price: 545,
      },
    ],
  },
  {
    name: 'Desserts',
    items: [
      {
        name: 'New York Cheesecake',
        description: 'Classic creamy cheesecake with graham cracker crust and berry compote',
        price: 895,
      },
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
        price: 995,
      },
      {
        name: 'Tiramisu',
        description: 'Italian layered dessert with espresso-soaked ladyfingers and mascarpone',
        price: 895,
      },
      {
        name: 'Apple Pie',
        description: 'Warm apple pie with cinnamon and vanilla ice cream',
        price: 795,
      },
      {
        name: 'Crème Brûlée',
        description: 'Classic French custard with caramelized sugar top',
        price: 895,
      },
    ],
  },
];

async function main() {
  console.log('Starting Square catalog seed...\n');

  // Get tenant with Square integration
  const tenant = await prisma.tenant.findFirst({
    where: {
      squareIntegrationEnabled: true,
      squareAccessToken: { not: null },
    },
    select: {
      id: true,
      name: true,
      squareAccessToken: true,
      squareLocationId: true,
    },
  });

  if (!tenant) {
    console.error('No tenant found with active Square integration.');
    console.log('Please connect Square first via the dashboard settings.');
    process.exit(1);
  }

  console.log(`Found tenant: ${tenant.name} (${tenant.id})`);
  console.log(`Location ID: ${tenant.squareLocationId}\n`);

  // Decrypt access token
  const accessToken = decryptToken(tenant.squareAccessToken!);

  // Create Square client
  const client = new SquareClient({
    token: accessToken,
    environment:
      process.env.SQUARE_ENVIRONMENT === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
  });

  // Build catalog objects for batch upsert
  const batches: any[] = [];
  const categoryIdMap = new Map<string, string>();

  // Create categories first
  console.log('Creating categories...');
  for (let i = 0; i < menuData.length; i++) {
    const category = menuData[i];
    const idempotencyKey = `#category-${category.name.toLowerCase().replace(/\s+/g, '-')}`;
    categoryIdMap.set(category.name, idempotencyKey);

    batches.push({
      type: 'CATEGORY',
      id: idempotencyKey,
      categoryData: {
        name: category.name,
      },
      presentAtAllLocations: true,
    });
  }

  // Create items with variations
  console.log('Creating menu items...');
  for (const category of menuData) {
    const categoryId = categoryIdMap.get(category.name);

    for (const item of category.items) {
      const itemId = `#item-${item.name.toLowerCase().replace(/\s+/g, '-')}`;
      const variationId = `#variation-${item.name.toLowerCase().replace(/\s+/g, '-')}`;

      batches.push({
        type: 'ITEM',
        id: itemId,
        itemData: {
          name: item.name,
          description: item.description,
          // Use categories array for category association (newer API)
          categories: [{ id: categoryId }],
          variations: [
            {
              type: 'ITEM_VARIATION',
              id: variationId,
              itemVariationData: {
                name: 'Regular',
                pricingType: 'FIXED_PRICING',
                priceMoney: {
                  amount: BigInt(item.price),
                  currency: 'CAD',
                },
              },
            },
          ],
        },
        presentAtAllLocations: true,
      });
    }
  }

  console.log(`\nBatch upsert: ${batches.length} objects (${menuData.length} categories + ${menuData.reduce((acc, c) => acc + c.items.length, 0)} items)`);

  try {
    // Upsert all catalog objects
    const result = await client.catalog.batchUpsert({
      idempotencyKey: randomUUID(),
      batches: [
        {
          objects: batches,
        },
      ],
    });

    console.log('\nCatalog created successfully!');
    console.log(`Created ${result.idMappings?.length || 0} objects`);

    // Log the mapping of temp IDs to real IDs
    if (result.idMappings) {
      console.log('\nCategory mappings:');
      for (const mapping of result.idMappings) {
        if (mapping.clientObjectId?.startsWith('#category-')) {
          console.log(`  ${mapping.clientObjectId} -> ${mapping.objectId}`);
        }
      }
    }

    console.log('\nDone! You can now sync your menu from the dashboard.');
    console.log('Go to Settings > Integrations and click "Sync Now" on Square.');
  } catch (error: any) {
    console.error('Error creating catalog:', error);
    if (error.errors) {
      for (const err of error.errors) {
        console.error(`  - ${err.category}: ${err.code} - ${err.detail}`);
      }
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
