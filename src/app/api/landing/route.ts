import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  nombre: z.string().min(2).max(100),
  telefono: z.string().min(8).max(20),
  correo: z.string().email().optional().or(z.literal("")),
  utm: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Buscar duplicado por teléfono
    const telefonoLimpio = data.telefono.replace(/\D/g, "");
    const existente = await prisma.cliente.findFirst({
      where: { telefono: { contains: telefonoLimpio }, eliminadoEn: null },
      select: { id: true },
    });
    if (existente) {
      // No crear duplicado, pero tampoco revelar que ya existe
      return NextResponse.json({ ok: true });
    }

    // Determinar canal desde UTM
    let canal: string | null = null;
    const utm = data.utm ?? "";
    if (utm.includes("facebook") || utm.includes("fb")) canal = "Facebook";
    else if (utm.includes("instagram") || utm.includes("ig")) canal = "Instagram";
    else if (utm.includes("google")) canal = "Google";
    else if (utm.includes("whatsapp")) canal = "WhatsApp";
    else canal = "Landing";

    const proximaAccion = new Date();
    proximaAccion.setHours(proximaAccion.getHours() + 2); // contactar en 2 horas

    await prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.create({
        data: {
          nombre: data.nombre,
          telefono: data.telefono,
          correo: data.correo || null,
          etapa: "Nuevo",
          temperatura: "Tibio",
          origen: canal,
          utmCampaign: data.utm || null,
          proximaAccion: `Contactar lead de ${canal}`,
          proximaAccionFecha: proximaAccion,
          notas: utm ? `UTM: ${utm}` : null,
        },
      });

      await tx.interaccion.create({
        data: {
          clienteId: cliente.id,
          tipo: "NOTA",
          descripcion: `Lead capturado desde landing page (${canal}). Nombre: ${data.nombre}, Teléfono: ${data.telefono}.`,
          usuarioNombre: "Sistema",
        },
      });

      await tx.registroAuditoria.create({
        data: {
          accion: "LEAD_LANDING",
          recursoTipo: "Cliente",
          recursoId: cliente.id,
          recursoNombre: data.nombre,
          usuarioNombre: "Landing",
          detalle: `canal:${canal},utm:${data.utm ?? ""}`,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    console.error("Landing API error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
