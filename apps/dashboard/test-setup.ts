/**
 * Test Setup for Dashboard App
 *
 * This file is preloaded before any tests run to set up mocks for modules
 * that have dependencies on Next.js runtime features.
 */

import { mock } from 'bun:test';

// Mock next/headers which is used by tenantContext.ts
mock.module('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => null,
    has: (name: string) => false,
    entries: () => [],
    keys: () => [],
    values: () => [],
    forEach: () => {},
  }),
  cookies: async () => ({
    get: (name: string) => undefined,
    has: (name: string) => false,
    getAll: () => [],
  }),
}));

// Mock next-auth to prevent import issues
mock.module('next-auth', () => ({
  default: () => ({
    handlers: { GET: () => {}, POST: () => {} },
    auth: async () => null,
    signIn: async () => {},
    signOut: async () => {},
  }),
}));

// Mock @auth/prisma-adapter if it's used
mock.module('@auth/prisma-adapter', () => ({
  PrismaAdapter: () => ({}),
}));

// Mock @prisma/client
const mockPrismaClient = {
  restaurantTable: {
    findMany: async () => [],
    findUnique: async () => null,
    findFirst: async () => null,
    create: async (data: unknown) => data,
    update: async (data: unknown) => data,
    delete: async () => ({}),
  },
  user: {
    findUnique: async () => null,
    findFirst: async () => null,
    create: async (data: unknown) => data,
    update: async (data: unknown) => data,
  },
  tenant: {
    findUnique: async () => null,
    findFirst: async () => null,
  },
  $connect: async () => {},
  $disconnect: async () => {},
};

mock.module('@prisma/client', () => ({
  PrismaClient: class {
    constructor() {
      return mockPrismaClient;
    }
  },
}));

// Note: The actual prisma mock for tests will be provided in the test files
// This is just to prevent import errors during module resolution

console.log('[test-setup] Mocks initialized for Next.js and Prisma modules');
