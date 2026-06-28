import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
    "@neondatabase/serverless",
    "@prisma/adapter-neon",
    "@prisma/client",
  ],
};

export default nextConfig;
