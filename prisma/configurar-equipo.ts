/**
 * Configura el equipo de Vita Construye:
 *   - Rodrigo Ramírez = ADMIN (dueño)
 *   - Ana González    → "Vendedor 1"  (vendedor1@vitaconstruye.com)
 *   - Carlos Mendoza  → "Vendedor 2"  (vendedor2@vitaconstruye.com)
 * Genera contraseñas nuevas (encriptadas con bcrypt).
 *
 * Uso:  npm run equipo
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

function crearCliente() {
  const url = process.env["DATABASE_URL"] ?? "file:./dev.db";
  if (url.startsWith("file:")) {
    return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: url.replace("file:", "") }) } as any);
  }
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) } as any);
}
const prisma = crearCliente();

const EQUIPO = [
  { correoViejo: "ana@vitaconstruye.com",    nombre: "Vendedor 1", correo: "vendedor1@vitaconstruye.com", password: "Vendedor1*2026" },
  { correoViejo: "carlos@vitaconstruye.com", nombre: "Vendedor 2", correo: "vendedor2@vitaconstruye.com", password: "Vendedor2*2026" },
];

async function main() {
  for (const v of EQUIPO) {
    const existente = await prisma.usuario.findFirst({ where: { OR: [{ correo: v.correoViejo }, { correo: v.correo }] } });
    const hash = await bcrypt.hash(v.password, 12);
    if (existente) {
      await prisma.usuario.update({
        where: { id: existente.id },
        data: { nombre: v.nombre, correo: v.correo, passwordHash: hash, rol: "VENDEDOR", activo: true },
      });
      console.log(`✏️  ${v.correoViejo} → ${v.nombre} (${v.correo})`);
    } else {
      await prisma.usuario.create({
        data: { nombre: v.nombre, correo: v.correo, passwordHash: hash, rol: "VENDEDOR", activo: true, metaMensual: 250000 },
      });
      console.log(`➕ ${v.nombre} (${v.correo})`);
    }
  }

  // Asegurar que Rodrigo siga como ADMIN
  await prisma.usuario.updateMany({ where: { correo: "admin@vitaconstruye.com" }, data: { rol: "ADMIN", nombre: "Rodrigo Ramírez", activo: true } });

  console.log("\n✅ Equipo configurado.\n");
  console.log("   ADMIN     → admin@vitaconstruye.com  / (tu contraseña actual: VitaAdmin2026!)");
  console.log("   Vendedor 1→ vendedor1@vitaconstruye.com / Vendedor1*2026");
  console.log("   Vendedor 2→ vendedor2@vitaconstruye.com / Vendedor2*2026");
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error("❌", e); prisma.$disconnect(); process.exit(1); });
