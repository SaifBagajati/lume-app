import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@lume-app/shared";

export async function middleware(request: NextRequest) {
  const session = await auth();

  // Public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/api/auth",
    "/api/integrations/square/callback",
    "/api/integrations/square/webhook",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Redirect to login if not authenticated and trying to access protected route
  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if authenticated and trying to access login
  if (session && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Add tenant context to headers for downstream use
  if (session?.user) {
    const requestHeaders = new Headers(request.headers);

    // Only set headers if the user object has the required properties
    if (session.user.tenantId) {
      requestHeaders.set("x-tenant-id", session.user.tenantId);
    }
    if (session.user.tenantSlug) {
      requestHeaders.set("x-tenant-slug", session.user.tenantSlug);
    }
    if (session.user.id) {
      requestHeaders.set("x-user-id", session.user.id);
    }
    if (session.user.role) {
      requestHeaders.set("x-user-role", session.user.role);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
