/**
 * prisma.ts — Prisma singleton
 *
 * Ensures a single PrismaClient instance is reused across hot-reloads
 * in development and across all route modules in production.
 * Prevents exhausting the database connection pool.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
