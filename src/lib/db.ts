import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaNeon } from "@prisma/adapter-neon";

function crearAdapter() {
  const url = process.env["DATABASE_URL"] ?? "file:./dev.db";

  if (url.startsWith("file:")) {
    const filePath = url.replace("file:", "");
    return new PrismaBetterSqlite3({ url: filePath });
  }

  // Neon WebSocket para serverless
  return new PrismaNeon({ connectionString: url });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getPrisma() {
  if (!globalForPrisma.prisma) {
    const adapter = crearAdapter();
    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    } as any);
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getPrisma() as any)[prop as string];
  },
});
