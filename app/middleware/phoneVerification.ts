import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function phoneVerificationMiddleware(req: NextRequest) {
  const token = await getToken({ req });
  const pathname = req.nextUrl.pathname;

  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If phone is not verified and trying to access protected routes
  if (!token.isPhoneVerified && pathname !== '/verify-phone') {
    return NextResponse.redirect(new URL('/verify-phone', req.url));
  }

  // If phone is verified and trying to access verify-phone page
  if (token.isPhoneVerified && pathname === '/verify-phone') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}
