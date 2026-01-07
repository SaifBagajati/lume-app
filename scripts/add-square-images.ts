/**
 * Script to add images to Square catalog items
 * Uses Unsplash source for free, high-quality food images
 */

import 'dotenv/config';
import { SquareClient, SquareEnvironment } from 'square';
import { prisma } from '../packages/shared/src/db';
import { decryptToken } from '../packages/shared/src/utils/encryption';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// Image URLs for each menu item (using Unsplash source for reliable images)
// Format: 400x300 food images
const itemImages: Record<string, string> = {
  // Appetizers
  'Crispy Calamari': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',
  'Spinach Artichoke Dip': 'https://images.unsplash.com/photo-1576506295286-5cda18df43e7?w=400&h=300&fit=crop',
  'Buffalo Wings': 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400&h=300&fit=crop',
  'Loaded Nachos': 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&h=300&fit=crop',
  'Bruschetta': 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=300&fit=crop',

  // Main Dishes
  'Grilled Salmon': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
  'Ribeye Steak': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop',
  'Chicken Parmesan': 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400&h=300&fit=crop',
  'Fish and Chips': 'https://images.unsplash.com/photo-1579888944880-d98341245702?w=400&h=300&fit=crop',
  'BBQ Bacon Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',

  // Cold Drinks
  'Fresh Lemonade': 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop',
  'Iced Tea': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',
  'Fruit Smoothie': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop',
  'Sparkling Water': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=300&fit=crop',
  'Milkshake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop',

  // Hot Drinks
  'Espresso': 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=300&fit=crop',
  'Cappuccino': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop',
  'Hot Chocolate': 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&h=300&fit=crop',
  'Herbal Tea': 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&h=300&fit=crop',
  'Café Latte': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop',

  // Desserts
  'New York Cheesecake': 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&h=300&fit=crop',
  'Chocolate Lava Cake': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop',
  'Tiramisu': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop',
  'Apple Pie': 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=400&h=300&fit=crop',
  'Crème Brûlée': 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400&h=300&fit=crop',
};

// Download image to temp file
async function downloadImage(url: string, filename: string): Promise<string> {
  const tmpDir = '/tmp/square-images';
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const filepath = path.join(tmpDir, filename);

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          downloadImage(redirectUrl, filename).then(resolve).catch(reject);
          return;
        }
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete incomplete file
      reject(err);
    });
  });
}

async function main() {
  console.log('=== Adding images to Square catalog ===\n');

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

  // Fetch all catalog items
  console.log('Fetching catalog items...');
  const catalogResult = await client.catalog.list({ types: 'ITEM' });
  const items = catalogResult.data || [];

  console.log(`Found ${items.length} items\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const item of items) {
    const itemName = item.itemData?.name;
    if (!itemName || !itemImages[itemName]) {
      console.log(`Skipping ${itemName || 'unknown'}: no image URL defined`);
      continue;
    }

    const imageUrl = itemImages[itemName];
    console.log(`Processing: ${itemName}...`);

    try {
      // Download image
      const filename = `${itemName.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      const filepath = await downloadImage(imageUrl, filename);

      // Read file as buffer
      const imageData = fs.readFileSync(filepath);

      // Use REST API directly for image upload (multipart/form-data)
      const formData = new FormData();

      // Add the request JSON
      const request = {
        idempotency_key: randomUUID(),
        image: {
          type: 'IMAGE',
          id: `#${randomUUID()}`,
          image_data: {
            name: itemName,
            caption: itemName,
          },
        },
        object_id: item.id,
      };
      formData.append('request', JSON.stringify(request));

      // Add the image file
      const blob = new Blob([imageData], { type: 'image/jpeg' });
      formData.append('image_file', blob, filename);

      // Make request to Square API
      const apiUrl =
        process.env.SQUARE_ENVIRONMENT === 'production'
          ? 'https://connect.squareup.com/v2/catalog/images'
          : 'https://connect.squareupsandbox.com/v2/catalog/images';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Square-Version': process.env.SQUARE_API_VERSION || '2024-12-18',
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.image) {
        console.log(`  ✓ Image added: ${result.image.id}`);
        successCount++;
      } else {
        console.log(`  ✗ Failed: ${JSON.stringify(result.errors || result)}`);
        errorCount++;
      }

      // Clean up temp file
      fs.unlinkSync(filepath);

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error: any) {
      console.log(`  ✗ Error: ${error.message || error}`);
      errorCount++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);

  if (successCount > 0) {
    console.log('\nRun sync-square-catalog.ts to update local database with image URLs.');
  }

  await prisma.$disconnect();
}

main();
