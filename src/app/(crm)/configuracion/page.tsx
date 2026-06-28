import { obtenerUsuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Card from "@/components/ui/Card";
import { Settings } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const config = await prisma.configuracion.findUnique({ where: { id: "global" } });

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-[var(--color-brand)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Configuración</h1>
      </div>
      <Card>
        <h2 className="font-bold text-[var(--color-text-primary)] mb-3">Negocio</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2"><dt className="text-[var(--color-text-muted)] w-36">Nombre</dt><dd className="font-medium">{config?.nombreNegocio}</dd></div>
          <div className="flex gap-2"><dt className="text-[var(--color-text-muted)] w-36">Moneda</dt><dd className="font-medium">{config?.moneda}</dd></div>
          <div className="flex gap-2"><dt className="text-[var(--color-text-muted)] w-36">Meta mensual</dt><dd className="font-medium">${config?.metaMensual?.toLocaleString("es-MX")} MXN</dd></div>
          <div className="flex gap-2"><dt className="text-[var(--color-text-muted)] w-36">Horario citas</dt><dd className="font-medium">{config?.horarioInicio} – {config?.horarioFin} ({config?.duracionCita} min)</dd></div>
        </dl>
        {usuario.rol === "ADMIN" && (
          <p className="text-xs text-[var(--color-text-muted)] mt-4">La edición completa de configuración estará disponible próximamente.</p>
        )}
      </Card>
    </div>
  );
}
