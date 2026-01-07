import { headers } from "next/headers";
import { auth } from "../auth";

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  userId: string;
  userRole: string;
}

/**
 * Get tenant context from middleware headers or session
 * Use this in API routes and Server Components
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  // Try to get from headers first (set by middleware)
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  const tenantSlug = headersList.get("x-tenant-slug");
  const userId = headersList.get("x-user-id");
  const userRole = headersList.get("x-user-role");

  if (tenantId && tenantSlug && userId && userRole) {
    return {
      tenantId,
      tenantSlug,
      userId,
      userRole,
    };
  }

  // Fallback to session
  const session = await auth();
  if (session?.user) {
    return {
      tenantId: session.user.tenantId,
      tenantSlug: session.user.tenantSlug,
      userId: session.user.id,
      userRole: session.user.role,
    };
  }

  return null;
}

/**
 * Require tenant context - throws error if not authenticated
 */
export async function requireTenantContext(): Promise<TenantContext> {
  const context = await getTenantContext();
  if (!context) {
    throw new Error("Unauthorized: No tenant context available");
  }
  return context;
}

/**
 * Check if user has required role
 */
export function hasRole(context: TenantContext, allowedRoles: string[]): boolean {
  return allowedRoles.includes(context.userRole);
}

/**
 * Require specific role - throws error if user doesn't have permission
 */
export async function requireRole(allowedRoles: string[]): Promise<TenantContext> {
  const context = await requireTenantContext();
  if (!hasRole(context, allowedRoles)) {
    throw new Error(`Forbidden: Requires one of roles: ${allowedRoles.join(", ")}`);
  }
  return context;
}
