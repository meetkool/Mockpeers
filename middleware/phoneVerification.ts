import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

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

export async function phoneVerificationMiddleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Allow public paths and API routes (except /api/user/*)
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path)) || 
      (pathname.startsWith('/api/') && !pathname.startsWith('/api/user/'))) {
    return NextResponse.next();
  }

  const token = await getToken({ req });

  // If user is not logged in, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Check if user's phone is verified
  const isPhoneVerified = token.isPhoneVerified === true;

  // If on verify-phone page
  if (pathname === '/verify-phone') {
    // If already verified, redirect to dashboard
    if (isPhoneVerified) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    // If not verified, allow access to verification page
    return NextResponse.next();
  }

  // For all other protected routes, redirect to verification if not verified
  if (!isPhoneVerified) {
    return NextResponse.redirect(new URL('/verify-phone', req.url));
  }

  return NextResponse.next();
}