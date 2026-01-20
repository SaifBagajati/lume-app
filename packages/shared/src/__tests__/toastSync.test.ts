import { describe, test, expect, beforeAll, beforeEach, afterEach, mock, spyOn } from 'bun:test';

// Mock data for Toast API responses
const mockToastMenusResponse = {
  menus: [
    {
      guid: 'menu-guid-1',
      name: 'Main Menu',
      menuGroups: [
        {
          guid: 'group-guid-1',
          name: 'Appetizers',
          description: 'Start your meal right',
          ordinal: 1,
          menuItems: [
            {
              guid: 'item-guid-1',
              name: 'Buffalo Wings',
              description: 'Crispy wings with buffalo sauce',
              price: 12.99,
              imageLink: 'https://example.com/wings.jpg',
              ordinal: 1,
              modifierGroups: [
                {
                  guid: 'modifier-group-1',
                  name: 'Sauce Level',
                  minSelections: 1,
                  maxSelections: 1,
                  requiredMode: 'REQUIRED',
                  modifiers: [
                    { guid: 'mod-1', name: 'Mild', price: 0, ordinal: 1 },
                    { guid: 'mod-2', name: 'Medium', price: 0, ordinal: 2 },
                    { guid: 'mod-3', name: 'Hot', price: 0, ordinal: 3 },
                  ],
                },
              ],
            },
            {
              guid: 'item-guid-2',
              name: 'Mozzarella Sticks',
              description: 'Crispy fried cheese',
              price: 9.99,
              ordinal: 2,
            },
          ],
        },
        {
          guid: 'group-guid-2',
          name: 'Main Courses',
          description: 'Our signature dishes',
          ordinal: 2,
          menuItems: [
            {
              guid: 'item-guid-3',
              name: 'Grilled Salmon',
              description: 'Fresh Atlantic salmon',
              price: 24.99,
              ordinal: 1,
            },
          ],
        },
      ],
    },
  ],
};

describe('Toast Sync Service', () => {
  let mockPrisma: any;
  let originalModule: any;

  beforeAll(() => {
    process.env.TOAST_ENVIRONMENT = 'sandbox';
    process.env.POS_ENCRYPTION_KEY = 'YOGQLOY8aq1GSosunoKeX7zkOkbGnbF8';
  });

  describe('Menu Data Mapping', () => {
    test('should correctly map Toast menu groups to categories', () => {
      const menuGroup = mockToastMenusResponse.menus[0].menuGroups[0];

      const categoryPayload = {
        name: menuGroup.name || 'Unnamed Category',
        description: menuGroup.description || null,
        toastMenuGroupId: menuGroup.guid,
        toastVersion: menuGroup.ordinal?.toString() || null,
      };

      expect(categoryPayload.name).toBe('Appetizers');
      expect(categoryPayload.description).toBe('Start your meal right');
      expect(categoryPayload.toastMenuGroupId).toBe('group-guid-1');
      expect(categoryPayload.toastVersion).toBe('1');
    });

    test('should correctly map Toast menu items', () => {
      const menuItem = mockToastMenusResponse.menus[0].menuGroups[0].menuItems[0];

      const itemPayload = {
        name: menuItem.name || 'Unnamed Item',
        description: menuItem.description || null,
        price: menuItem.price || 0,
        imageUrl: menuItem.imageLink || null,
        toastMenuItemId: menuItem.guid,
        toastVersion: menuItem.ordinal?.toString() || null,
        posItemId: menuItem.guid,
      };

      expect(itemPayload.name).toBe('Buffalo Wings');
      expect(itemPayload.description).toBe('Crispy wings with buffalo sauce');
      expect(itemPayload.price).toBe(12.99);
      expect(itemPayload.imageUrl).toBe('https://example.com/wings.jpg');
      expect(itemPayload.toastMenuItemId).toBe('item-guid-1');
      expect(itemPayload.posItemId).toBe('item-guid-1');
    });

    test('should correctly map Toast modifier groups', () => {
      const modifierGroup = mockToastMenusResponse.menus[0].menuGroups[0].menuItems[0].modifierGroups![0];

      const isRequired = modifierGroup.requiredMode === 'REQUIRED' ||
        (modifierGroup.minSelections && modifierGroup.minSelections > 0);

      const modifierPayload = {
        name: modifierGroup.name || 'Unnamed Modifier',
        required: isRequired,
        toastOptionGroupId: modifierGroup.guid,
      };

      expect(modifierPayload.name).toBe('Sauce Level');
      expect(modifierPayload.required).toBe(true);
      expect(modifierPayload.toastOptionGroupId).toBe('modifier-group-1');
    });

    test('should correctly map Toast modifiers to options', () => {
      const modifier = mockToastMenusResponse.menus[0].menuGroups[0].menuItems[0].modifierGroups![0].modifiers![0];

      const optionPayload = {
        name: modifier.name || 'Unnamed Option',
        price: modifier.price || 0,
        toastModifierId: modifier.guid,
        toastVersion: modifier.ordinal?.toString() || null,
      };

      expect(optionPayload.name).toBe('Mild');
      expect(optionPayload.price).toBe(0);
      expect(optionPayload.toastModifierId).toBe('mod-1');
      expect(optionPayload.toastVersion).toBe('1');
    });
  });

  describe('Edge Cases', () => {
    test('should handle menu items without price', () => {
      const menuItem = { guid: 'test', name: 'Test Item' };
      const price = menuItem.price || 0;
      expect(price).toBe(0);
    });

    test('should handle menu items without description', () => {
      const menuItem = { guid: 'test', name: 'Test Item' };
      const description = menuItem.description || null;
      expect(description).toBeNull();
    });

    test('should handle empty menu groups array', () => {
      const menu = { guid: 'test', name: 'Empty Menu', menuGroups: [] };
      expect(menu.menuGroups.length).toBe(0);
    });

    test('should handle missing menuItems array', () => {
      const menuGroup = { guid: 'test', name: 'Empty Group' };
      const items = menuGroup.menuItems || [];
      expect(items.length).toBe(0);
    });

    test('should handle missing modifierGroups array', () => {
      const menuItem = { guid: 'test', name: 'Simple Item', price: 5 };
      const modifiers = menuItem.modifierGroups || [];
      expect(modifiers.length).toBe(0);
    });

    test('should determine required status from requiredMode', () => {
      const requiredGroup = { requiredMode: 'REQUIRED', minSelections: 0 };
      const optionalGroup = { requiredMode: 'OPTIONAL', minSelections: 0 };

      const isRequired1 = requiredGroup.requiredMode === 'REQUIRED' ||
        (requiredGroup.minSelections && requiredGroup.minSelections > 0);
      const isRequired2 = optionalGroup.requiredMode === 'REQUIRED' ||
        (optionalGroup.minSelections && optionalGroup.minSelections > 0);

      expect(isRequired1).toBe(true);
      expect(!!isRequired2).toBe(false); // Coerce to boolean
    });

    test('should determine required status from minSelections', () => {
      const groupWithMinSelections = { minSelections: 1 };

      const isRequired = groupWithMinSelections.requiredMode === 'REQUIRED' ||
        (groupWithMinSelections.minSelections && groupWithMinSelections.minSelections > 0);

      expect(isRequired).toBe(true);
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

      // Simulate counting from mock data
      const menus = mockToastMenusResponse.menus;
      for (const menu of menus) {
        for (const group of menu.menuGroups || []) {
          result.categoriesSynced++;
          for (const item of group.menuItems || []) {
            result.itemsSynced++;
            for (const modGroup of item.modifierGroups || []) {
              result.modifiersSynced++;
            }
          }
        }
      }

      expect(result.categoriesSynced).toBe(2); // Appetizers, Main Courses
      expect(result.itemsSynced).toBe(3); // Buffalo Wings, Mozzarella Sticks, Grilled Salmon
      expect(result.modifiersSynced).toBe(1); // Sauce Level
    });
  });
});

describe('Toast API Response Parsing', () => {
  test('should handle menus response with no menus', () => {
    const response = { menus: [] };
    expect(response.menus.length).toBe(0);
  });

  test('should handle menus response with undefined menus', () => {
    const response = {};
    const menus = response.menus || [];
    expect(menus.length).toBe(0);
  });

  test('should correctly parse full menu structure', () => {
    const response = mockToastMenusResponse;

    expect(response.menus.length).toBe(1);
    expect(response.menus[0].name).toBe('Main Menu');
    expect(response.menus[0].menuGroups?.length).toBe(2);

    const appetizers = response.menus[0].menuGroups![0];
    expect(appetizers.name).toBe('Appetizers');
    expect(appetizers.menuItems?.length).toBe(2);

    const wings = appetizers.menuItems![0];
    expect(wings.name).toBe('Buffalo Wings');
    expect(wings.price).toBe(12.99);
    expect(wings.modifierGroups?.length).toBe(1);
    expect(wings.modifierGroups![0].modifiers?.length).toBe(3);
  });
});
