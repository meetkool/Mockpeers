import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from 'next/server';
import type { NextFetchEvent } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/api/auth/register',
  '/api/auth/verify-phone/send',
  '/api/auth/verify-phone/verify',
  '/api/auth/callback',
  '/api/auth/signin',
  '/api/auth/signout',
  '/auth/error'
];

// Phone verification middleware logic
async function phoneVerificationMiddleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Skip middleware for public paths and most API routes
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path)) || 
      (pathname.startsWith('/api/') && !pathname.startsWith('/api/user/'))) {
    return NextResponse.next();
  }

  const token = await getToken({ req });

  // If user is not logged in, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For verify-phone page
  if (pathname === '/verify-phone') {
    // If phone is already verified, redirect to dashboard
    if (token.isPhoneVerified === true) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    // Allow access to verification page if not verified
    return NextResponse.next();
  }

  // Allow access to all routes - phone verification is now optional
  // Users can verify their phone from the dashboard when they want
  return NextResponse.next();
}

// Admin middleware
async function adminMiddleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const token = await getToken({ req });

  // Allow access to admin login page
  if (pathname === "/admin/login") {
    // If already logged in as admin, redirect to admin dashboard
    if (token?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // For all other admin routes, check authentication
  if (pathname.startsWith("/admin")) {
    if (!token || token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

// Main middleware handler
export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent
) {
  const pathname = request.nextUrl.pathname;

  // Handle admin routes first
  if (pathname.startsWith('/admin')) {
    return adminMiddleware(request);
  }
  
  // Handle phone verification for other routes
  return phoneVerificationMiddleware(request);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/user/:path*',
    '/admin/:path*',
    '/verify-phone'
  ]
};
