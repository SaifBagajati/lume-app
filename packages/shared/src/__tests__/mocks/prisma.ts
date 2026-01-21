/**
 * Prisma Mock for Testing
 *
 * This module provides a mock Prisma client for unit testing API routes
 * without requiring a database connection.
 *
 * Usage:
 * ```typescript
 * import { createMockPrisma, type MockPrismaClient } from '@lume-app/shared/__tests__/mocks/prisma';
 *
 * const mockPrisma = createMockPrisma();
 * mockPrisma.restaurantTable.findMany.mockResolvedValue([...]);
 * ```
 */

export interface MockPrismaClient {
  restaurantTable: {
    findMany: ReturnType<typeof createMockFn>;
    findUnique: ReturnType<typeof createMockFn>;
    findFirst: ReturnType<typeof createMockFn>;
    create: ReturnType<typeof createMockFn>;
    update: ReturnType<typeof createMockFn>;
    delete: ReturnType<typeof createMockFn>;
    count: ReturnType<typeof createMockFn>;
  };
  user: {
    findUnique: ReturnType<typeof createMockFn>;
    findFirst: ReturnType<typeof createMockFn>;
    create: ReturnType<typeof createMockFn>;
    update: ReturnType<typeof createMockFn>;
    delete: ReturnType<typeof createMockFn>;
  };
  tenant: {
    findUnique: ReturnType<typeof createMockFn>;
    findFirst: ReturnType<typeof createMockFn>;
    create: ReturnType<typeof createMockFn>;
    update: ReturnType<typeof createMockFn>;
  };
  menuCategory: {
    findMany: ReturnType<typeof createMockFn>;
    findUnique: ReturnType<typeof createMockFn>;
    create: ReturnType<typeof createMockFn>;
    update: ReturnType<typeof createMockFn>;
    delete: ReturnType<typeof createMockFn>;
  };
  menuItem: {
    findMany: ReturnType<typeof createMockFn>;
    findUnique: ReturnType<typeof createMockFn>;
    create: ReturnType<typeof createMockFn>;
    update: ReturnType<typeof createMockFn>;
    delete: ReturnType<typeof createMockFn>;
  };
  order: {
    findMany: ReturnType<typeof createMockFn>;
    findUnique: ReturnType<typeof createMockFn>;
    findFirst: ReturnType<typeof createMockFn>;
    create: ReturnType<typeof createMockFn>;
    update: ReturnType<typeof createMockFn>;
  };
  orderItem: {
    findMany: ReturnType<typeof createMockFn>;
    create: ReturnType<typeof createMockFn>;
    createMany: ReturnType<typeof createMockFn>;
  };
  $transaction: ReturnType<typeof createMockFn>;
  $executeRaw: ReturnType<typeof createMockFn>;
}

interface MockFn<T = unknown> {
  (...args: unknown[]): Promise<T>;
  mockResolvedValue: (value: T) => MockFn<T>;
  mockResolvedValueOnce: (value: T) => MockFn<T>;
  mockRejectedValue: (error: Error) => MockFn<T>;
  mockRejectedValueOnce: (error: Error) => MockFn<T>;
  mockImplementation: (fn: (...args: unknown[]) => T | Promise<T>) => MockFn<T>;
  mock: {
    calls: unknown[][];
    results: { type: 'return' | 'throw'; value: T | Error }[];
  };
  mockClear: () => void;
}

function createMockFn<T = unknown>(): MockFn<T> {
  let resolvedValue: T | undefined;
  let rejectedError: Error | undefined;
  let implementation: ((...args: unknown[]) => T | Promise<T>) | undefined;

  // Queue for mockResolvedValueOnce / mockRejectedValueOnce
  const onceQueue: Array<{ type: 'resolve' | 'reject'; value: T | Error }> = [];

  const mock = {
    calls: [] as unknown[][],
    results: [] as { type: 'return' | 'throw'; value: T | Error }[],
  };

  const fn = async (...args: unknown[]): Promise<T> => {
    mock.calls.push(args);

    // Check if there's a one-time value in the queue
    if (onceQueue.length > 0) {
      const once = onceQueue.shift()!;
      if (once.type === 'reject') {
        mock.results.push({ type: 'throw', value: once.value });
        throw once.value;
      }
      mock.results.push({ type: 'return', value: once.value as T });
      return once.value as T;
    }

    if (rejectedError) {
      mock.results.push({ type: 'throw', value: rejectedError });
      throw rejectedError;
    }

    if (implementation) {
      const result = await implementation(...args);
      mock.results.push({ type: 'return', value: result });
      return result;
    }

    mock.results.push({ type: 'return', value: resolvedValue as T });
    return resolvedValue as T;
  };

  fn.mockResolvedValue = (value: T): MockFn<T> => {
    resolvedValue = value;
    rejectedError = undefined;
    implementation = undefined;
    return fn as MockFn<T>;
  };

  fn.mockResolvedValueOnce = (value: T): MockFn<T> => {
    onceQueue.push({ type: 'resolve', value });
    return fn as MockFn<T>;
  };

  fn.mockRejectedValue = (error: Error): MockFn<T> => {
    rejectedError = error;
    resolvedValue = undefined;
    implementation = undefined;
    return fn as MockFn<T>;
  };

  fn.mockRejectedValueOnce = (error: Error): MockFn<T> => {
    onceQueue.push({ type: 'reject', value: error });
    return fn as MockFn<T>;
  };

  fn.mockImplementation = (
    impl: (...args: unknown[]) => T | Promise<T>
  ): MockFn<T> => {
    implementation = impl;
    resolvedValue = undefined;
    rejectedError = undefined;
    return fn as MockFn<T>;
  };

  fn.mock = mock;

  fn.mockClear = () => {
    mock.calls = [];
    mock.results = [];
    onceQueue.length = 0;
  };

  return fn as MockFn<T>;
}

export function createMockPrisma(): MockPrismaClient {
  return {
    restaurantTable: {
      findMany: createMockFn(),
      findUnique: createMockFn(),
      findFirst: createMockFn(),
      create: createMockFn(),
      update: createMockFn(),
      delete: createMockFn(),
      count: createMockFn(),
    },
    user: {
      findUnique: createMockFn(),
      findFirst: createMockFn(),
      create: createMockFn(),
      update: createMockFn(),
      delete: createMockFn(),
    },
    tenant: {
      findUnique: createMockFn(),
      findFirst: createMockFn(),
      create: createMockFn(),
      update: createMockFn(),
    },
    menuCategory: {
      findMany: createMockFn(),
      findUnique: createMockFn(),
      create: createMockFn(),
      update: createMockFn(),
      delete: createMockFn(),
    },
    menuItem: {
      findMany: createMockFn(),
      findUnique: createMockFn(),
      create: createMockFn(),
      update: createMockFn(),
      delete: createMockFn(),
    },
    order: {
      findMany: createMockFn(),
      findUnique: createMockFn(),
      findFirst: createMockFn(),
      create: createMockFn(),
      update: createMockFn(),
    },
    orderItem: {
      findMany: createMockFn(),
      create: createMockFn(),
      createMany: createMockFn(),
    },
    $transaction: createMockFn(),
    $executeRaw: createMockFn(),
  };
}

/**
 * Reset all mocks in the Prisma client
 */
export function resetMockPrisma(mockPrisma: MockPrismaClient): void {
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === 'function' && 'mockClear' in method) {
          (method as MockFn).mockClear();
        }
      });
    }
  });
}
