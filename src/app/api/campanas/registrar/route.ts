import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

// Registra que a un cliente se le envió un mensaje de campaña (deja huella en su
// historial y actualiza "último contacto" para reactivar la cuenta).
const schema = z.object({
  clienteId: z.string(),
  campana: z.string().max(120).optional(),
  canal: z.string().max(20).default("WhatsApp"),
});

export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) return Response.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { clienteId, campana, canal } = schema.parse(await req.json());

    // Verificar acceso: admin todos; vendedor solo los suyos
    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { vendedorId: true, eliminadoEn: true } });
    if (!cliente || cliente.eliminadoEn) return Response.json({ error: "No encontrado" }, { status: 404 });
    if (sesion.rol !== "ADMIN" && cliente.vendedorId !== sesion.usuarioId) return Response.json({ error: "No autorizado" }, { status: 403 });

    await prisma.$transaction(async (tx) => {
      await tx.cliente.update({ where: { id: clienteId }, data: { ultimoContacto: new Date() } });
      await tx.interaccion.create({
        data: {
          clienteId,
          tipo: "campana",
          descripcion: `📣 Campaña enviada por ${canal}${campana ? `: "${campana}"` : ""}`,
          usuarioNombre: sesion.nombre,
          usuarioId: sesion.usuarioId,
        },
      });
    });

    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: "Datos inválidos" }, { status: 400 });
    return Response.json({ error: "Error al registrar" }, { status: 500 });
  }
}
