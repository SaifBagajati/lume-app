# Settings Page Internal Server Error - FIXED

## Problem

The settings page was throwing an internal server error when loading.

## Root Cause

The issue was in `/home/saif/Projects/lume-app/packages/shared/src/index.ts`:

```typescript
// PROBLEMATIC CODE:
export { syncSquareCatalog } from "./services/squareSync";
```

By exporting `syncSquareCatalog` from the main shared package index, the entire Square SDK module chain was being loaded on **every page** that imported from `@lume-app/shared`, including:

- The Square SDK (`square@43.2.1`)
- The Square client utilities
- The encryption module
- All related dependencies

This caused issues because:
1. The Square SDK requires Node.js APIs that may not be available in all contexts
2. Loading the SDK on every page added unnecessary overhead
3. Edge Runtime compilation would fail for pages using the shared package

## Solution

### 1. Removed Square Exports from Main Index

**File:** `packages/shared/src/index.ts`

```typescript
// BEFORE:
export { syncSquareCatalog } from "./services/squareSync";

// AFTER:
// Note: Square-specific exports are not included here to avoid loading
// the Square SDK on every page. Import directly from the service when needed:
// import { syncSquareCatalog } from '@lume-app/shared/services/squareSync';
```

### 2. Added Granular Export Paths

**File:** `packages/shared/package.json`

```json
"exports": {
  ".": "./src/index.ts",
  "./types": "./src/types/index.ts",
  "./services/*": "./src/services/*.ts",
  "./utils/*": "./src/utils/*.ts"
}
```

This allows direct imports without loading everything:
```typescript
// Direct import - only loads what's needed
import { syncSquareCatalog } from '@lume-app/shared/services/squareSync';
```

### 3. Updated API Route Imports

**Files:**
- `apps/dashboard/app/api/integrations/square/sync/route.ts`
- `apps/dashboard/app/api/integrations/square/webhook/route.ts`

```typescript
// BEFORE:
import { requireTenantContext, syncSquareCatalog } from '@lume-app/shared';

// AFTER:
import { requireTenantContext } from '@lume-app/shared';
import { syncSquareCatalog } from '@lume-app/shared/services/squareSync';
```

## Benefits

✅ **Settings page loads without errors**
✅ **Reduced bundle size** - Square SDK only loaded when needed
✅ **Better performance** - No unnecessary module loading
✅ **Edge Runtime compatible** - Other pages can use Edge if needed
✅ **Cleaner architecture** - Service-specific imports are explicit

## Verification

```bash
# Start dashboard
npm run dev

# Navigate to:
http://localhost:3001/settings

# Should load successfully with POS Integration tab visible
```

## Files Modified

1. `packages/shared/src/index.ts` - Removed syncSquareCatalog export
2. `packages/shared/package.json` - Added granular export paths
3. `apps/dashboard/app/api/integrations/square/sync/route.ts` - Updated imports
4. `apps/dashboard/app/api/integrations/square/webhook/route.ts` - Updated imports

## Lesson Learned

**Don't export heavy dependencies from package indexes** - especially those that:
- Require Node.js-specific APIs
- Are only needed in specific contexts
- Add significant overhead to bundle size

Instead, use granular exports and direct imports for optional features like integrations.
