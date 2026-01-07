# ADR-0001: Order Modifier Data Model for Customer QR Ordering

## Status

Proposed

## Context

The Lume app's Phase 2 QR ordering system requires storing customer-selected menu modifiers within orders. Customers can customize menu items with modifiers like "Add cheese" (+$2.00), "No onions" ($0.00), or "Gluten-free bun" (+$3.50). These selections must be preserved accurately for kitchen display, historical records, and pricing calculations.

### Technical Constraints

**Existing Schema**: Phase 1 foundation includes `MenuModifier` and `ModifierOption` models for defining available modifiers, but lacks a mechanism to link customer selections to `OrderItem` records.

**Multi-Tenant SaaS**: All data must be isolated by `tenantId`. Each restaurant tenant manages independent menus and modifiers.

**Database Migration Path**: Development uses SQLite, production uses PostgreSQL. Schema changes must be compatible with both via Prisma ORM.

**Historical Accuracy Requirement**: Order records must preserve modifier selections and prices even if the menu changes later (e.g., "Add bacon" price increases from $2.00 to $2.50 after order placement).

### Business Requirements (From PRD)

- **FR-3.2**: Display and select item modifiers with pricing
- **FR-3.3**: Calculate modifier pricing (base price + sum of modifier option prices)
- **FR-5.1**: Create OrderItems with modifiers serialized (or normalized if schema supports)
- **Kitchen Display**: Show clear modifier details per order item ("Classic Burger: No pickles, Add bacon +$2.00")
- **Timeline**: 15-21 day implementation window (tight deadline favors simpler approaches)

### Problem Statement

**Core Question**: How should we store customer-selected modifiers in the `OrderItem` model to balance:
1. **Data Integrity**: Prevent orphaned references if menu modifiers change
2. **Query Performance**: Efficient retrieval for kitchen display and reporting
3. **Schema Complexity**: Minimize migration risk in tight timeline
4. **Type Safety**: Maintain TypeScript/Prisma type guarantees
5. **Database Compatibility**: Work with both SQLite (dev) and PostgreSQL (production)

## Decision

**Selected: Option 1 - JSON Serialization in New JSONB Column**

Store modifier selections as a JSON array in a new `OrderItem.modifiers` column (type `Json` in Prisma, maps to `TEXT` in SQLite and `JSONB` in PostgreSQL).

### Decision Details

| Item | Content |
|------|---------|
| **Decision** | Add `modifiers Json?` field to `OrderItem` model storing structured snapshot of selected modifier options with names and prices |
| **Why now** | Phase 2 requires modifier storage for MVP launch in 15-21 days; simpler schema changes reduce migration risk and implementation time |
| **Why this** | JSON serialization provides historical accuracy (snapshots immune to menu changes), minimal schema changes (one column addition), and sufficient query performance for expected scale (10 orders/min, 50 concurrent customers per tenant). Complex reporting queries can be deferred to Phase 3+ analytics needs. |
| **Known unknowns** | PostgreSQL JSONB query performance for filtering orders by specific modifiers (e.g., "Find all orders with 'Add bacon'") is untested at scale. If reporting requirements expand beyond kitchen display (current scope), indexing or schema migration may be needed. |
| **Kill criteria** | If query performance degrades below 3 seconds for kitchen display views (current requirement: < 2 seconds for order status updates), or if modifier-specific reporting becomes a core business requirement (Phase 3+), migrate to junction table (Option 2) or event sourcing pattern. |

## Rationale

### Options Considered

#### Option 1: JSON Serialization in New JSONB Column (Selected)

**Approach**: Add `modifiers Json?` field to `OrderItem` model. Store array of modifier snapshots:
```typescript
// Example OrderItem.modifiers value
[
  {
    "modifierId": "uuid-1",
    "modifierName": "Toppings",
    "optionId": "uuid-2",
    "optionName": "Add bacon",
    "price": 2.00
  },
  {
    "modifierId": "uuid-3",
    "modifierName": "Customizations",
    "optionId": "uuid-4",
    "optionName": "No onions",
    "price": 0.00
  }
]
```

**Migration**:
```prisma
model OrderItem {
  id        String @id @default(uuid())
  orderId   String
  itemId    String
  quantity  Int
  price     Float
  notes     String?
  modifiers Json?  // NEW: Modifier snapshots

  order Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  item  MenuItem @relation(fields: [itemId], references: [id])
}
```

**Pros**:
- ✅ **Historical Accuracy**: Modifier data frozen at order time, immune to menu changes
- ✅ **Minimal Schema Changes**: Single column addition, low migration risk
- ✅ **Implementation Speed**: Fastest to implement (~2 days vs 4-5 days for junction table)
- ✅ **Type Safety**: Zod schemas validate JSON structure at API boundaries
- ✅ **Database Compatibility**: Prisma `Json` type works on both SQLite (TEXT) and PostgreSQL (JSONB)
- ✅ **Sufficient for MVP**: Kitchen display and customer views only need `orderItem.modifiers` array iteration
- ✅ **No Foreign Key Complexity**: Avoids cascade delete issues when menu modifiers change

**Cons**:
- ❌ **Limited Query Flexibility**: Cannot efficiently filter orders by specific modifier options (e.g., "Find all orders with 'Add bacon'") without full table scans or GIN indexes (PostgreSQL only)
- ❌ **Data Denormalization**: Modifier names/prices duplicated across orders (acceptable trade-off for historical accuracy)
- ❌ **Manual Validation**: Requires runtime Zod validation instead of database-enforced foreign keys
- ❌ **SQLite JSON Limitations**: SQLite JSON querying is less performant than PostgreSQL JSONB (mitigated by expected low query complexity in Phase 2)

**Estimated Effort**: 2 days (schema migration + API validation + kitchen display rendering)

---

#### Option 2: Junction Table (OrderItemModifier)

**Approach**: Create `OrderItemModifier` table with foreign keys to `OrderItem` and `ModifierOption`. Add `priceSnapshot` field to preserve historical pricing.

```prisma
model OrderItemModifier {
  id              String @id @default(uuid())
  orderItemId     String
  modifierOptionId String
  priceSnapshot   Float  // Price at order time
  createdAt       DateTime @default(now())

  orderItem      OrderItem      @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  modifierOption ModifierOption @relation(fields: [modifierOptionId], references: [id])

  @@unique([orderItemId, modifierOptionId])
}
```

**Pros**:
- ✅ **Referential Integrity**: Database-enforced foreign keys prevent invalid modifier references
- ✅ **Flexible Queries**: Easy filtering/aggregation (e.g., "Count orders with 'Add bacon'")
- ✅ **Normalized Data**: No duplication of modifier names (stored once in `ModifierOption`)
- ✅ **Type-Safe Relations**: Prisma generates fully typed includes/joins
- ✅ **PostgreSQL Optimized**: Standard relational queries with B-tree indexes

**Cons**:
- ❌ **Complex Historical Tracking**: Requires `priceSnapshot` AND potentially `nameSnapshot` fields if modifier names change (e.g., "Add bacon" → "Add smoked bacon")
- ❌ **Cascade Delete Risk**: If `ModifierOption` is deleted, requires careful `onDelete` strategy (Restrict? SetNull? Cascade?)
- ❌ **Higher Migration Effort**: New table + foreign keys + index creation (~4-5 days implementation)
- ❌ **Join Overhead**: Kitchen display queries require joins across 4 tables (Order → OrderItem → OrderItemModifier → ModifierOption)
- ❌ **Timeline Risk**: More complex implementation increases risk in 15-21 day deadline

**Estimated Effort**: 4-5 days (schema design + migration + API updates + kitchen display joins + cascade delete testing)

---

#### Option 3: Snapshot Embedding (Denormalized Columns)

**Approach**: Add individual columns to `OrderItem` for modifier data:
```prisma
model OrderItem {
  id                String @id @default(uuid())
  orderId           String
  itemId            String
  quantity          Int
  price             Float
  notes             String?
  modifierNames     String?  // Comma-separated: "Add bacon, No onions"
  modifierPricing   String?  // Comma-separated: "+$2.00, $0.00"

  order Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  item  MenuItem @relation(fields: [itemId], references: [id])
}
```

**Pros**:
- ✅ **Simple Display Logic**: Modifier strings can be directly rendered in kitchen views
- ✅ **Historical Accuracy**: Data frozen at order time
- ✅ **Minimal Schema Changes**: Two string columns

**Cons**:
- ❌ **Severely Limited Type Safety**: String parsing required, no compile-time guarantees
- ❌ **No Structured Queries**: Cannot filter by individual modifiers without LIKE queries
- ❌ **Parsing Complexity**: Requires manual string splitting/formatting logic in multiple places
- ❌ **Error-Prone**: Comma-separated strings vulnerable to injection, parsing errors, and inconsistent formatting
- ❌ **Anti-Pattern**: Violates first normal form (1NF) database design principles
- ❌ **Maintenance Burden**: String format changes require migration of existing data

**Estimated Effort**: 3 days (schema + parsing utilities + validation + kitchen display + error handling for malformed strings)

**Verdict**: ❌ Not recommended due to lack of type safety and violation of database normalization principles.

## Comparison

| Evaluation Axis | Option 1: JSON (Selected) | Option 2: Junction Table | Option 3: Denormalized Strings |
|-----------------|---------------------------|--------------------------|--------------------------------|
| **Implementation Effort** | 2 days | 4-5 days | 3 days |
| **Historical Accuracy** | ✅ Perfect (snapshot) | ⚠️ Requires priceSnapshot + nameSnapshot | ✅ Perfect (snapshot) |
| **Query Performance (Kitchen Display)** | ✅ Good (single column read) | ⚠️ Moderate (4-table joins) | ✅ Good (string fields) |
| **Query Performance (Reporting)** | ⚠️ Limited (JSONB queries needed) | ✅ Excellent (indexed joins) | ❌ Poor (LIKE queries only) |
| **Type Safety** | ✅ Good (Zod runtime validation) | ✅ Excellent (Prisma types) | ❌ Poor (manual string parsing) |
| **Schema Complexity** | ✅ Low (1 column) | ⚠️ High (new table + FKs) | ✅ Low (2 columns) |
| **Data Integrity** | ⚠️ Runtime validation only | ✅ Database-enforced FKs | ❌ No enforcement |
| **SQLite Compatibility** | ✅ Yes (JSON as TEXT) | ✅ Yes (standard relations) | ✅ Yes (standard strings) |
| **PostgreSQL Optimization** | ✅ Yes (JSONB + GIN indexes) | ✅ Yes (B-tree indexes) | ❌ No (string matching slow) |
| **Maintainability** | ✅ Good (structured JSON schema) | ✅ Good (clear relations) | ❌ Poor (string parsing logic) |
| **Timeline Risk** | ✅ Low (simple, proven pattern) | ⚠️ Medium (complex migration) | ⚠️ Medium (parsing edge cases) |
| **Future Scalability** | ⚠️ May need migration if reporting requirements expand | ✅ Scales well for complex queries | ❌ Not scalable |

### Decision Rationale

**Option 1 (JSON Serialization) is selected** because it best balances the project's constraints:

1. **Timeline Priority**: 2-day implementation fits within the 15-21 day Phase 2 deadline with buffer for testing.
2. **Historical Accuracy**: Modifier snapshots ensure correct pricing/display even after menu changes (critical business requirement from PRD).
3. **Sufficient for MVP Scope**: Kitchen display and customer order tracking (Phase 2 requirements) only need to iterate and render modifiers, not filter by them.
4. **Low Migration Risk**: Single column addition minimizes schema complexity in tight timeline.
5. **PostgreSQL Optimization Path**: If reporting requirements emerge in Phase 3+, GIN indexes on `modifiers` JSONB column enable efficient querying without schema migration. If reporting becomes critical, migration to Option 2 is still possible.

**Why Not Option 2 (Junction Table)**:
- Doubles implementation time (4-5 days vs 2 days) in tight timeline
- Adds join complexity for every kitchen display query (current primary use case)
- Overkill for Phase 2 MVP scope (no modifier-specific reporting requirements)
- Can be adopted later if analytics needs emerge

**Why Not Option 3 (Denormalized Strings)**:
- Violates type safety principles (TypeScript/Prisma project standards)
- Error-prone parsing logic increases maintenance burden
- Not scalable for future requirements

## Consequences

### Positive Consequences

- ✅ **Fast Implementation**: 2-day effort enables Phase 2 launch within timeline
- ✅ **Historical Data Accuracy**: Modifier snapshots immune to menu changes, preventing display/pricing errors on old orders
- ✅ **Simple Kitchen Display Queries**: Single `orderItem.modifiers` read, no joins required
- ✅ **Type Safety Maintained**: Zod schemas provide runtime validation at API boundaries
- ✅ **Database-Agnostic**: Works identically in SQLite (dev) and PostgreSQL (production)
- ✅ **Low Migration Risk**: Minimal schema change reduces deployment complexity

### Negative Consequences

- ❌ **Limited Reporting Queries**: Cannot efficiently answer "How many orders included 'Add bacon'?" without full table scans (acceptable for Phase 2 MVP, no such requirement exists)
- ❌ **Data Denormalization**: Modifier names/prices duplicated across orders (trade-off for historical accuracy)
- ❌ **Manual Validation Required**: Developers must ensure Zod schemas are applied at all OrderItem creation points
- ❌ **Potential Future Migration**: If Phase 3+ adds modifier-specific analytics, may need to migrate to junction table or add GIN indexes

### Neutral Consequences

- ⚪ **PostgreSQL JSONB Indexing**: Production can add GIN indexes later if needed without schema migration:
  ```sql
  CREATE INDEX idx_order_item_modifiers ON OrderItem USING GIN (modifiers);
  ```
- ⚪ **Validation Schema Coupling**: OrderItem creation logic coupled to Zod schema definitions (standard practice in Next.js API routes)

## Implementation Guidance

**Schema Migration Principles**:
- Use Prisma migrations to add `modifiers Json?` field
- Keep `notes String?` field for free-text special instructions (different use case)
- Add Zod schema for modifier array structure validation

**API Validation Principles**:
- Validate `modifiers` array structure with Zod at order creation endpoint
- Ensure each modifier snapshot includes: `modifierId`, `modifierName`, `optionId`, `optionName`, `price`
- Reject orders if modifier validation fails (fail-fast principle)

**Type Safety Principles**:
- Define TypeScript interface for modifier snapshot structure
- Use Zod schema to bridge runtime validation and compile-time types
- Apply type guards when reading `modifiers` JSON from database

**Kitchen Display Principles**:
- Iterate over `orderItem.modifiers` array to render modifier list
- Display format: `"{optionName} {price > 0 ? '+$' + price : ''}"`
- Handle `null` modifiers gracefully (items without customizations)

**Data Integrity Principles**:
- Snapshot modifier data at order creation time (query `ModifierOption` table, serialize to JSON)
- Never update `orderItem.modifiers` after order creation (immutable historical record)
- Use tenant isolation (`tenantId` filtering) when querying ModifierOption data for snapshot creation

**Migration Path (If Needed in Future)**:
- If reporting requirements emerge, first attempt PostgreSQL GIN indexes on `modifiers` JSONB
- If indexes insufficient, migrate to junction table by:
  1. Create `OrderItemModifier` table
  2. Backfill from existing JSON data
  3. Keep JSON column for historical orders (read-only)
  4. Use junction table for new orders

## Related Information

### Related PRD Sections
- [FR-3.2: Display and select item modifiers](../prd/customer-qr-ordering-phase2-prd.md#fr-3-shopping-cart-with-modifier-system)
- [FR-3.3: Calculate modifier pricing](../prd/customer-qr-ordering-phase2-prd.md#fr-3-shopping-cart-with-modifier-system)
- [FR-5.1: Create OrderItems via API](../prd/customer-qr-ordering-phase2-prd.md#fr-5-order-creation-api)
- [Technical Constraints: Modifier Data Model Limitation](../prd/customer-qr-ordering-phase2-prd.md#constraints)

### Related Schema
- Existing Prisma Schema: `/prisma/schema.prisma`
  - `MenuModifier` model (lines 119-128)
  - `ModifierOption` model (lines 130-138)
  - `OrderItem` model (lines 164-175) - **To be modified**

### Design Patterns
- **Snapshot Pattern**: Storing historical state as denormalized JSON (similar to event sourcing lite)
- **Fail-Fast Validation**: Zod schemas at API boundaries prevent invalid data entry

### Future Considerations
- Phase 3+ Analytics: If modifier reporting becomes critical, evaluate GIN indexes vs junction table migration
- Phase 4+ POS Integration: External systems may require structured modifier data (junction table may be needed for bidirectional sync)

## References

Research conducted on 2025-12-31:

- [Data Modeling Best Practices | PostgreSQL Tutorial](https://www.swiftorial.com/tutorials/databases/postgresql/best_practices/data_modeling_best_practices) - PostgreSQL normalization and foreign key best practices
- [Top 10 PostgreSQL® best practices for 2025](https://www.instaclustr.com/education/postgresql/top-10-postgresql-best-practices-for-2025/) - JSONB performance optimization and identity columns
- [Serving Delicious Food (and Data) – A Data Model for Restaurants](https://vertabelo.com/blog/serving-delicious-food-and-data-a-data-model-for-restaurants/) - Restaurant POS data modeling patterns for modifiers and variants
- [JSON and Relational Tables: How to Get the Best of Both](https://thenewstack.io/json-and-relational-tables-how-to-get-the-best-of-both/) - PostgreSQL Duality Views for JSON/relational flexibility
- [Multi-Tenancy Implementation Approaches With Prisma and ZenStack](https://zenstack.dev/blog/multi-tenant) - Prisma multi-tenancy patterns and row-level security
- [Multi-Tenancy with Prisma: A New Approach to Making 'where' Required](https://medium.com/@kz-d/multi-tenancy-with-prisma-a-new-approach-to-making-where-required-1e93a3783d9d) - Enforcing tenant isolation in Prisma queries

---

**Document Metadata**
- **Version**: 1.0
- **Created**: 2025-12-31
- **Author**: Development Team (via Claude Code)
- **Next Steps**: Create Design Document for Phase 2 implementation with modifier data model integration
