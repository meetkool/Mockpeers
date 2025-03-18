import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  // If no session, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL));
  }

  // Create response with redirect to dashboard
  const response = NextResponse.redirect(new URL('/dashboard', process.env.NEXTAUTH_URL));
  
  // Clear the old session cookies
  response.cookies.set('next-auth.session-token', '', { maxAge: 0 });
  response.cookies.set('next-auth.csrf-token', '', { maxAge: 0 });
  response.cookies.set('next-auth.callback-url', '', { maxAge: 0 });

  return response;
}