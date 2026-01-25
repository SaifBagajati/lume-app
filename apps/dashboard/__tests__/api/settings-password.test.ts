import { describe, test, expect, beforeEach, beforeAll, mock } from 'bun:test';
import {
  createMockPrisma,
  resetMockPrisma,
} from '../../../../packages/shared/src/__tests__/mocks/prisma';
import { hash } from 'bcryptjs';

// Create mock prisma before mocking the module
const mockPrisma = createMockPrisma();

// Track if requireTenantContext should throw
let shouldThrowUnauthorized = false;
let mockTenantContext = {
  tenantId: 'tenant-123',
  tenantSlug: 'test-restaurant',
  userId: 'user-123',
  userRole: 'OWNER',
};

// Mock modules BEFORE any dynamic imports
mock.module('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => null,
  }),
  cookies: async () => ({
    get: (name: string) => null,
  }),
}));

mock.module('next-auth', () => ({
  default: () => ({}),
}));

mock.module('@lume-app/shared', () => ({
  prisma: mockPrisma,
  requireTenantContext: async () => {
    if (shouldThrowUnauthorized) {
      throw new Error('Unauthorized: No tenant context available');
    }
    return mockTenantContext;
  },
}));

// Module references - populated in beforeAll
let POST: (request: Request) => Promise<Response>;
let createMockRequest: (options?: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
}) => Request;
let createTenantHeaders: (tenantId: string, userId: string) => Record<string, string>;
let createMockUser: (overrides?: Record<string, unknown>) => Record<string, unknown>;

describe('Settings Password API - /api/settings/password', () => {
  beforeAll(async () => {
    // Dynamic imports after mocks are set up
    const routeModule = await import('../../app/api/settings/password/route');
    POST = routeModule.POST;

    const helpersModule = await import('../utils/testHelpers');
    createMockRequest = helpersModule.createMockRequest;
    createTenantHeaders = helpersModule.createTenantHeaders;
    createMockUser = helpersModule.createMockUser;
  });

  beforeEach(async () => {
    resetMockPrisma(mockPrisma);
    shouldThrowUnauthorized = false;
    mockTenantContext = {
      tenantId: 'tenant-123',
      tenantSlug: 'test-restaurant',
      userId: 'user-123',
      userRole: 'OWNER',
    };
  });

  describe('POST /api/settings/password', () => {
    test('should return error when no tenant context', async () => {
      shouldThrowUnauthorized = true;

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/settings/password',
        body: { currentPassword: 'old', newPassword: 'newpassword123' },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    test('should return 400 when current password missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/settings/password',
        headers: createTenantHeaders('tenant-123', 'user-123'),
        body: { newPassword: 'newpassword123' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Current password and new password are required');
    });

    test('should return 400 when new password missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/settings/password',
        headers: createTenantHeaders('tenant-123', 'user-123'),
        body: { currentPassword: 'currentpass' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Current password and new password are required');
    });

    test('should return 400 when new password too short', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/settings/password',
        headers: createTenantHeaders('tenant-123', 'user-123'),
        body: { currentPassword: 'currentpass', newPassword: 'short' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('New password must be at least 8 characters long');
    });

    test('should return 404 when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/settings/password',
        headers: createTenantHeaders('tenant-123', 'user-123'),
        body: { currentPassword: 'currentpass', newPassword: 'newpassword123' },
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('User not found');
    });

    test('should return 401 when current password incorrect', async () => {
      // Hash a different password than what we'll send
      const hashedPassword = await hash('differentpassword', 10);
      const mockUser = createMockUser({ password: hashedPassword });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/settings/password',
        headers: createTenantHeaders('tenant-123', 'user-123'),
        body: { currentPassword: 'wrongpassword', newPassword: 'newpassword123' },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Current password is incorrect');
    });

    test('should update password successfully', async () => {
      // Hash the current password
      const currentPassword = 'correctpassword';
      const hashedPassword = await hash(currentPassword, 10);
      const mockUser = createMockUser({ password: hashedPassword });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, password: 'newhash' });

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/settings/password',
        headers: createTenantHeaders('tenant-123', 'user-123'),
        body: { currentPassword, newPassword: 'newpassword123' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe('Password updated successfully');
    });

    test('should hash new password before storing', async () => {
      const currentPassword = 'correctpassword';
      const hashedPassword = await hash(currentPassword, 10);
      const mockUser = createMockUser({ password: hashedPassword });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/settings/password',
        headers: createTenantHeaders('tenant-123', 'user-123'),
        body: { currentPassword, newPassword: 'newpassword123' },
      });

      await POST(request);

      // Verify update was called
      expect(mockPrisma.user.update.mock.calls.length).toBe(1);

      // Verify the password was hashed (not stored as plaintext)
      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data.password).not.toBe('newpassword123');
      // bcrypt hashes start with $2
      expect(updateCall.data.password).toMatch(/^\$2[ab]\$/);
    });

    test('should query user by userId from context', async () => {
      mockTenantContext.userId = 'specific-user-id';
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/settings/password',
        headers: createTenantHeaders('tenant-123', 'specific-user-id'),
        body: { currentPassword: 'pass', newPassword: 'newpassword123' },
      });

      await POST(request);

      // Verify user lookup used userId from context
      expect(mockPrisma.user.findUnique.mock.calls[0][0]).toEqual({
        where: { id: 'specific-user-id' },
        select: { id: true, password: true },
      });
    });
  });
});
