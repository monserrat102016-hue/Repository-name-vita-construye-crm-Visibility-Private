import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "vita-construye-secret-dev-key-2026-change-in-production"
);

const COOKIE_NAME = "vita_session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 días en segundos

export interface SesionPayload {
  usuarioId: string;
  correo: string;
  nombre: string;
  rol: string;
}

export async function crearSesion(payload: SesionPayload) {
  const expira = new Date(Date.now() + SESSION_DURATION * 1000);

  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expira)
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expira,
    path: "/",
  });
}

export async function obtenerSesion(): Promise<SesionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SesionPayload;
  } catch {
    return null;
  }
}

export async function eliminarSesion() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function obtenerUsuarioActual() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.usuarioId },
    select: {
      id: true,
      nombre: true,
      correo: true,
      rol: true,
      activo: true,
      foto: true,
      metaMensual: true,
      onboardingCompletado: true,
      temaPreferencia: true,
      vistaCompacta: true,
    },
  });

  if (!usuario || !usuario.activo) return null;
  return usuario;
}

export type UsuarioActual = NonNullable<Awaited<ReturnType<typeof obtenerUsuarioActual>>>;

export function puede(usuario: UsuarioActual, accion: string, recurso?: string): boolean {
  if (!usuario.activo) return false;
  if (usuario.rol === "ADMIN") return true;
  if (usuario.rol === "LECTURA") {
    return accion === "leer";
  }
  // VENDEDOR puede todo menos admin
  const accionesAdmin = ["gestionar-usuarios", "exportar-todo", "ver-todo-equipo", "vaciar-papelera", "configurar-negocio"];
  if (accionesAdmin.includes(accion)) return false;
  return true;
}
