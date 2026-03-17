import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function verifyAdminTokenEdge(token: string): Promise<boolean> {
  try {
    const parts = token.split(":");
    if (parts.length !== 2) return false;
    const [timestamp, hmac] = parts;
    if (!timestamp || !hmac) return false;

    const age = Date.now() - parseInt(timestamp);
    if (isNaN(age) || age > TOKEN_TTL || age < 0) return false;

    // Use Web Crypto API (edge-compatible)
    const secret = process.env.AUTH_SECRET || "fallback-secret";
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(timestamp));
    const expected = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Timing-safe comparison for edge runtime
    if (hmac.length !== expected.length) return false;
    let result = 0;
    for (let i = 0; i < hmac.length; i++) {
      result |= hmac.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return result === 0;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes (both pages and API)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    // Allow login page and login API
    if (pathname === "/admin/login" || pathname === "/api/admin/login") {
      return NextResponse.next();
    }

    // Check admin cookie
    const adminToken = request.cookies.get("admin-token")?.value;
    if (!adminToken || !(await verifyAdminTokenEdge(adminToken))) {
      // API routes return 401, pages redirect
      if (pathname.startsWith("/api/")) {
        return new NextResponse("Ruxsat yo'q", { status: 401 });
      }
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
  matcher: ["/history/:path*", "/profile/:path*", "/admin/:path*", "/api/admin/:path*"],
};
