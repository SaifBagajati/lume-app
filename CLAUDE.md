# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lume is a multi-tenant SaaS platform for Canadian casual dining restaurants featuring QR code-based ordering, guest checkout, and payment processing. Built as a monorepo using Next.js 15, TypeScript, Prisma, and Turbo.

## Development Commands

### Setup
```bash
# Install all dependencies
bun install

# Generate Prisma client (required after schema changes)
bunx prisma generate

# Run database migrations
bunx prisma migrate dev

# Seed database
bun run db:seed
```

### Running the Apps
```bash
# Run all apps concurrently
bun run dev

# Run individual apps
cd apps/customer && bun run dev   # Port 3000 - Customer ordering app
cd apps/dashboard && bun run dev  # Port 3001 - Restaurant dashboard

# Build all apps
bun run build

# Lint all packages
bun run lint

# Format code
bun run format
```

### Database Commands
```bash
# Open Prisma Studio (database GUI)
bunx prisma studio

# Create a new migration
bunx prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
bunx prisma migrate reset

# Generate Prisma client after schema changes
bunx prisma generate
```

### Monorepo Commands
```bash
# Clean all build artifacts and node_modules
bun run clean

# Run tests across all packages
bun test
```

## Architecture

### Monorepo Structure
This is a Bun workspaces + Turbo monorepo:
- **apps/customer**: Customer-facing QR ordering Next.js app (port 3000)
- **apps/dashboard**: Restaurant management Next.js dashboard (port 3001)
- **packages/shared**: Shared code including Prisma client, Auth.js config, types, and utilities
- **prisma/**: Database schema, migrations, and seed scripts
- **generated/**: Generated Prisma client

### Multi-Tenancy Architecture

**Critical: All data is scoped by tenantId.** Every database model (except Tenant itself) includes a `tenantId` foreign key with cascade deletion.

#### Tenant Context Flow
1. User logs in via Auth.js with credentials + optional 2FA
2. Auth.js callbacks in `packages/shared/src/auth.ts` add `tenantId`, `tenantSlug`, and `role` to JWT token and session
3. Dashboard middleware (`apps/dashboard/middleware.ts`) reads session and injects tenant context into request headers:
   - `x-tenant-id`
   - `x-tenant-slug`
   - `x-user-id`
   - `x-user-role`
4. Server Components and API routes use `getTenantContext()` or `requireTenantContext()` from `packages/shared/src/utils/tenantContext.ts` to access context

#### Using Tenant Context
```typescript
// In Server Components or API routes
import { getTenantContext, requireTenantContext, requireRole } from "@lume-app/shared";

// Optional - returns null if not authenticated
const context = await getTenantContext();

// Required - throws if not authenticated
const context = await requireTenantContext();

// Role-based access control
const context = await requireRole(["OWNER", "MANAGER"]);

// Then use context.tenantId in Prisma queries
const items = await prisma.menuItem.findMany({
  where: { tenantId: context.tenantId }
});
```

**Important:** Always filter by `tenantId` in Prisma queries to maintain data isolation between restaurants.

### Authentication & Security

- **Auth.js v5** (next-auth beta) with JWT sessions
- **2FA** using TOTP (otplib) - optional per user
- **Password hashing** with bcryptjs
- **User roles**: OWNER, MANAGER, STAFF (string-based, stored in User model)
- Auth config in `packages/shared/src/auth.ts`
- Session strategy: JWT with 30-day expiry
- Protected routes handled by middleware in dashboard app

### Database Schema

The Prisma schema (`prisma/schema.prisma`) uses SQLite for development (PostgreSQL planned for production).

**Key Models:**
- **Tenant**: Restaurant accounts (identified by unique `slug`)
- **User**: Staff accounts with role and optional 2FA
- **RestaurantTable**: Tables with unique QR codes for customer access
- **MenuCategory & MenuItem**: Menu hierarchy with modifiers
- **Order & OrderItem**: Order management (statuses: PENDING, PREPARING, READY, COMPLETED, CANCELLED)
- **Payment**: Payment tracking (methods: CARD, APPLE_PAY, GOOGLE_PAY)
- **AuditLog**: Audit trail for compliance

**Important relationships:**
- All models except Tenant have `tenantId` with `onDelete: Cascade`
- MenuItem -> MenuCategory (required)
- MenuItem -> MenuModifier -> ModifierOption (for customizations)
- Order -> RestaurantTable (required)
- Order -> OrderItem -> MenuItem

### Shared Package

Located at `packages/shared/`, this package is imported by both apps using `@lume-app/shared`.

**Key exports:**
- `prisma` - Prisma client instance (singleton)
- `auth`, `signIn`, `signOut` - Auth.js functions
- `getTenantContext`, `requireTenantContext`, `requireRole` - Tenant context utilities
- `hashPassword` - Password hashing utility
- TypeScript types and interfaces

**Note:** The shared package uses TypeScript source imports (not compiled), configured in `package.json` exports.

### Customer App Architecture

- **Dynamic routing**: `/[tenantSlug]/...` for tenant-specific pages
- **QR code flow**: Scans QR → identifies table → loads menu for that tenant
- **Guest checkout**: No authentication required for customers
- URL structure example: `localhost:3000/demo-restaurant/table/t-123`

### Dashboard App Architecture

- **Protected routes**: All routes except `/login` require authentication
- **Middleware**: Validates session and injects tenant context headers
- **Layout structure**:
  - Root layout with SessionProvider
  - Dashboard layout group `(dashboard)` with navigation
  - Login page outside dashboard layout

## Important Patterns

### When making database schema changes:
1. Edit `prisma/schema.prisma`
2. Run `bunx prisma migrate dev --name descriptive_name`
3. Run `bunx prisma generate` (updates TypeScript types)
4. Restart dev servers to pick up new types

### When adding new API routes requiring authentication:
```typescript
import { requireTenantContext } from "@lume-app/shared";

export async function GET(request: Request) {
  const context = await requireTenantContext();

  // All queries MUST filter by tenantId
  const data = await prisma.yourModel.findMany({
    where: { tenantId: context.tenantId }
  });

  return Response.json(data);
}
```

### When accessing Prisma client:
Always import from the shared package: `import { prisma } from "@lume-app/shared"`

### Environment Variables:
Required in root `.env`:
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key-change-in-production"
```

## Known Issues

- **Seed script**: `prisma/seed.ts` may have issues with Prisma client initialization. Use Prisma Studio (`bunx prisma studio`) to manually create test data if needed.

## Tech Stack Reference

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.7
- **Database**: SQLite (dev) / PostgreSQL (production planned)
- **ORM**: Prisma 6.19
- **Auth**: Auth.js v5 (next-auth@5.0.0-beta.30)
- **Styling**: Tailwind CSS
- **Monorepo**: Bun workspaces + Turbo
- **2FA**: otplib
- **QR Codes**: qrcode package

## Current Tasks

- [ ] Create a persistent Cloudflare tunnel using existing domain (for Square OAuth HTTPS requirement)
- [ ] Make payments modular in settings so owner can turn off/on
- [ ] Update Payment settings to ask for existing or create new Stripe account when turned on
- [ ] Adjust payment flow to include splitting the bill, and tip options that can be configured in the settings page. Defaults are 18%, 20%, and 25%
- [ ] Create landing page or marketing website where a potential customer can see features and benefits, and can click on the top right to either sign up or login
- [ ] Create a sign up flow that let's an owner create an account (or log in with Google), connect to their POS, set number of tables and automatically generate those in their settings and tables pages
- [x] Add integration to Toast
- [ ] Add integration to Clover
- [ ] Add integration to Lightspeed
