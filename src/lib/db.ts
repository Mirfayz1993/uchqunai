import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getDirectDbUrl(): string {
  const url = process.env.DATABASE_URL!;

  // If using prisma+postgres:// protocol (prisma dev), extract the real postgres URL
  if (url.startsWith("prisma+postgres://")) {
    try {
      const parsed = new URL(url);
      const apiKey = parsed.searchParams.get("api_key");
      if (apiKey) {
        const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString());
        return decoded.databaseUrl;
      }
    } catch {
      // fallback
    }
  }

  // Regular postgres:// URL — use as is
  return url;
}

function createPrismaClient() {
  const connectionString = getDirectDbUrl();
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
