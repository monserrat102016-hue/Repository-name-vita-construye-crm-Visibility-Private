/**
 * Importador de contactos reales de Vita Construye (desde Excel).
 * Lee prisma/contactos-reales.json, mapea cada contacto a una etapa del
 * embudo según su estatus, y los inserta SIN duplicar (por teléfono/correo).
 *
 * Uso:  npm run importar
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaNeon } from "@prisma/adapter-neon";
import fs from "node:fs";
import path from "node:path";

function crearCliente() {
  const url = process.env["DATABASE_URL"] ?? "file:./dev.db";
  if (url.startsWith("file:")) {
    const adapter = new PrismaBetterSqlite3({ url: url.replace("file:", "") });
    return new PrismaClient({ adapter } as any);
  }
  const adapter = new PrismaNeon({ connectionString: url });
  return new PrismaClient({ adapter } as any);
}
const prisma = crearCliente();

interface Contacto {
  nombre: string; fecha: string; telefono: string; correo: string;
  proyecto: string; atiende: string; presEnviado: string; folio: string;
  estatus: string; comproJ: string; resultadoK: string; fechaL: string;
}

interface Mapeo {
  etapa: string; estadoCartera: string; temperatura: string;
  motivoPerdida: string | null; proximaAccion: string | null; diasProxima: number | null;
}

// ─── Clasificador de estatus → etapa del embudo ──────────────────────────────
function clasificar(c: Contacto): Mapeo | null {
  const est = (c.estatus || "").toLowerCase().trim();
  const res = (c.resultadoK || "").toLowerCase().trim();
  const todo = `${est} ${res}`;

  // Saltar repetidos
  if (est === "repetido") return null;

  // ── GANADO ──
  if (
    est === "compro" || est === "compró" || /ya compr/.test(est) ||
    /se vendi/.test(est) || /venta complet/.test(res)
  ) {
    return { etapa: "Pedido Confirmado", estadoCartera: "GANADO", temperatura: "Caliente", motivoPerdida: null, proximaAccion: null, diasProxima: null };
  }

  // ── PERDIDO: se fue con la competencia / otro producto ──
  if (/compr[oó] en otro|opto por|busca otro|busca bovedilla|otro sistema|propuestas m[aá]s econ/.test(todo)) {
    const motivo = /econ[oó]m|otro lado/.test(todo) ? "Precio alto" : "Se fue con la competencia";
    return { etapa: "Perdido", estadoCartera: "PERDIDO", temperatura: "Frio", motivoPerdida: motivo, proximaAccion: null, diasProxima: null };
  }

  // ── PERDIDO: no contestó ──
  if (/no\s*con?test|no responde|no repond|ya no respond|ya no contest/.test(todo)) {
    return { etapa: "Perdido", estadoCartera: "PERDIDO", temperatura: "Frio", motivoPerdida: "No contestó", proximaAccion: null, diasProxima: null };
  }

  // ── PERDIDO: otros ──
  if (/ya concluy/.test(res)) {
    return { etapa: "Perdido", estadoCartera: "PERDIDO", temperatura: "Frio", motivoPerdida: "No era buen momento", proximaAccion: null, diasProxima: null };
  }
  if (/necesita otro servicio/.test(todo)) {
    return { etapa: "Perdido", estadoCartera: "PERDIDO", temperatura: "Frio", motivoPerdida: "No calificaba", proximaAccion: null, diasProxima: null };
  }

  // ── ACTIVO: cotización enviada / esperando respuesta ──
  if (/cotiz|esperando respuesta|espera de respuesta|ficha t|flyer|generando/.test(todo)) {
    return { etapa: "Cotización Enviada", estadoCartera: "ACTIVO", temperatura: "Tibio", motivoPerdida: null, proximaAccion: "Dar seguimiento a la cotización enviada", diasProxima: 2 };
  }

  // ── ACTIVO: seguimiento / proyecto en pausa o a futuro ──
  if (/proyecto (en pausa|para|en revisi)|contactar a|se comunica desp|licencias|lluvias|revisar[aá] medidas|^seguimiento$|diciembre|marzo|agosto/.test(todo)) {
    return { etapa: "Seguimiento", estadoCartera: "ACTIVO", temperatura: "Frio", motivoPerdida: null, proximaAccion: "Retomar contacto sobre el proyecto", diasProxima: 7 };
  }

  // ── ACTIVO: contactado ──
  if (/en contacto|se contact|contesto|constesto|revisar/.test(todo)) {
    return { etapa: "Contactado", estadoCartera: "ACTIVO", temperatura: "Tibio", motivoPerdida: null, proximaAccion: "Enviar cotización", diasProxima: 1 };
  }

  // ── ACTIVO: nuevo (sin estatus) ──
  return { etapa: "Nuevo", estadoCartera: "ACTIVO", temperatura: "Tibio", motivoPerdida: null, proximaAccion: "Contactar a este prospecto", diasProxima: 1 };
}

function normalizarTelefono(tel: string): { local: string; intl: string } | null {
  let n = (tel || "").replace(/\D/g, "");
  if (!n) return null;
  if (n.startsWith("52") && n.length === 12) n = n.slice(2);
  if (n.length === 11 && n.startsWith("1")) n = n.slice(1);
  if (n.length < 10) return null;
  if (n.length > 10) n = n.slice(-10);
  return { local: n, intl: `52${n}` };
}

function limpiarCorreo(correo: string): string | null {
  const c = (correo || "").replace(/\s+/g, "").trim();
  if (!c || !/^[^@]+@[^@]+\.[^@]+$/.test(c)) return null;
  return c.toLowerCase();
}

function fechaDesde(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso + "T12:00:00");
  return isNaN(d.getTime()) ? null : d;
}

async function main() {
  const archivo = path.join(__dirname, "contactos-reales.json");
  const contactos: Contacto[] = JSON.parse(fs.readFileSync(archivo, "utf8"));
  console.log(`📋 ${contactos.length} contactos en el archivo.\n`);

  // Cargar existentes para no duplicar
  const existentes = await prisma.cliente.findMany({
    where: { eliminadoEn: null },
    select: { telefono: true, correo: true },
  });
  const telExistentes = new Set(existentes.map((e) => (e.telefono || "").replace(/\D/g, "")).filter(Boolean));
  const mailExistentes = new Set(existentes.map((e) => (e.correo || "").toLowerCase()).filter(Boolean));

  const vistosTel = new Set<string>();
  const vistosMail = new Set<string>();

  const stats = { creados: 0, duplicados: 0, repetidos: 0, porEtapa: {} as Record<string, number> };

  for (const c of contactos) {
    if (!c.nombre || !c.nombre.trim()) continue;

    const mapeo = clasificar(c);
    if (!mapeo) { stats.repetidos++; continue; }

    const tel = normalizarTelefono(c.telefono);
    const mail = limpiarCorreo(c.correo);

    // Dedup
    const telKey = tel?.local || "";
    const mailKey = mail || "";
    if ((telKey && (telExistentes.has(telKey) || vistosTel.has(telKey))) ||
        (mailKey && (mailExistentes.has(mailKey) || vistosMail.has(mailKey)))) {
      stats.duplicados++;
      continue;
    }
    if (telKey) vistosTel.add(telKey);
    if (mailKey) vistosMail.add(mailKey);

    const fechaContacto = fechaDesde(c.fecha);
    const ahora = new Date();

    let proximaFecha: Date | null = null;
    if (mapeo.proximaAccion && mapeo.diasProxima != null) {
      proximaFecha = new Date(ahora.getTime() + mapeo.diasProxima * 86400000);
    }

    // Notas: proyecto + quién atendió + estatus original
    const partesNota: string[] = [];
    if (c.proyecto) partesNota.push(c.proyecto.trim());
    if (c.atiende && /[a-z]/i.test(c.atiende)) partesNota.push(`Atendió: ${c.atiende.trim()}`);
    const estatusOrig = [c.estatus, c.resultadoK].filter((x) => x && x.trim()).join(" · ");
    if (estatusOrig) partesNota.push(`Estatus original: ${estatusOrig}`);
    const notas = partesNota.join("\n") || null;

    await prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.create({
        data: {
          nombre: c.nombre.trim(),
          telefono: tel?.local || null,
          telefonoInternacional: tel?.intl || null,
          correo: mail,
          etapa: mapeo.etapa,
          estadoCartera: mapeo.estadoCartera,
          temperatura: mapeo.temperatura,
          motivoPerdida: mapeo.motivoPerdida,
          proximaAccion: mapeo.proximaAccion,
          proximaAccionFecha: proximaFecha,
          productoInteres: "Vigueta y Bovedilla",
          origen: "Importación Excel",
          utmCampaign: "Carga inicial",
          notas,
          ultimoContacto: fechaContacto,
          ganadoEn: mapeo.estadoCartera === "GANADO" ? (fechaContacto || ahora) : null,
          perdidoEn: mapeo.estadoCartera === "PERDIDO" ? (fechaContacto || ahora) : null,
          creadoEn: fechaContacto || ahora,
        },
      });

      await tx.interaccion.create({
        data: {
          clienteId: cliente.id,
          tipo: "NOTA",
          descripcion: `Cliente importado del historial. Proyecto: ${c.proyecto || "(sin descripción)"}. Estatus: ${estatusOrig || "nuevo"}.`,
          usuarioNombre: "Importación",
          fecha: fechaContacto || ahora,
        },
      });
    });

    stats.creados++;
    stats.porEtapa[mapeo.etapa] = (stats.porEtapa[mapeo.etapa] || 0) + 1;
  }

  // Auditoría global
  await prisma.registroAuditoria.create({
    data: {
      accion: "IMPORTACION_CONTACTOS",
      recursoTipo: "Cliente",
      recursoNombre: `${stats.creados} contactos importados`,
      usuarioNombre: "Sistema",
      detalle: `creados:${stats.creados}, duplicados:${stats.duplicados}, repetidos:${stats.repetidos}`,
    },
  });

  console.log("✅ Importación completada.\n");
  console.log(`   Creados:     ${stats.creados}`);
  console.log(`   Duplicados:  ${stats.duplicados} (omitidos)`);
  console.log(`   Repetidos:   ${stats.repetidos} (marcados REPETIDO, omitidos)`);
  console.log("\n   Por etapa:");
  Object.entries(stats.porEtapa).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`     ${k}: ${v}`));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error("❌ Error:", e); prisma.$disconnect(); process.exit(1); });
