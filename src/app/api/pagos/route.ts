import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

const schemaPago = z.object({
  clienteId: z.string(),
  monto: z.number().min(0.01, "El monto debe ser mayor a 0"),
  moneda: z.string().default("MXN"),
  metodo: z.string().min(1, "Método requerido"),
  estatus: z.string().default("pendiente"),
  fechaPago: z.string().optional(),
  fechaVencimiento: z.string().optional(),
  concepto: z.string().optional(),
  notas: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (sesion.rol !== "ADMIN") return Response.json({ error: "Solo el administrador puede registrar pagos" }, { status: 403 });

  try {
    const body = await req.json();
    const data = schemaPago.parse(body);

    // Verificar acceso al cliente
    const cliente = await prisma.cliente.findUnique({ where: { id: data.clienteId }, select: { vendedorId: true, nombre: true } });
    if (!cliente) return Response.json({ error: "Cliente no encontrado" }, { status: 404 });
    if (sesion.rol !== "ADMIN" && cliente.vendedorId !== sesion.usuarioId) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener y actualizar folio
    const contador = await prisma.contador.update({
      where: { id: "folio_pago" },
      data: { valor: { increment: 1 } },
    });

    const pago = await prisma.$transaction(async (tx) => {
      const p = await tx.pago.create({
        data: {
          ...data,
          folio: contador.valor,
          fechaPago: data.fechaPago ? new Date(data.fechaPago) : null,
          fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
        },
      });

      // Registrar en la línea de tiempo
      await tx.interaccion.create({
        data: {
          clienteId: data.clienteId,
          tipo: "pago",
          descripcion: `Pago ${data.estatus === "pagado" ? "recibido" : "registrado"}: $${data.monto.toLocaleString("es-MX")} por ${data.metodo}`,
          usuarioNombre: sesion.nombre,
          usuarioId: sesion.usuarioId,
        },
      });

      return p;
    });

    await registrarAuditoria({ usuarioId: sesion.usuarioId, usuarioNombre: sesion.nombre, accion: "creó pago", recursoTipo: "pago", recursoId: pago.id, recursoNombre: cliente.nombre });
    return Response.json({ pago }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: e.issues[0].message }, { status: 400 });
    return Response.json({ error: "Error al registrar pago" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (sesion.rol !== "ADMIN") return Response.json({ error: "No autorizado" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const clienteId = searchParams.get("clienteId");
  const estatus = searchParams.get("estatus");
  const esAdmin = sesion.rol === "ADMIN";

  const where: Record<string, unknown> = {
    eliminadoEn: null,
    ...(clienteId ? { clienteId } : {}),
    ...(estatus ? { estatus } : {}),
    ...(!esAdmin ? { cliente: { vendedorId: sesion.usuarioId } } : {}),
  };

  const pagos = await prisma.pago.findMany({
    where,
    include: { cliente: { select: { id: true, nombre: true } } },
    orderBy: { creadoEn: "desc" },
    take: 100,
  });

  return Response.json({ pagos });
}
