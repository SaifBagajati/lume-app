/**
 * Test Setup for Customer App
 *
 * This file is preloaded before any tests run to set up mocks for modules
 * that have dependencies on Next.js runtime features.
 */

import { mock } from 'bun:test';

// Mock next/headers
mock.module('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => null,
    has: (name: string) => false,
  }),
  cookies: async () => ({
    get: (name: string) => undefined,
    has: (name: string) => false,
  }),
}));

// Mock next/navigation
mock.module('next/navigation', () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
  }),
  usePathname: () => '/test-restaurant/menu',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ tenantSlug: 'test-restaurant' }),
}));

// Mock next/image
mock.module('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => {
    return { type: 'img', props: { src, alt, ...props } };
  },
}));

// Mock next-auth
mock.module('next-auth', () => ({
  default: () => ({}),
}));

// Mock @prisma/client
mock.module('@prisma/client', () => ({
  PrismaClient: class {
    constructor() {
      return {
        $connect: async () => {},
        $disconnect: async () => {},
      };
    }
  },
}));

console.log('[test-setup] Customer app mocks initialized');
