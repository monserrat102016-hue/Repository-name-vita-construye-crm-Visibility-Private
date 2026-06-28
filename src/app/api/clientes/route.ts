import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

const schemaCliente = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(200),
  telefono: z.string().optional(),
  correo: z.string().email("Correo inválido").optional().or(z.literal("")),
  origen: z.string().optional(),
  etapa: z.string().optional(),
  temperatura: z.string().optional(),
  objecionPrincipal: z.string().optional(),
  notas: z.string().optional(),
  proximaAccion: z.string().optional(),
  proximaAccionFecha: z.string().optional(),
  valorEstimado: z.number().min(0).optional(),
  probabilidadCierre: z.number().min(0).max(100).optional(),
  prioridad: z.string().optional(),
  tipoCliente: z.string().optional(),
  tipoObra: z.string().optional(),
  m2Aproximados: z.number().optional(),
  productoInteres: z.string().optional(),
  empresa: z.string().optional(),
  giroEmpresa: z.string().optional(),
  puestoContacto: z.string().optional(),
  rfcEmpresa: z.string().optional(),
  sitioWebEmpresa: z.string().optional(),
  tamanoEmpresa: z.string().optional(),
  notasEmpresa: z.string().optional(),
  vendedorId: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const buscar = searchParams.get("buscar") || "";
  const estado = searchParams.get("estado") || "ACTIVO";
  const etapa = searchParams.get("etapa") || "";
  const pagina = parseInt(searchParams.get("pagina") || "1");
  const porPagina = 25;
  const esAdmin = sesion.rol === "ADMIN";

  const where: Record<string, unknown> = {
    eliminadoEn: null,
    ...(estado !== "TODOS" ? { estadoCartera: estado } : {}),
    ...(esAdmin ? {} : { vendedorId: sesion.usuarioId }),
    ...(etapa ? { etapa } : {}),
  };

  if (buscar) {
    where.OR = [
      { nombre: { contains: buscar } },
      { telefono: { contains: buscar } },
      { correo: { contains: buscar } },
      { empresa: { contains: buscar } },
      { notas: { contains: buscar } },
    ];
  }

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      include: {
        vendedor: { select: { id: true, nombre: true } },
        etiquetas: { include: { etiqueta: true } },
        pagos: { where: { eliminadoEn: null }, select: { monto: true, estatus: true } },
      },
      orderBy: { actualizadoEn: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.cliente.count({ where }),
  ]);

  return Response.json({ clientes, total });
}

export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) return Response.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schemaCliente.parse(body);

    // Verificar duplicado por teléfono o correo
    if (data.telefono || data.correo) {
      const existente = await prisma.cliente.findFirst({
        where: {
          eliminadoEn: null,
          OR: [
            ...(data.telefono ? [{ telefono: data.telefono }] : []),
            ...(data.correo ? [{ correo: data.correo }] : []),
          ],
        },
        select: { id: true, nombre: true },
      });
      if (existente) {
        return Response.json({
          error: "duplicado",
          mensaje: `Ya tienes a ${existente.nombre} con este contacto.`,
          clienteId: existente.id,
        }, { status: 409 });
      }
    }

    const vendedorId = sesion.rol === "ADMIN" && data.vendedorId ? data.vendedorId : sesion.usuarioId;

    const cliente = await prisma.$transaction(async (tx) => {
      const c = await tx.cliente.create({
        data: {
          ...data,
          vendedorId,
          correo: data.correo || null,
          proximaAccionFecha: data.proximaAccionFecha ? new Date(data.proximaAccionFecha) : null,
        },
      });
      await tx.interaccion.create({
        data: {
          clienteId: c.id,
          tipo: "nota",
          descripcion: `Cliente creado${data.origen ? ` — origen: ${data.origen}` : ""}`,
          usuarioNombre: sesion.nombre,
          usuarioId: sesion.usuarioId,
        },
      });
      return c;
    });

    await registrarAuditoria({
      usuarioId: sesion.usuarioId,
      usuarioNombre: sesion.nombre,
      accion: "creó",
      recursoTipo: "cliente",
      recursoId: cliente.id,
      recursoNombre: cliente.nombre,
    });

    return Response.json({ cliente }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: e.issues[0].message }, { status: 400 });
    return Response.json({ error: "Error al crear cliente" }, { status: 500 });
  }
}
