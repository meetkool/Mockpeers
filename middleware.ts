import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    return null;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Only apply admin authentication rules to admin routes
        if (req.nextUrl.pathname.startsWith("/admin")) {
          if (req.nextUrl.pathname === "/admin/login") {
            return true;
          }
          return token?.role === "ADMIN";
        }
        // Allow all other routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
