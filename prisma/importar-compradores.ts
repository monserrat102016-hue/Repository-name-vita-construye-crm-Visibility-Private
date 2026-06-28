/**
 * Importa la base de CLIENTES QUE COMPRARON (prisma/compradores.json).
 * Si el cliente ya existe (por teléfono) lo SUBE a GANADO; si no, lo crea como
 * cliente ganado. Guarda dirección y fecha de compra.
 *
 * Uso:  npm run compradores
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaNeon } from "@prisma/adapter-neon";
import fs from "node:fs";
import path from "node:path";

function crearCliente() {
  const url = process.env["DATABASE_URL"] ?? "file:./dev.db";
  if (url.startsWith("file:")) return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: url.replace("file:", "") }) } as any);
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) } as any);
}
const prisma = crearCliente();

interface Comprador { nombre: string; telefono: string; compro: string; fechaCompra: string; direccion: string }

function normTel(t: string) {
  let n = (t || "").replace(/\D/g, "");
  if (n.startsWith("52") && n.length === 12) n = n.slice(2);
  if (n.length === 11 && n.startsWith("1")) n = n.slice(1);
  if (n.length > 10) n = n.slice(-10);
  return n.length === 10 ? n : "";
}
function fecha(iso: string) { if (!iso) return null; const d = new Date(iso + "T12:00:00"); return isNaN(d.getTime()) ? null : d; }

async function main() {
  const compradores: Comprador[] = JSON.parse(fs.readFileSync(path.join(__dirname, "compradores.json"), "utf8"));
  console.log(`🧾 ${compradores.length} compradores en el archivo.\n`);

  const stats = { creados: 0, actualizados: 0, omitidos: 0 };
  const vistos = new Set<string>();

  for (const c of compradores) {
    if (!c.nombre?.trim()) continue;
    const local = normTel(c.telefono);
    if (local && vistos.has(local)) { stats.omitidos++; continue; }
    if (local) vistos.add(local);

    const ganadoEn = fecha(c.fechaCompra) || new Date();
    const dir = c.direccion?.trim();
    const notaDir = dir ? `Dirección: ${dir}` : null;

    // Buscar existente por teléfono
    const existente = local
      ? await prisma.cliente.findFirst({ where: { eliminadoEn: null, OR: [{ telefono: { contains: local } }, { telefonoInternacional: { contains: local } }] }, select: { id: true, notas: true, nombre: true, estadoCartera: true } })
      : null;

    if (existente) {
      const nuevasNotas = [existente.notas, notaDir].filter((x) => x && !`${existente.notas || ""}`.includes(dir || "###")).join("\n") || existente.notas;
      await prisma.$transaction(async (tx) => {
        await tx.cliente.update({
          where: { id: existente.id },
          data: {
            estadoCartera: "GANADO", etapa: "Pedido Confirmado", ganadoEn, ultimoContacto: ganadoEn,
            notas: nuevasNotas, motivoPerdida: null, perdidoEn: null,
          },
        });
        await tx.interaccion.create({ data: { clienteId: existente.id, tipo: "estado", descripcion: `✅ Confirmado como COMPRA (base de clientes que compraron). ${dir ? "Obra: " + dir : ""}`, usuarioNombre: "Importación", fecha: ganadoEn } });
      });
      stats.actualizados++;
    } else {
      await prisma.$transaction(async (tx) => {
        const nuevo = await tx.cliente.create({
          data: {
            nombre: c.nombre.trim(),
            telefono: local || null,
            telefonoInternacional: local ? `52${local}` : null,
            etapa: "Pedido Confirmado", estadoCartera: "GANADO", temperatura: "Caliente",
            productoInteres: "Vigueta y Bovedilla", origen: "Cliente que compró", utmCampaign: "Base compradores",
            notas: notaDir, ganadoEn, ultimoContacto: ganadoEn, creadoEn: ganadoEn,
          },
        });
        await tx.interaccion.create({ data: { clienteId: nuevo.id, tipo: "estado", descripcion: `✅ Cliente que ya compró (importado). ${dir ? "Obra: " + dir : ""}`, usuarioNombre: "Importación", fecha: ganadoEn } });
      });
      stats.creados++;
    }
  }

  await prisma.registroAuditoria.create({ data: { accion: "IMPORTACION_COMPRADORES", recursoTipo: "Cliente", recursoNombre: `${stats.creados + stats.actualizados} compradores`, usuarioNombre: "Sistema", detalle: `creados:${stats.creados}, actualizados:${stats.actualizados}` } });

  console.log("✅ Compradores importados.\n");
  console.log(`   Creados nuevos:     ${stats.creados}`);
  console.log(`   Subidos a GANADO:   ${stats.actualizados} (ya existían como leads)`);
  console.log(`   Duplicados omitidos: ${stats.omitidos}`);
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error("❌", e); prisma.$disconnect(); process.exit(1); });
