import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyAdminToken } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes
  if (pathname.startsWith("/admin")) {
    // Allow login page
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    // Check admin cookie
    const adminToken = request.cookies.get("admin-token")?.value;
    if (!adminToken || !verifyAdminToken(adminToken)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
  }

  // User auth routes
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/history/:path*", "/profile/:path*", "/admin/:path*"],
};
