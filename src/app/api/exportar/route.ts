import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

// Exporta la base de clientes a CSV (se abre directo en Excel).
// Solo el administrador puede exportar (la base incluye montos).
export async function GET(_req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (sesion.rol !== "ADMIN") return Response.json({ error: "Solo el administrador puede exportar la base" }, { status: 403 });

  const clientes = await prisma.cliente.findMany({
    where: { eliminadoEn: null },
    include: { vendedor: { select: { nombre: true } } },
    orderBy: { creadoEn: "desc" },
  });

  const columnas = [
    "Nombre", "Teléfono", "Correo", "Empresa", "Etapa", "Estado", "Temperatura",
    "Vendedor", "Origen", "Valor estimado", "Próxima acción", "Fecha próxima acción",
    "Último contacto", "Motivo de pérdida", "Fecha de alta", "Notas",
  ];

  const fmtFecha = (d: Date | null) => (d ? new Date(d).toLocaleDateString("es-MX") : "");
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    // Encerrar entre comillas y duplicar comillas internas; quitar saltos de línea
    return `"${s.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
  };

  const filas = clientes.map((c) => [
    c.nombre, c.telefono, c.correo, c.empresa, c.etapa, c.estadoCartera, c.temperatura,
    c.vendedor?.nombre || "Sin asignar", c.origen, c.valorEstimado,
    c.proximaAccion, fmtFecha(c.proximaAccionFecha), fmtFecha(c.ultimoContacto),
    c.motivoPerdida, fmtFecha(c.creadoEn), c.notas,
  ].map(esc).join(","));

  // BOM (﻿) para que Excel reconozca los acentos correctamente
  const csv = "﻿" + [columnas.map(esc).join(","), ...filas].join("\r\n");

  await registrarAuditoria({ usuarioId: sesion.usuarioId, usuarioNombre: sesion.nombre, accion: "exportó la base", recursoTipo: "cliente", recursoNombre: `${clientes.length} clientes` });

  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-vita-${fecha}.csv"`,
    },
  });
}
