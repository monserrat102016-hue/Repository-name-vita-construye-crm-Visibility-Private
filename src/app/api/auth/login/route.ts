import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { crearSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

const schema = z.object({
  correo: z.string().email("Correo inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

// Rate limit simple en memoria (en producción usar Redis o similiar)
const intentos = new Map<string, { count: number; resetEn: number }>();

function verificarRateLimit(ip: string): boolean {
  const ahora = Date.now();
  const registro = intentos.get(ip);
  if (registro && registro.resetEn > ahora) {
    if (registro.count >= 5) return false;
    registro.count++;
  } else {
    intentos.set(ip, { count: 1, resetEn: ahora + 15 * 60 * 1000 });
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "desconocida";
    if (!verificarRateLimit(ip)) {
      return Response.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });
    }

    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { correo, password } = result.data;
    const usuario = await prisma.usuario.findUnique({ where: { correo } });

    // Respuesta genérica para no revelar si el correo existe
    const MENSAJE_GENERICO = "Correo o contraseña incorrectos";

    if (!usuario || !usuario.activo) {
      await bcrypt.compare(password, "$2b$12$placeholder.hash.to.prevent.timing.attacks");
      return Response.json({ error: MENSAJE_GENERICO }, { status: 401 });
    }

    const passwordOk = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordOk) {
      return Response.json({ error: MENSAJE_GENERICO }, { status: 401 });
    }

    await crearSesion({
      usuarioId: usuario.id,
      correo: usuario.correo,
      nombre: usuario.nombre,
      rol: usuario.rol,
    });

    await registrarAuditoria({
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      accion: "inició sesión",
      recursoTipo: "usuario",
      recursoId: usuario.id,
      ip,
    });

    return Response.json({ ok: true, rol: usuario.rol });
  } catch {
    return Response.json({ error: "Error del servidor" }, { status: 500 });
  }
}
