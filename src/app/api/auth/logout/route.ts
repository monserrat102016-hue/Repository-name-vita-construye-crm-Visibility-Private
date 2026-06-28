import { eliminarSesion } from "@/lib/auth";

export async function POST() {
  await eliminarSesion();
  return Response.json({ ok: true });
}
