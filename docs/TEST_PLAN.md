# Lume Test Improvement Plan

This document outlines the phased approach to improving test coverage for the Lume application.

## Current State

- **Framework**: Bun native test runner
- **Current Coverage**: ~12-15% (only `packages/shared` POS integrations tested)
- **Existing Tests**: 7 test files, 1,804 lines, 94 tests (92 passing)

## Phase Overview

| Phase | Focus | Priority | Estimated Tests |
|-------|-------|----------|-----------------|
| 1 | Security-critical unit tests | **Critical** | ~25 tests |
| 2 | API route tests | **High** | ~40 tests |
| 3 | Testing infrastructure for apps | **High** | Infrastructure |
| 4 | React component tests | **Medium** | ~30 tests |
| 5 | E2E tests with Playwright | **Medium** | ~15 tests |
| 6 | Coverage reporting & CI/CD | **Medium** | Infrastructure |

---

## Phase 1: Security-Critical Unit Tests

**Goal**: Test authentication, authorization, and security utilities that protect multi-tenant data isolation.

### 1.1 Password Utilities (`password.test.ts`)

**File**: `packages/shared/src/__tests__/password.test.ts`

```typescript
// Tests to implement:
describe('hashPassword', () => {
  test('should hash a password with bcrypt')
  test('should produce different hashes for same password (salting)')
  test('should handle empty string')
  test('should handle unicode characters')
  test('should handle very long passwords')
});

describe('verifyPassword', () => {
  test('should return true for correct password')
  test('should return false for incorrect password')
  test('should return false for empty password against hash')
  test('should handle timing-safe comparison')
});
```

**Estimated**: 8 tests

### 1.2 Two-Factor Authentication (`twoFactor.test.ts`)

**File**: `packages/shared/src/__tests__/twoFactor.test.ts`

```typescript
// Tests to implement:
describe('generateTwoFactorSecret', () => {
  test('should generate a valid secret')
  test('should generate unique secrets each time')
  test('should include email in URI')
  test('should include app name in URI')
  test('should generate valid QR code data URL')
});

describe('verifyTwoFactorToken', () => {
  test('should return true for valid token')
  test('should return false for invalid token')
  test('should return false for expired token')
  test('should handle malformed tokens gracefully')
  test('should handle empty token')
});

describe('generateTwoFactorToken', () => {
  test('should generate 6-digit token')
  test('should generate valid token that passes verification')
});
```

**Estimated**: 12 tests

### 1.3 Tenant Context (`tenantContext.test.ts`)

**File**: `packages/shared/src/__tests__/tenantContext.test.ts`

> **Note**: These functions depend on Next.js `headers()` and `auth()`. We'll need to mock these dependencies.

```typescript
// Tests to implement:
describe('hasRole', () => {
  test('should return true when user has allowed role')
  test('should return false when user does not have allowed role')
  test('should handle multiple allowed roles')
  test('should be case-sensitive for role matching')
});

// Integration tests (with mocked headers/auth):
describe('getTenantContext', () => {
  test('should return context from headers when all present')
  test('should return null when headers missing and no session')
  test('should fallback to session when headers incomplete')
});

describe('requireTenantContext', () => {
  test('should return context when authenticated')
  test('should throw "Unauthorized" when not authenticated')
});

describe('requireRole', () => {
  test('should return context when user has required role')
  test('should throw "Forbidden" when user lacks required role')
});
```

**Estimated**: 10 tests

---

## Phase 2: API Route Tests

**Goal**: Test all dashboard API routes for correct behavior, authorization, and tenant isolation.

### 2.1 Test Infrastructure Setup

Create test utilities for API route testing:

**File**: `apps/dashboard/__tests__/utils/testHelpers.ts`

```typescript
// Utilities to create:
- createMockRequest(options) - Create NextRequest with headers
- createTenantHeaders(tenantId, userId, role) - Generate auth headers
- mockPrismaClient() - Create Prisma mock with common operations
```

### 2.2 Tables API (`tables.test.ts`)

**File**: `apps/dashboard/__tests__/api/tables.test.ts`

```typescript
describe('GET /api/tables', () => {
  test('should return 401 when no tenant context')
  test('should return tables for authenticated tenant')
  test('should not return tables from other tenants (isolation)')
  test('should return tables sorted by number')
  test('should return empty array when no tables exist')
});

describe('POST /api/tables', () => {
  test('should return 401 when no tenant context')
  test('should return 400 when table number missing')
  test('should return 409 when table number already exists')
  test('should create table with auto-generated QR code')
  test('should create table with correct tenantId')
  test('should return 201 with created table data')
});
```

**Estimated**: 11 tests

### 2.3 Tables [id] API (`tables-id.test.ts`)

**File**: `apps/dashboard/__tests__/api/tables-id.test.ts`

```typescript
describe('GET /api/tables/[id]', () => {
  test('should return 401 when no tenant context')
  test('should return 404 when table not found')
  test('should return 404 when table belongs to different tenant')
  test('should return table data for valid request')
});

describe('PUT /api/tables/[id]', () => {
  test('should return 401 when no tenant context')
  test('should return 404 when table not found')
  test('should update table number')
  test('should update table active status')
  test('should not allow updating to existing table number')
});

describe('DELETE /api/tables/[id]', () => {
  test('should return 401 when no tenant context')
  test('should return 404 when table not found')
  test('should delete table and return success')
  test('should not delete table from different tenant')
});
```

**Estimated**: 12 tests

### 2.4 Password Settings API (`settings-password.test.ts`)

**File**: `apps/dashboard/__tests__/api/settings-password.test.ts`

```typescript
describe('POST /api/settings/password', () => {
  test('should return 401 when no tenant context')
  test('should return 400 when current password missing')
  test('should return 400 when new password missing')
  test('should return 400 when new password too short')
  test('should return 401 when current password incorrect')
  test('should return 404 when user not found')
  test('should update password successfully')
  test('should hash new password before storing')
});
```

**Estimated**: 8 tests

### 2.5 Auth Routes (`auth.test.ts`)

**File**: `apps/dashboard/__tests__/api/auth.test.ts`

```typescript
describe('POST /api/auth/forgot-password', () => {
  test('should return 400 when email missing')
  test('should return 200 even for non-existent email (security)')
  test('should generate reset token for valid email')
});

describe('POST /api/auth/reset-password', () => {
  test('should return 400 when token missing')
  test('should return 400 when password missing')
  test('should return 400 when token invalid/expired')
  test('should reset password with valid token')
  test('should invalidate token after use')
});
```

**Estimated**: 8 tests

---

## Phase 3: Testing Infrastructure for Apps

**Goal**: Set up testing infrastructure for customer and dashboard apps.

### 3.1 Update Package.json Files

**File**: `apps/customer/package.json`
```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@testing-library/dom": "^10.0.0",
    "happy-dom": "^15.0.0"
  }
}
```

**File**: `apps/dashboard/package.json`
```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@testing-library/dom": "^10.0.0",
    "happy-dom": "^15.0.0"
  }
}
```

### 3.2 Create Test Setup Files

**File**: `apps/customer/bunfig.toml`
```toml
[test]
preload = ["./test-setup.ts"]
```

**File**: `apps/customer/test-setup.ts`
```typescript
import { GlobalRegistrator } from '@happy-dom/global-registrator';
GlobalRegistrator.register();
```

### 3.3 Create Prisma Mock

**File**: `packages/shared/src/__tests__/mocks/prisma.ts`
```typescript
// Reusable Prisma mock for all apps
export function createMockPrisma() {
  return {
    restaurantTable: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    // ... other models
  };
}
```

---

## Phase 4: React Component Tests

**Goal**: Test customer-facing React components for correct rendering and interactions.

### 4.1 MenuItem Component (`MenuItem.test.tsx`)

**File**: `apps/customer/__tests__/components/MenuItem.test.tsx`

```typescript
describe('MenuItem', () => {
  test('should render item name and price')
  test('should render item description')
  test('should render item image when available')
  test('should show placeholder when no image')
  test('should call onClick when clicked')
  test('should display formatted price with currency')
  test('should handle items with modifiers')
});
```

**Estimated**: 7 tests

### 4.2 MenuTabs Component (`MenuTabs.test.tsx`)

**File**: `apps/customer/__tests__/components/MenuTabs.test.tsx`

```typescript
describe('MenuTabs', () => {
  test('should render all category tabs')
  test('should highlight active category')
  test('should call onCategoryChange when tab clicked')
  test('should handle empty categories')
  test('should be horizontally scrollable')
});
```

**Estimated**: 5 tests

### 4.3 OrderModal Component (`OrderModal.test.tsx`)

**File**: `apps/customer/__tests__/components/OrderModal.test.tsx`

```typescript
describe('OrderModal', () => {
  test('should not render when closed')
  test('should render item details when open')
  test('should display quantity selector')
  test('should increment quantity')
  test('should decrement quantity (min 1)')
  test('should render modifier options')
  test('should calculate total with modifiers')
  test('should call onAddToOrder with correct data')
  test('should call onClose when backdrop clicked')
});
```

**Estimated**: 9 tests

### 4.4 ViewOrderButton Component (`ViewOrderButton.test.tsx`)

**File**: `apps/customer/__tests__/components/ViewOrderButton.test.tsx`

```typescript
describe('ViewOrderButton', () => {
  test('should not render when cart empty')
  test('should display item count')
  test('should display total price')
  test('should be fixed to bottom of screen')
  test('should navigate to order review on click')
});
```

**Estimated**: 5 tests

---

## Phase 5: E2E Tests with Playwright

**Goal**: Test critical user flows end-to-end.

### 5.1 Setup Playwright

**Install**:
```bash
bun add -d @playwright/test
npx playwright install chromium
```

**File**: `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'customer',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'dashboard',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3001' },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

### 5.2 Customer Ordering Flow (`customer-ordering.spec.ts`)

**File**: `e2e/customer-ordering.spec.ts`

```typescript
describe('Customer Ordering Flow', () => {
  test('should display menu for valid tenant/table')
  test('should show 404 for invalid tenant')
  test('should add item to cart')
  test('should update quantity in cart')
  test('should remove item from cart')
  test('should navigate to checkout')
  test('should complete order submission')
});
```

**Estimated**: 7 tests

### 5.3 Dashboard Login Flow (`dashboard-login.spec.ts`)

**File**: `e2e/dashboard-login.spec.ts`

```typescript
describe('Dashboard Login Flow', () => {
  test('should show login page for unauthenticated users')
  test('should show error for invalid credentials')
  test('should login successfully with valid credentials')
  test('should prompt for 2FA when enabled')
  test('should redirect to dashboard after login')
  test('should logout and redirect to login')
});
```

**Estimated**: 6 tests

### 5.4 Table Management Flow (`table-management.spec.ts`)

**File**: `e2e/table-management.spec.ts`

```typescript
describe('Table Management', () => {
  test('should display list of tables')
  test('should create new table')
  test('should show error for duplicate table number')
  test('should edit existing table')
  test('should delete table')
  test('should generate QR code for table')
});
```

**Estimated**: 6 tests

---

## Phase 6: Coverage Reporting & CI/CD

**Goal**: Set up code coverage tracking and continuous integration.

### 6.1 Coverage Configuration

**File**: `bunfig.toml` (root)
```toml
[test]
coverage = true
coverageDir = "./coverage"
coverageReporters = ["text", "lcov", "html"]
```

**Update root `package.json`**:
```json
{
  "scripts": {
    "test": "turbo run test",
    "test:coverage": "turbo run test -- --coverage"
  }
}
```

### 6.2 GitHub Actions Workflow

**File**: `.github/workflows/test.yml`
```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Run unit tests
        run: bun test --coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false

  e2e:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install

      - name: Install Playwright browsers
        run: npx playwright install chromium

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### 6.3 Pre-commit Hook (optional)

**File**: `.husky/pre-commit`
```bash
#!/bin/sh
bun test --bail
```

---

## Implementation Order

### Week 1: Phase 1 (Security Tests)
- [ ] `password.test.ts` - 8 tests
- [ ] `twoFactor.test.ts` - 12 tests
- [ ] `tenantContext.test.ts` - 10 tests (hasRole only, others need mocking)

### Week 2: Phase 2 (API Route Tests)
- [ ] Create test helpers (`testHelpers.ts`)
- [ ] Create Prisma mock (`mocks/prisma.ts`)
- [ ] `tables.test.ts` - 11 tests
- [ ] `tables-id.test.ts` - 12 tests
- [ ] `settings-password.test.ts` - 8 tests

### Week 3: Phase 3 & 4 (Infrastructure + Components)
- [ ] Add test scripts to apps
- [ ] Configure happy-dom for React testing
- [ ] `MenuItem.test.tsx` - 7 tests
- [ ] `MenuTabs.test.tsx` - 5 tests
- [ ] `OrderModal.test.tsx` - 9 tests
- [ ] `ViewOrderButton.test.tsx` - 5 tests

### Week 4: Phase 5 & 6 (E2E + CI/CD)
- [ ] Setup Playwright
- [ ] `customer-ordering.spec.ts` - 7 tests
- [ ] `dashboard-login.spec.ts` - 6 tests
- [ ] `table-management.spec.ts` - 6 tests
- [ ] Configure GitHub Actions
- [ ] Configure coverage reporting

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Overall Coverage | ~12% | 70%+ |
| Security Code Coverage | 0% | 90%+ |
| API Route Coverage | 0% | 80%+ |
| Component Coverage | 0% | 60%+ |
| E2E Critical Paths | 0 | 100% |

## Files to Create

### Phase 1
1. `packages/shared/src/__tests__/password.test.ts`
2. `packages/shared/src/__tests__/twoFactor.test.ts`
3. `packages/shared/src/__tests__/tenantContext.test.ts`

### Phase 2
4. `apps/dashboard/__tests__/utils/testHelpers.ts`
5. `packages/shared/src/__tests__/mocks/prisma.ts`
6. `apps/dashboard/__tests__/api/tables.test.ts`
7. `apps/dashboard/__tests__/api/tables-id.test.ts`
8. `apps/dashboard/__tests__/api/settings-password.test.ts`
9. `apps/dashboard/__tests__/api/auth.test.ts`

### Phase 3
10. Update `apps/customer/package.json`
11. Update `apps/dashboard/package.json`
12. `apps/customer/bunfig.toml`
13. `apps/customer/test-setup.ts`
14. `apps/dashboard/bunfig.toml`
15. `apps/dashboard/test-setup.ts`

### Phase 4
16. `apps/customer/__tests__/components/MenuItem.test.tsx`
17. `apps/customer/__tests__/components/MenuTabs.test.tsx`
18. `apps/customer/__tests__/components/OrderModal.test.tsx`
19. `apps/customer/__tests__/components/ViewOrderButton.test.tsx`

### Phase 5
20. `playwright.config.ts`
21. `e2e/customer-ordering.spec.ts`
22. `e2e/dashboard-login.spec.ts`
23. `e2e/table-management.spec.ts`

### Phase 6
24. `bunfig.toml` (root)
25. `.github/workflows/test.yml`
