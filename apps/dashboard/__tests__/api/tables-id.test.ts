import { describe, test, expect, beforeEach, mock } from 'bun:test';
import {
  createMockRequest,
  createTenantHeaders,
  createMockTable,
} from '../utils/testHelpers';
import {
  createMockPrisma,
  resetMockPrisma,
} from '../../../../packages/shared/src/__tests__/mocks/prisma';

// Create mock prisma before mocking the module
const mockPrisma = createMockPrisma();

// Mock the @lume-app/shared module
mock.module('@lume-app/shared', () => ({
  prisma: mockPrisma,
}));

// Import after mocking
import { GET, PATCH, DELETE } from '../../app/api/tables/[id]/route';

// Helper to create params object as Next.js 15 expects
const createParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('Tables API - /api/tables/[id]', () => {
  beforeEach(() => {
    resetMockPrisma(mockPrisma);
  });

  describe('GET /api/tables/[id]', () => {
    test('should return 401 when no tenant context', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/tables/table-123',
      });

      const response = await GET(request, createParams('table-123'));

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized - No tenant context');
    });

    test('should return 404 when table not found', async () => {
      const tenantId = 'tenant-123';
      mockPrisma.restaurantTable.findFirst.mockResolvedValue(null);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/tables/nonexistent',
        headers: createTenantHeaders(tenantId, 'user-123'),
      });

      const response = await GET(request, createParams('nonexistent'));

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Table not found');
    });

    test('should return 404 when table belongs to different tenant', async () => {
      const tenantId = 'tenant-123';
      // Table exists but with different tenantId - findFirst returns null due to where clause
      mockPrisma.restaurantTable.findFirst.mockResolvedValue(null);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/tables/table-456',
        headers: createTenantHeaders(tenantId, 'user-123'),
      });

      const response = await GET(request, createParams('table-456'));

      expect(response.status).toBe(404);

      // Verify query included tenantId for isolation
      expect(mockPrisma.restaurantTable.findFirst.mock.calls[0][0]).toEqual({
        where: {
          id: 'table-456',
          tenantId: 'tenant-123',
        },
      });
    });

    test('should return table data for valid request', async () => {
      const tenantId = 'tenant-123';
      const mockTable = createMockTable({
        id: 'table-456',
        number: '5',
        tenantId,
      });
      mockPrisma.restaurantTable.findFirst.mockResolvedValue(mockTable);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/tables/table-456',
        headers: createTenantHeaders(tenantId, 'user-123'),
      });

      const response = await GET(request, createParams('table-456'));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.id).toBe('table-456');
      expect(body.number).toBe('5');
    });
  });

  describe('PATCH /api/tables/[id]', () => {
    test('should return 401 when no tenant context', async () => {
      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3001/api/tables/table-123',
        body: { active: false },
      });

      const response = await PATCH(request, createParams('table-123'));

      expect(response.status).toBe(401);
    });

    test('should return 404 when table not found', async () => {
      const tenantId = 'tenant-123';
      mockPrisma.restaurantTable.findFirst.mockResolvedValue(null);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3001/api/tables/nonexistent',
        headers: createTenantHeaders(tenantId, 'user-123'),
        body: { active: false },
      });

      const response = await PATCH(request, createParams('nonexistent'));

      expect(response.status).toBe(404);
    });

    test('should update table active status', async () => {
      const tenantId = 'tenant-123';
      const existingTable = createMockTable({ tenantId, active: true });
      const updatedTable = { ...existingTable, active: false };

      mockPrisma.restaurantTable.findFirst.mockResolvedValue(existingTable);
      mockPrisma.restaurantTable.update.mockResolvedValue(updatedTable);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3001/api/tables/table-123',
        headers: createTenantHeaders(tenantId, 'user-123'),
        body: { active: false },
      });

      const response = await PATCH(request, createParams('table-123'));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.active).toBe(false);
    });

    test('should update table number', async () => {
      const tenantId = 'tenant-123';
      const existingTable = createMockTable({ tenantId, number: '1' });
      const updatedTable = { ...existingTable, number: '10' };

      mockPrisma.restaurantTable.findFirst
        .mockResolvedValueOnce(existingTable) // First call: verify table exists
        .mockResolvedValueOnce(null); // Second call: check for duplicate
      mockPrisma.restaurantTable.update.mockResolvedValue(updatedTable);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3001/api/tables/table-123',
        headers: createTenantHeaders(tenantId, 'user-123'),
        body: { number: '10' },
      });

      const response = await PATCH(request, createParams('table-123'));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.number).toBe('10');
    });

    test('should return 409 when updating to existing table number', async () => {
      const tenantId = 'tenant-123';
      const existingTable = createMockTable({
        id: 'table-123',
        tenantId,
        number: '1',
      });
      const duplicateTable = createMockTable({
        id: 'table-456',
        tenantId,
        number: '2',
      });

      mockPrisma.restaurantTable.findFirst
        .mockResolvedValueOnce(existingTable) // First call: verify table exists
        .mockResolvedValueOnce(duplicateTable); // Second call: finds duplicate

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3001/api/tables/table-123',
        headers: createTenantHeaders(tenantId, 'user-123'),
        body: { number: '2' },
      });

      const response = await PATCH(request, createParams('table-123'));

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.error).toBe('Table number already exists');
    });

    test('should allow keeping the same table number', async () => {
      const tenantId = 'tenant-123';
      const existingTable = createMockTable({ tenantId, number: '1' });

      mockPrisma.restaurantTable.findFirst.mockResolvedValue(existingTable);
      mockPrisma.restaurantTable.update.mockResolvedValue(existingTable);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3001/api/tables/table-123',
        headers: createTenantHeaders(tenantId, 'user-123'),
        body: { number: '1', active: true },
      });

      const response = await PATCH(request, createParams('table-123'));

      // Should not check for duplicates when number is unchanged
      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/tables/[id]', () => {
    test('should return 401 when no tenant context', async () => {
      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3001/api/tables/table-123',
      });

      const response = await DELETE(request, createParams('table-123'));

      expect(response.status).toBe(401);
    });

    test('should return 404 when table not found', async () => {
      const tenantId = 'tenant-123';
      mockPrisma.restaurantTable.findFirst.mockResolvedValue(null);

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3001/api/tables/nonexistent',
        headers: createTenantHeaders(tenantId, 'user-123'),
      });

      const response = await DELETE(request, createParams('nonexistent'));

      expect(response.status).toBe(404);
    });

    test('should delete table and return success', async () => {
      const tenantId = 'tenant-123';
      const existingTable = createMockTable({ tenantId, orders: [] });

      mockPrisma.restaurantTable.findFirst.mockResolvedValue(existingTable);
      mockPrisma.restaurantTable.delete.mockResolvedValue(existingTable);

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3001/api/tables/table-123',
        headers: createTenantHeaders(tenantId, 'user-123'),
      });

      const response = await DELETE(request, createParams('table-123'));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    test('should not delete table with existing orders', async () => {
      const tenantId = 'tenant-123';
      const tableWithOrders = createMockTable({
        tenantId,
        orders: [{ id: 'order-1', status: 'PENDING', tableId: 'table-123', tenantId }],
      });

      mockPrisma.restaurantTable.findFirst.mockResolvedValue(tableWithOrders);

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3001/api/tables/table-123',
        headers: createTenantHeaders(tenantId, 'user-123'),
      });

      const response = await DELETE(request, createParams('table-123'));

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.error).toContain('Cannot delete table with existing orders');
    });

    test('should verify tenant isolation when deleting', async () => {
      const tenantId = 'tenant-123';
      mockPrisma.restaurantTable.findFirst.mockResolvedValue(null);

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3001/api/tables/table-from-other-tenant',
        headers: createTenantHeaders(tenantId, 'user-123'),
      });

      await DELETE(request, createParams('table-from-other-tenant'));

      // Verify query included tenantId
      expect(mockPrisma.restaurantTable.findFirst.mock.calls[0][0].where).toEqual({
        id: 'table-from-other-tenant',
        tenantId: 'tenant-123',
      });
    });
  });
});
