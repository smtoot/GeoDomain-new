import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Admin routes protection
    if (pathname.startsWith("/admin")) {
      if (!token || (token.role !== "ADMIN" && token.role !== "SUPER_ADMIN")) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Protected routes that require authentication
    if (pathname.startsWith("/dashboard") || 
        pathname.startsWith("/domains/new") ||
        pathname.startsWith("/domains/edit") ||
        pathname.startsWith("/inquiries")) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/domains/new",
    "/domains/edit/:path*",
    "/inquiries/:path*",
  ],
};
