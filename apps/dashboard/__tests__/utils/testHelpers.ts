/**
 * Test Helpers for Dashboard API Routes
 *
 * Utilities for creating mock requests and testing API route handlers.
 */

import { NextRequest } from 'next/server';

interface CreateMockRequestOptions {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(options: CreateMockRequestOptions = {}): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3001/api/test',
    headers = {},
    body,
  } = options;

  const requestInit: RequestInit = {
    method,
    headers: new Headers(headers),
  };

  if (body && method !== 'GET' && method !== 'HEAD') {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(url, requestInit);
}

/**
 * Create tenant context headers for authenticated requests
 */
export function createTenantHeaders(
  tenantId: string,
  userId: string,
  role: string = 'OWNER',
  tenantSlug: string = 'test-restaurant'
): Record<string, string> {
  return {
    'x-tenant-id': tenantId,
    'x-tenant-slug': tenantSlug,
    'x-user-id': userId,
    'x-user-role': role,
  };
}

/**
 * Create a mock table for testing
 */
export function createMockTable(overrides: Partial<MockTable> = {}): MockTable {
  return {
    id: 'table-123',
    number: '1',
    qrCode: 'table-abc-123',
    active: true,
    tenantId: 'tenant-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

interface MockTable {
  id: string;
  number: string;
  qrCode: string;
  active: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  orders?: MockOrder[];
}

interface MockOrder {
  id: string;
  status: string;
  tableId: string;
  tenantId: string;
}

/**
 * Create a mock user for testing
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user-123',
    email: 'owner@test-restaurant.com',
    name: 'Test Owner',
    password: '$2a$12$hashedpassword', // Fake bcrypt hash
    role: 'OWNER',
    tenantId: 'tenant-123',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

interface MockUser {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
  tenantId: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extract JSON body from a Response
 */
export async function getResponseBody<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

/**
 * Assert that a response has the expected status and body
 */
export async function assertResponse(
  response: Response,
  expectedStatus: number,
  expectedBody?: Record<string, unknown>
): Promise<void> {
  if (response.status !== expectedStatus) {
    const body = await response.json().catch(() => 'Unable to parse body');
    throw new Error(
      `Expected status ${expectedStatus} but got ${response.status}. Body: ${JSON.stringify(body)}`
    );
  }

  if (expectedBody) {
    const actualBody = await response.json();
    const expectedKeys = Object.keys(expectedBody);
    for (const key of expectedKeys) {
      if (actualBody[key] !== expectedBody[key]) {
        throw new Error(
          `Expected body.${key} to be ${JSON.stringify(expectedBody[key])} but got ${JSON.stringify(actualBody[key])}`
        );
      }
    }
  }
}
