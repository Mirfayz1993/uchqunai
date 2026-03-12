export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/history/:path*", "/profile/:path*"],
};
