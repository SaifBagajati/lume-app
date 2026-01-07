# Lume - Canadian Restaurant QR Ordering Platform

A multi-tenant SaaS platform for Canadian casual dining restaurants featuring QR code-based ordering, guest checkout, and payment processing.

## Project Structure

This is a monorepo built with npm workspaces and Turbo:

```
lume-app/
├── apps/
│   ├── customer/       # Customer-facing QR ordering app (port 3000)
│   └── dashboard/      # Restaurant management dashboard (port 3001)
├── packages/
│   └── shared/         # Shared types and utilities
├── prisma/            # Database schema and migrations
└── generated/         # Generated Prisma client
```

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Database**: SQLite (dev), PostgreSQL (production)
- **ORM**: Prisma
- **Monorepo**: npm workspaces + Turbo

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev
```

### Development

```bash
# Run all apps in development mode
npm run dev

# Run specific app
cd apps/customer && npm run dev   # http://localhost:3000
cd apps/dashboard && npm run dev  # http://localhost:3001
```

### Database

```bash
# Open Prisma Studio (database GUI)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name your_migration_name

# Reset database
npx prisma migrate reset
```

## Current Status - Phase 1: Foundation ✅

### Completed
- ✅ Next.js 15 monorepo with TypeScript
- ✅ Project structure (customer app, dashboard app, shared package)
- ✅ Prisma ORM configured with SQLite
- ✅ Database schema with multi-tenancy support
- ✅ Tailwind CSS setup
- ✅ Basic app shells running

### Next Steps - Phase 1 Remaining
- [ ] Implement Auth.js v5 with 2FA
- [ ] Build tenant context middleware
- [ ] Create basic admin dashboard shell

## Database Schema

The database includes:
- **Tenants**: Restaurant accounts
- **Users**: Staff with roles (OWNER, MANAGER, STAFF) and 2FA support
- **RestaurantTable**: Tables with QR codes
- **MenuCategory & MenuItem**: Menu management with modifiers
- **Order & OrderItem**: Order tracking
- **Payment**: Payment processing
- **AuditLog**: Audit trail

## Environment Variables

Create a `.env` file in the root:

```env
DATABASE_URL="file:./dev.db"
```

## License

Private - All rights reserved
