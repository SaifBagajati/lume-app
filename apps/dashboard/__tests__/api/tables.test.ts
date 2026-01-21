import { describe, test, expect, beforeEach, mock } from 'bun:test';
import {
  createMockRequest,
  createTenantHeaders,
  createMockTable,
} from '../utils/testHelpers';
import {
  createMockPrisma,
  resetMockPrisma,
  type MockPrismaClient,
} from '../../../../packages/shared/src/__tests__/mocks/prisma';

// Create mock prisma before mocking the module
const mockPrisma = createMockPrisma();

// Mock next/headers before any imports that might use it
mock.module('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => null,
  }),
  cookies: async () => ({
    get: (name: string) => null,
  }),
}));

// Mock next-auth to prevent import issues
mock.module('next-auth', () => ({
  default: () => ({}),
}));

mock.module('../../../packages/shared/src/auth', () => ({
  auth: async () => null,
}));

// Mock the @lume-app/shared module with all needed exports
mock.module('@lume-app/shared', () => ({
  prisma: mockPrisma,
  auth: async () => null,
  getTenantContext: async () => null,
  requireTenantContext: async () => {
    throw new Error('Unauthorized');
  },
}));

// Import after mocking
import { GET, POST } from '../../app/api/tables/route';

describe('Tables API - /api/tables', () => {
  beforeEach(() => {
    resetMockPrisma(mockPrisma);
  });

  describe('GET /api/tables', () => {
    test('should return 401 when no tenant context', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/tables',
      });

      const response = await GET(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized - No tenant context');
    });

    test('should return tables for authenticated tenant', async () => {
      const tenantId = 'tenant-123';
      const mockTables = [
        createMockTable({ id: 'table-1', number: '1', tenantId }),
        createMockTable({ id: 'table-2', number: '2', tenantId }),
      ];

      mockPrisma.restaurantTable.findMany.mockResolvedValue(mockTables);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/tables',
        headers: createTenantHeaders(tenantId, 'user-123'),
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveLength(2);
      expect(body[0].id).toBe('table-1');
      expect(body[1].id).toBe('table-2');
    });

    test('should return empty array when no tables exist', async () => {
      const tenantId = 'tenant-123';
      mockPrisma.restaurantTable.findMany.mockResolvedValue([]);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/tables',
        headers: createTenantHeaders(tenantId, 'user-123'),
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual([]);
    });

    test('should query with correct tenantId for isolation', async () => {
      const tenantId = 'tenant-abc';
      mockPrisma.restaurantTable.findMany.mockResolvedValue([]);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/tables',
        headers: createTenantHeaders(tenantId, 'user-123'),
      });

      await GET(request);

      // Verify the query was called with the correct tenantId
      expect(mockPrisma.restaurantTable.findMany.mock.calls[0][0]).toEqual({
        where: { tenantId: 'tenant-abc' },
        orderBy: { number: 'asc' },
      });
    });

    test('should return 500 when database error occurs', async () => {
      const tenantId = 'tenant-123';
      mockPrisma.restaurantTable.findMany.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/tables',
        headers: createTenantHeaders(tenantId, 'user-123'),
      });

      const response = await GET(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to fetch tables');
    });
  });

  describe('POST /api/tables', () => {
    test('should return 401 when no tenant context', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/tables',
        body: { number: '1' },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized - No tenant context');
    });

    test('should return 400 when table number is missing', async () => {
      const tenantId = 'tenant-123';
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/tables',
        headers: createTenantHeaders(tenantId, 'user-123'),
        body: {},
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Table number is required');
    });

    test('should return 409 when table number already exists', async () => {
      const tenantId = 'tenant-123';
      mockPrisma.restaurantTable.findFirst.mockResolvedValue(
        createMockTable({ number: '1', tenantId })
      );

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/tables',
        headers: createTenantHeaders(tenantId, 'user-123'),
        body: { number: '1' },
      });

      const response = await POST(request);

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.error).toBe('Table number already exists');
    });

    test('should create table with auto-generated QR code', async () => {
      const tenantId = 'tenant-123';
      mockPrisma.restaurantTable.findFirst.mockResolvedValue(null);

      const createdTable = createMockTable({
        number: '5',
        tenantId,
        qrCode: 'table-uuid-generated',
      });
      mockPrisma.restaurantTable.create.mockResolvedValue(createdTable);

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/tables',
        headers: createTenantHeaders(tenantId, 'user-123'),
        body: { number: '5' },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.number).toBe('5');
      expect(body.qrCode).toBeDefined();
    });

    test('should create table with correct tenantId', async () => {
      const tenantId = 'tenant-specific-123';
      mockPrisma.restaurantTable.findFirst.mockResolvedValue(null);
      mockPrisma.restaurantTable.create.mockResolvedValue(
        createMockTable({ tenantId })
      );

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/tables',
        headers: createTenantHeaders(tenantId, 'user-123'),
        body: { number: '1' },
      });

      await POST(request);

      // Verify tenantId was included in the create call
      const createCall = mockPrisma.restaurantTable.create.mock.calls[0][0];
      expect(createCall.data.tenantId).toBe(tenantId);
    });

    test('should create table with active status defaulting to true', async () => {
      const tenantId = 'tenant-123';
      mockPrisma.restaurantTable.findFirst.mockResolvedValue(null);
      mockPrisma.restaurantTable.create.mockResolvedValue(
        createMockTable({ active: true })
      );

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/tables',
        headers: createTenantHeaders(tenantId, 'user-123'),
        body: { number: '1' },
      });

      await POST(request);

      const createCall = mockPrisma.restaurantTable.create.mock.calls[0][0];
      expect(createCall.data.active).toBe(true);
    });

    test('should allow setting active to false', async () => {
      const tenantId = 'tenant-123';
      mockPrisma.restaurantTable.findFirst.mockResolvedValue(null);
      mockPrisma.restaurantTable.create.mockResolvedValue(
        createMockTable({ active: false })
      );

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/tables',
        headers: createTenantHeaders(tenantId, 'user-123'),
        body: { number: '1', active: false },
      });

      await POST(request);

      const createCall = mockPrisma.restaurantTable.create.mock.calls[0][0];
      expect(createCall.data.active).toBe(false);
    });

    test('should return 500 when database error occurs', async () => {
      const tenantId = 'tenant-123';
      mockPrisma.restaurantTable.findFirst.mockResolvedValue(null);
      mockPrisma.restaurantTable.create.mockRejectedValue(
        new Error('Database error')
      );

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/tables',
        headers: createTenantHeaders(tenantId, 'user-123'),
        body: { number: '1' },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to create table');
    });
  });
});
