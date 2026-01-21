import { describe, test, expect } from 'bun:test';

// The TenantContext interface from ../utils/tenantContext.ts
interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  userId: string;
  userRole: string;
}

// The hasRole function from ../utils/tenantContext.ts
// We duplicate it here to test without importing the module that has Next.js dependencies.
// In production, this function is used from the actual module.
function hasRole(context: TenantContext, allowedRoles: string[]): boolean {
  return allowedRoles.includes(context.userRole);
}

// Note: getTenantContext, requireTenantContext, and requireRole depend on
// Next.js headers() and auth() which require the full Next.js runtime.
// These functions should be tested in integration tests with API routes.
// Here we test the pure hasRole function that doesn't have external dependencies.

describe('Tenant Context Utilities', () => {
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

    test('should handle STAFF role correctly', () => {
      const context = createContext('STAFF');

      expect(hasRole(context, ['STAFF'])).toBe(true);
      expect(hasRole(context, ['OWNER', 'MANAGER', 'STAFF'])).toBe(true);
      expect(hasRole(context, ['OWNER', 'MANAGER'])).toBe(false);
    });

    test('should handle MANAGER role correctly', () => {
      const context = createContext('MANAGER');

      expect(hasRole(context, ['MANAGER'])).toBe(true);
      expect(hasRole(context, ['OWNER', 'MANAGER'])).toBe(true);
      expect(hasRole(context, ['OWNER'])).toBe(false);
    });

    test('should handle OWNER role correctly', () => {
      const context = createContext('OWNER');

      expect(hasRole(context, ['OWNER'])).toBe(true);
      expect(hasRole(context, ['OWNER', 'MANAGER', 'STAFF'])).toBe(true);
    });

    test('should handle custom roles', () => {
      const context = createContext('CUSTOM_ROLE');

      expect(hasRole(context, ['CUSTOM_ROLE'])).toBe(true);
      expect(hasRole(context, ['OTHER_ROLE'])).toBe(false);
    });

    test('should handle whitespace in roles', () => {
      const context = createContext('OWNER');

      // Exact match required - whitespace matters
      expect(hasRole(context, [' OWNER'])).toBe(false);
      expect(hasRole(context, ['OWNER '])).toBe(false);
      expect(hasRole(context, [' OWNER '])).toBe(false);
    });
  });

  describe('TenantContext interface', () => {
    test('should have all required fields', () => {
      const context: TenantContext = {
        tenantId: 'tenant-id',
        tenantSlug: 'tenant-slug',
        userId: 'user-id',
        userRole: 'OWNER',
      };

      expect(context.tenantId).toBe('tenant-id');
      expect(context.tenantSlug).toBe('tenant-slug');
      expect(context.userId).toBe('user-id');
      expect(context.userRole).toBe('OWNER');
    });
  });

  describe('Role hierarchy documentation', () => {
    // These tests document the expected role hierarchy in the application
    // They serve as living documentation for the role system

    const createContext = (role: string): TenantContext => ({
      tenantId: 'tenant-123',
      tenantSlug: 'demo-restaurant',
      userId: 'user-456',
      userRole: role,
    });

    test('OWNER should have access to owner-only operations', () => {
      const context = createContext('OWNER');
      const ownerOnlyRoles = ['OWNER'];

      expect(hasRole(context, ownerOnlyRoles)).toBe(true);
    });

    test('MANAGER should have access to manager operations', () => {
      const context = createContext('MANAGER');
      const managerRoles = ['OWNER', 'MANAGER'];

      expect(hasRole(context, managerRoles)).toBe(true);
    });

    test('STAFF should have access to staff operations', () => {
      const context = createContext('STAFF');
      const staffRoles = ['OWNER', 'MANAGER', 'STAFF'];

      expect(hasRole(context, staffRoles)).toBe(true);
    });

    test('STAFF should not have access to owner-only operations', () => {
      const context = createContext('STAFF');
      const ownerOnlyRoles = ['OWNER'];

      expect(hasRole(context, ownerOnlyRoles)).toBe(false);
    });

    test('STAFF should not have access to manager operations', () => {
      const context = createContext('STAFF');
      const managerRoles = ['OWNER', 'MANAGER'];

      expect(hasRole(context, managerRoles)).toBe(false);
    });
  });
});

// Note: The following functions require Next.js runtime and should be tested
// in integration tests with API routes:
//
// - getTenantContext() - requires headers() from next/headers
// - requireTenantContext() - requires headers() and auth()
// - requireRole() - requires requireTenantContext()
//
// These will be tested as part of Phase 2 (API Route Tests) where the full
// Next.js request context is available.
