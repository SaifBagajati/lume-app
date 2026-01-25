import { describe, test, expect, mock, beforeEach, beforeAll } from 'bun:test';

// Define the TenantContext interface for typing
interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  userId: string;
  userRole: string;
}

// Mock data
let mockHeadersData: Record<string, string | null> = {};
let mockSessionData: { user?: Record<string, string> } | null = null;

// Mock modules before importing
mock.module('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => mockHeadersData[name] ?? null,
  }),
}));

mock.module('../auth', () => ({
  auth: async () => mockSessionData,
}));

// Module references - populated in beforeAll
let hasRole: (context: TenantContext, allowedRoles: string[]) => boolean;
let getTenantContext: () => Promise<TenantContext | null>;
let requireTenantContext: () => Promise<TenantContext>;
let requireRole: (allowedRoles: string[]) => Promise<TenantContext>;

describe('Tenant Context Utilities', () => {
  beforeAll(async () => {
    // Dynamic import after mocks are set up
    const module = await import('../utils/tenantContext');
    hasRole = module.hasRole;
    getTenantContext = module.getTenantContext;
    requireTenantContext = module.requireTenantContext;
    requireRole = module.requireRole;
  });

  beforeEach(() => {
    // Reset mocks before each test
    mockHeadersData = {};
    mockSessionData = null;
  });

  describe('hasRole', () => {
    const createContext = (role: string): TenantContext => ({
      tenantId: 'tenant-123',
      tenantSlug: 'demo-restaurant',
      userId: 'user-456',
      userRole: role,
    });

    test('should return true when user has the exact allowed role', () => {
      const context = createContext('OWNER');
      expect(hasRole(context, ['OWNER'])).toBe(true);
    });

    test('should return false when user does not have allowed role', () => {
      const context = createContext('STAFF');
      expect(hasRole(context, ['OWNER'])).toBe(false);
    });

    test('should return true when user has one of multiple allowed roles', () => {
      const context = createContext('MANAGER');
      expect(hasRole(context, ['OWNER', 'MANAGER', 'ADMIN'])).toBe(true);
    });

    test('should return false when user role not in allowed roles list', () => {
      const context = createContext('STAFF');
      expect(hasRole(context, ['OWNER', 'MANAGER'])).toBe(false);
    });

    test('should be case-sensitive for role matching', () => {
      const context = createContext('OWNER');

      expect(hasRole(context, ['owner'])).toBe(false);
      expect(hasRole(context, ['Owner'])).toBe(false);
      expect(hasRole(context, ['OWNER'])).toBe(true);
    });

    test('should return false for empty allowed roles array', () => {
      const context = createContext('OWNER');
      expect(hasRole(context, [])).toBe(false);
    });

    test('should handle all standard roles correctly', () => {
      expect(hasRole(createContext('OWNER'), ['OWNER'])).toBe(true);
      expect(hasRole(createContext('MANAGER'), ['MANAGER'])).toBe(true);
      expect(hasRole(createContext('STAFF'), ['STAFF'])).toBe(true);
    });

    test('should handle role hierarchy checks', () => {
      const ownerOnly = ['OWNER'];
      const managerAndAbove = ['OWNER', 'MANAGER'];
      const allStaff = ['OWNER', 'MANAGER', 'STAFF'];

      // OWNER has access to everything
      expect(hasRole(createContext('OWNER'), ownerOnly)).toBe(true);
      expect(hasRole(createContext('OWNER'), managerAndAbove)).toBe(true);
      expect(hasRole(createContext('OWNER'), allStaff)).toBe(true);

      // MANAGER has access to manager+ routes
      expect(hasRole(createContext('MANAGER'), ownerOnly)).toBe(false);
      expect(hasRole(createContext('MANAGER'), managerAndAbove)).toBe(true);
      expect(hasRole(createContext('MANAGER'), allStaff)).toBe(true);

      // STAFF only has access to all-staff routes
      expect(hasRole(createContext('STAFF'), ownerOnly)).toBe(false);
      expect(hasRole(createContext('STAFF'), managerAndAbove)).toBe(false);
      expect(hasRole(createContext('STAFF'), allStaff)).toBe(true);
    });
  });

  describe('getTenantContext', () => {
    test('should return context from headers when all headers present', async () => {
      mockHeadersData = {
        'x-tenant-id': 'tenant-123',
        'x-tenant-slug': 'demo-restaurant',
        'x-user-id': 'user-456',
        'x-user-role': 'OWNER',
      };

      const context = await getTenantContext();

      expect(context).toEqual({
        tenantId: 'tenant-123',
        tenantSlug: 'demo-restaurant',
        userId: 'user-456',
        userRole: 'OWNER',
      });
    });

    test('should return null when headers are missing', async () => {
      mockHeadersData = {
        'x-tenant-id': 'tenant-123',
        // Missing other headers
      };

      const context = await getTenantContext();
      expect(context).toBeNull();
    });

    test('should fallback to session when headers missing', async () => {
      mockHeadersData = {};
      mockSessionData = {
        user: {
          id: 'user-789',
          tenantId: 'tenant-abc',
          tenantSlug: 'other-restaurant',
          role: 'MANAGER',
        },
      };

      const context = await getTenantContext();

      expect(context).toEqual({
        tenantId: 'tenant-abc',
        tenantSlug: 'other-restaurant',
        userId: 'user-789',
        userRole: 'MANAGER',
      });
    });

    test('should return null when no headers and no session', async () => {
      mockHeadersData = {};
      mockSessionData = null;

      const context = await getTenantContext();
      expect(context).toBeNull();
    });

    test('should return null when session exists but no user', async () => {
      mockHeadersData = {};
      mockSessionData = {};

      const context = await getTenantContext();
      expect(context).toBeNull();
    });
  });

  describe('requireTenantContext', () => {
    test('should return context when authenticated', async () => {
      mockHeadersData = {
        'x-tenant-id': 'tenant-123',
        'x-tenant-slug': 'demo-restaurant',
        'x-user-id': 'user-456',
        'x-user-role': 'OWNER',
      };

      const context = await requireTenantContext();

      expect(context.tenantId).toBe('tenant-123');
    });

    test('should throw when not authenticated', async () => {
      mockHeadersData = {};
      mockSessionData = null;

      await expect(requireTenantContext()).rejects.toThrow(
        'Unauthorized: No tenant context available'
      );
    });
  });

  describe('requireRole', () => {
    test('should return context when user has required role', async () => {
      mockHeadersData = {
        'x-tenant-id': 'tenant-123',
        'x-tenant-slug': 'demo-restaurant',
        'x-user-id': 'user-456',
        'x-user-role': 'OWNER',
      };

      const context = await requireRole(['OWNER', 'MANAGER']);

      expect(context.userRole).toBe('OWNER');
    });

    test('should throw when user lacks required role', async () => {
      mockHeadersData = {
        'x-tenant-id': 'tenant-123',
        'x-tenant-slug': 'demo-restaurant',
        'x-user-id': 'user-456',
        'x-user-role': 'STAFF',
      };

      await expect(requireRole(['OWNER', 'MANAGER'])).rejects.toThrow(
        'Forbidden: Requires one of roles: OWNER, MANAGER'
      );
    });

    test('should throw unauthorized before checking role if not authenticated', async () => {
      mockHeadersData = {};
      mockSessionData = null;

      await expect(requireRole(['OWNER'])).rejects.toThrow(
        'Unauthorized: No tenant context available'
      );
    });
  });

  describe('Security: Header Handling', () => {
    test('should use header values as-is (middleware responsibility to validate)', async () => {
      mockHeadersData = {
        'x-tenant-id': 'any-tenant',
        'x-tenant-slug': 'any-slug',
        'x-user-id': 'any-user',
        'x-user-role': 'OWNER',
      };

      const context = await getTenantContext();

      // The function trusts headers - middleware must be secure
      expect(context?.tenantId).toBe('any-tenant');
    });

    test('should handle empty string headers as falsy', async () => {
      mockHeadersData = {
        'x-tenant-id': '',
        'x-tenant-slug': 'demo',
        'x-user-id': 'user',
        'x-user-role': 'OWNER',
      };

      const context = await getTenantContext();

      // Empty string is falsy, should fall through to session
      expect(context).toBeNull();
    });
  });
});
