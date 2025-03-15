import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;
    const isAuthenticated = !!req.nextauth.token;
    const isAdmin = req.nextauth.token?.role === "ADMIN";
    const isAdminLoginPage = pathname === "/admin/login";

    // Allow access to login page if not authenticated
    if (isAdminLoginPage) {
      if (isAdmin) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    // Protect admin routes
    if (pathname.startsWith("/admin")) {
      if (!isAuthenticated || !isAdmin) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname;
        
        // Allow access to login page without authentication
        if (pathname === "/admin/login") {
          return true;
        }

        // For all other admin routes, require authentication
        if (pathname.startsWith("/admin")) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*']
};
