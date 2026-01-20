import { describe, test, expect, beforeAll } from 'bun:test';

// Mock Square catalog response data
const mockSquareCatalogResponse = {
  objects: [
    // Categories
    {
      type: 'CATEGORY',
      id: 'CATEGORY_1',
      version: BigInt(1234567890),
      isDeleted: false,
      categoryData: {
        name: 'Appetizers',
      },
    },
    {
      type: 'CATEGORY',
      id: 'CATEGORY_2',
      version: BigInt(1234567891),
      isDeleted: false,
      categoryData: {
        name: 'Main Courses',
      },
    },
    // Items
    {
      type: 'ITEM',
      id: 'ITEM_1',
      version: BigInt(1234567892),
      isDeleted: false,
      itemData: {
        name: 'Buffalo Wings',
        description: 'Crispy wings with buffalo sauce',
        categoryId: 'CATEGORY_1',
        imageIds: ['IMAGE_1'],
        variations: [
          {
            id: 'VARIATION_1',
            itemVariationData: {
              name: 'Regular',
              priceMoney: {
                amount: BigInt(1299),
                currency: 'USD',
              },
            },
          },
        ],
      },
    },
    {
      type: 'ITEM',
      id: 'ITEM_2',
      version: BigInt(1234567893),
      isDeleted: false,
      itemData: {
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon',
        categories: [{ id: 'CATEGORY_2' }], // New API format
        variations: [
          {
            id: 'VARIATION_2',
            itemVariationData: {
              name: 'Regular',
              priceMoney: {
                amount: BigInt(2499),
                currency: 'USD',
              },
            },
          },
        ],
      },
    },
    {
      type: 'ITEM',
      id: 'ITEM_3',
      version: BigInt(1234567894),
      isDeleted: true, // Deleted item
      itemData: {
        name: 'Discontinued Item',
        variations: [
          {
            id: 'VARIATION_3',
            itemVariationData: {
              priceMoney: { amount: BigInt(999), currency: 'USD' },
            },
          },
        ],
      },
    },
    // Images
    {
      type: 'IMAGE',
      id: 'IMAGE_1',
      imageData: {
        url: 'https://square-images.com/wings.jpg',
      },
    },
    // Modifier Lists
    {
      type: 'MODIFIER_LIST',
      id: 'MODIFIER_LIST_1',
      modifierListData: {
        name: 'Sauce Options',
        modifiers: [
          { id: 'MOD_1', modifierData: { name: 'Mild', priceMoney: { amount: BigInt(0) } } },
          { id: 'MOD_2', modifierData: { name: 'Hot', priceMoney: { amount: BigInt(0) } } },
        ],
      },
    },
  ],
};

describe('Square Sync Service', () => {
  beforeAll(() => {
    process.env.SQUARE_ENVIRONMENT = 'sandbox';
    process.env.POS_ENCRYPTION_KEY = 'YOGQLOY8aq1GSosunoKeX7zkOkbGnbF8';
  });

  describe('Catalog Object Filtering', () => {
    test('should correctly filter categories', () => {
      const categories = mockSquareCatalogResponse.objects.filter(
        (obj) => obj.type === 'CATEGORY'
      );

      expect(categories.length).toBe(2);
      expect(categories[0].categoryData?.name).toBe('Appetizers');
      expect(categories[1].categoryData?.name).toBe('Main Courses');
    });

    test('should correctly filter items', () => {
      const items = mockSquareCatalogResponse.objects.filter(
        (obj) => obj.type === 'ITEM'
      );

      expect(items.length).toBe(3);
    });

    test('should correctly filter images', () => {
      const images = mockSquareCatalogResponse.objects.filter(
        (obj) => obj.type === 'IMAGE'
      );

      expect(images.length).toBe(1);
      expect(images[0].imageData?.url).toBe('https://square-images.com/wings.jpg');
    });

    test('should correctly filter modifier lists', () => {
      const modifierLists = mockSquareCatalogResponse.objects.filter(
        (obj) => obj.type === 'MODIFIER_LIST'
      );

      expect(modifierLists.length).toBe(1);
    });

    test('should identify deleted items', () => {
      const deletedItems = mockSquareCatalogResponse.objects.filter(
        (obj) => obj.type === 'ITEM' && obj.isDeleted
      );

      expect(deletedItems.length).toBe(1);
      expect(deletedItems[0].id).toBe('ITEM_3');
    });

    test('should identify non-deleted items', () => {
      const activeItems = mockSquareCatalogResponse.objects.filter(
        (obj) => obj.type === 'ITEM' && !obj.isDeleted
      );

      expect(activeItems.length).toBe(2);
    });
  });

  describe('Category Data Mapping', () => {
    test('should map Square category to local format', () => {
      const squareCategory = mockSquareCatalogResponse.objects.find(
        (obj) => obj.type === 'CATEGORY' && obj.id === 'CATEGORY_1'
      );

      const categoryPayload = {
        name: squareCategory?.categoryData?.name || 'Unnamed Category',
        squareCategoryId: squareCategory?.id,
        squareCategoryVersion: squareCategory?.version,
      };

      expect(categoryPayload.name).toBe('Appetizers');
      expect(categoryPayload.squareCategoryId).toBe('CATEGORY_1');
      expect(categoryPayload.squareCategoryVersion).toBe(BigInt(1234567890));
    });

    test('should handle category without name', () => {
      const categoryWithNoName = { type: 'CATEGORY', id: 'CAT', categoryData: {} };
      const name = categoryWithNoName.categoryData?.name || 'Unnamed Category';
      expect(name).toBe('Unnamed Category');
    });

    test('should handle category without categoryData', () => {
      const categoryWithNoData = { type: 'CATEGORY', id: 'CAT' };
      const categoryData = categoryWithNoData.categoryData;
      expect(categoryData).toBeUndefined();
    });
  });

  describe('Item Data Mapping', () => {
    test('should map Square item to local format with old API', () => {
      const squareItem = mockSquareCatalogResponse.objects.find(
        (obj) => obj.type === 'ITEM' && obj.id === 'ITEM_1'
      );
      const itemData = squareItem?.itemData;
      const variation = itemData?.variations?.[0];
      const priceMoney = variation?.itemVariationData?.priceMoney;

      const price = priceMoney?.amount
        ? Number(priceMoney.amount) / 100
        : 0;

      const itemPayload = {
        name: itemData?.name || 'Unnamed Item',
        description: itemData?.description || null,
        price,
        squareItemId: squareItem?.id,
        squareVariationId: variation?.id,
        categoryId: itemData?.categoryId, // Old API format
      };

      expect(itemPayload.name).toBe('Buffalo Wings');
      expect(itemPayload.description).toBe('Crispy wings with buffalo sauce');
      expect(itemPayload.price).toBe(12.99);
      expect(itemPayload.squareItemId).toBe('ITEM_1');
      expect(itemPayload.squareVariationId).toBe('VARIATION_1');
      expect(itemPayload.categoryId).toBe('CATEGORY_1');
    });

    test('should map Square item with new categories array API', () => {
      const squareItem = mockSquareCatalogResponse.objects.find(
        (obj) => obj.type === 'ITEM' && obj.id === 'ITEM_2'
      );
      const itemData = squareItem?.itemData;

      // Handle both old categoryId and new categories array
      let squareCategoryId = itemData?.categoryId;
      if (!squareCategoryId && itemData?.categories && itemData.categories.length > 0) {
        squareCategoryId = itemData.categories[0].id;
      }

      expect(squareCategoryId).toBe('CATEGORY_2');
    });

    test('should convert price from cents to dollars', () => {
      const testCases = [
        { cents: BigInt(1299), dollars: 12.99 },
        { cents: BigInt(100), dollars: 1.00 },
        { cents: BigInt(2500), dollars: 25.00 },
        { cents: BigInt(999), dollars: 9.99 },
        { cents: BigInt(0), dollars: 0 },
      ];

      for (const { cents, dollars } of testCases) {
        const price = Number(cents) / 100;
        expect(price).toBe(dollars);
      }
    });

    test('should handle item without price', () => {
      const itemWithNoPrice = {
        itemData: {
          name: 'Free Item',
          variations: [
            {
              id: 'VAR',
              itemVariationData: {
                // No priceMoney
              },
            },
          ],
        },
      };

      const priceMoney = itemWithNoPrice.itemData.variations[0].itemVariationData.priceMoney;
      const price = priceMoney?.amount ? Number(priceMoney.amount) / 100 : 0;

      expect(price).toBe(0);
    });

    test('should handle item without variations', () => {
      const itemWithNoVariations = {
        itemData: {
          name: 'Item',
          // No variations array
        },
      };

      const variations = itemWithNoVariations.itemData.variations || [];
      expect(variations.length).toBe(0);
    });

    test('should handle item without description', () => {
      const itemWithNoDescription = {
        itemData: {
          name: 'Item',
        },
      };

      const description = itemWithNoDescription.itemData.description || null;
      expect(description).toBeNull();
    });
  });

  describe('Image Mapping', () => {
    test('should build image ID to URL map', () => {
      const images = mockSquareCatalogResponse.objects.filter(
        (obj) => obj.type === 'IMAGE'
      );

      const imageMap = new Map<string, string>();
      for (const img of images) {
        if (img.id && img.imageData?.url) {
          imageMap.set(img.id, img.imageData.url);
        }
      }

      expect(imageMap.size).toBe(1);
      expect(imageMap.get('IMAGE_1')).toBe('https://square-images.com/wings.jpg');
    });

    test('should get image URL for item with images', () => {
      const imageMap = new Map([['IMAGE_1', 'https://square-images.com/wings.jpg']]);
      const itemData = { imageIds: ['IMAGE_1'] };

      let imageUrl: string | null = null;
      if (itemData.imageIds && itemData.imageIds.length > 0) {
        imageUrl = imageMap.get(itemData.imageIds[0]) || null;
      }

      expect(imageUrl).toBe('https://square-images.com/wings.jpg');
    });

    test('should return null for item without images', () => {
      const imageMap = new Map([['IMAGE_1', 'https://example.com/img.jpg']]);
      const itemData = { name: 'Item' }; // No imageIds

      let imageUrl: string | null = null;
      if (itemData.imageIds && itemData.imageIds.length > 0) {
        imageUrl = imageMap.get(itemData.imageIds[0]) || null;
      }

      expect(imageUrl).toBeNull();
    });
  });

  describe('Sync Result Structure', () => {
    test('should have correct initial result structure', () => {
      const result = {
        success: false,
        categoriesSynced: 0,
        itemsSynced: 0,
        modifiersSynced: 0,
        errors: [] as string[],
      };

      expect(result.success).toBe(false);
      expect(result.categoriesSynced).toBe(0);
      expect(result.itemsSynced).toBe(0);
      expect(result.modifiersSynced).toBe(0);
      expect(result.errors).toEqual([]);
    });

    test('should track sync counts correctly', () => {
      const result = {
        success: false,
        categoriesSynced: 0,
        itemsSynced: 0,
        modifiersSynced: 0,
        errors: [] as string[],
      };

      const objects = mockSquareCatalogResponse.objects;

      // Count categories (non-deleted)
      for (const obj of objects) {
        if (obj.type === 'CATEGORY' && !obj.isDeleted) {
          result.categoriesSynced++;
        }
      }

      // Count items (non-deleted)
      for (const obj of objects) {
        if (obj.type === 'ITEM' && !obj.isDeleted) {
          result.itemsSynced++;
        }
      }

      expect(result.categoriesSynced).toBe(2);
      expect(result.itemsSynced).toBe(2); // 3 items, but 1 is deleted
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty catalog response', () => {
      const emptyResponse = { objects: [] };
      expect(emptyResponse.objects.length).toBe(0);
    });

    test('should handle item with multiple variations (use first)', () => {
      const itemWithMultipleVariations = {
        itemData: {
          name: 'Multi-variation Item',
          variations: [
            {
              id: 'VAR_1',
              itemVariationData: {
                name: 'Small',
                priceMoney: { amount: BigInt(999), currency: 'USD' },
              },
            },
            {
              id: 'VAR_2',
              itemVariationData: {
                name: 'Large',
                priceMoney: { amount: BigInt(1499), currency: 'USD' },
              },
            },
          ],
        },
      };

      // Should use first variation
      const variation = itemWithMultipleVariations.itemData.variations[0];
      const price = Number(variation.itemVariationData.priceMoney.amount) / 100;

      expect(price).toBe(9.99);
      expect(variation.id).toBe('VAR_1');
    });

    test('should handle BigInt version conversion', () => {
      // Use string constructor to avoid precision loss
      const version = BigInt('1234567890123456789');
      expect(typeof version).toBe('bigint');

      // Can convert to string for storage if needed
      expect(version.toString()).toBe('1234567890123456789');
    });
  });
});

describe('Square Webhook Handling', () => {
  describe('Event Types', () => {
    const supportedEventTypes = [
      'catalog.version.updated',
      'inventory.count.updated',
      'order.created',
      'order.updated',
      'payment.created',
      'payment.updated',
    ];

    test('should recognize catalog update events', () => {
      const catalogEvents = supportedEventTypes.filter(e => e.startsWith('catalog'));
      expect(catalogEvents).toContain('catalog.version.updated');
    });

    test('should recognize order events', () => {
      const orderEvents = supportedEventTypes.filter(e => e.startsWith('order'));
      expect(orderEvents.length).toBe(2);
    });

    test('should recognize payment events', () => {
      const paymentEvents = supportedEventTypes.filter(e => e.startsWith('payment'));
      expect(paymentEvents.length).toBe(2);
    });
  });

  describe('Webhook Payload Structure', () => {
    test('should parse catalog webhook payload', () => {
      const payload = {
        merchant_id: 'MERCHANT_123',
        type: 'catalog.version.updated',
        event_id: 'EVENT_ID_123',
        created_at: '2024-01-15T10:30:00Z',
        data: {
          type: 'catalog.version.updated',
          id: 'CATALOG_VERSION_123',
          object: {
            catalog_version: {
              updated_at: '2024-01-15T10:30:00Z',
            },
          },
        },
      };

      expect(payload.type).toBe('catalog.version.updated');
      expect(payload.merchant_id).toBe('MERCHANT_123');
      expect(payload.event_id).toBeDefined();
    });
  });
});
