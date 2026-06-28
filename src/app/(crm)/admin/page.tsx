import { obtenerUsuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Card from "@/components/ui/Card";
import { ShieldCheck } from "lucide-react";
import { formatearFecha } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Panel Admin" };

export default async function AdminPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");
  if (usuario.rol !== "ADMIN") redirect("/dashboard");

  const [usuarios, bitacora] = await Promise.all([
    prisma.usuario.findMany({ orderBy: { creadoEn: "asc" }, select: { id: true, nombre: true, correo: true, rol: true, activo: true, metaMensual: true } }),
    prisma.registroAuditoria.findMany({ orderBy: { creadoEn: "desc" }, take: 20 }),
  ]);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-[var(--color-brand)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Panel Admin</h1>
      </div>

      <Card>
        <h2 className="font-bold text-[var(--color-text-primary)] mb-3">Usuarios ({usuarios.length})</h2>
        <div className="space-y-2">
          {usuarios.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-surface-border)]">
              <div>
                <p className="font-semibold text-sm">{u.nombre}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{u.correo} · {u.rol}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {u.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-bold text-[var(--color-text-primary)] mb-3">Actividad reciente</h2>
        <div className="space-y-2">
          {bitacora.map((r) => (
            <div key={r.id} className="flex items-start gap-3 text-sm py-2 border-b border-[var(--color-surface-border)] last:border-0">
              <div className="flex-1">
                <span className="font-medium">{r.usuarioNombre}</span>
                <span className="text-[var(--color-text-muted)]"> {r.accion} </span>
                {r.recursoNombre && <span className="text-[var(--color-text-primary)]">{r.recursoNombre}</span>}
              </div>
              <span className="text-xs text-[var(--color-text-muted)] shrink-0">{formatearFecha(r.creadoEn)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
