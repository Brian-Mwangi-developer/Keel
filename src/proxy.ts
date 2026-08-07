import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_ROUTES = ["/join", "/login", "/signup"];
const PROTECTED_ROUTES = ["/dashboard", "/departments", "/users"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optimistic check only — existence of the cookie, not its validity.
  // Real authorization still happens server-side wherever it matters.
  const hasSession = !!getSessionCookie(request);

  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!hasSession && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/join",
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/departments/:path*",
    "/users/:path*",
  ],
};
