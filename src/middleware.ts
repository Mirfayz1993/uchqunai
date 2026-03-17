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

    return hmac === expected;
  } catch {
    return false;
  }
}

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
    if (!adminToken || !(await verifyAdminTokenEdge(adminToken))) {
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
