import { obtenerUsuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { XCircle } from "lucide-react";
import { formatearMoneda, formatearFechaCorta, iniciales } from "@/lib/utils";
import type { Metadata } from "next";
import ReactivarBtn from "./ReactivarBtn";

export const metadata: Metadata = { title: "Perdidos" };

export default async function PerdidosPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const filtroBase = {
    estadoCartera: "PERDIDO",
    eliminadoEn: null as null,
    ...(usuario.rol !== "ADMIN" ? { vendedorId: usuario.id } : {}),
  };

  const [clientes, motivos] = await Promise.all([
    prisma.cliente.findMany({
      where: filtroBase,
      orderBy: { perdidoEn: "desc" },
      take: 100,
    }),
    prisma.cliente.groupBy({
      by: ["motivoPerdida"],
      where: { ...filtroBase, motivoPerdida: { not: null } },
      _count: true,
      orderBy: { _count: { motivoPerdida: "desc" } },
    }),
  ]);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <XCircle className="h-5 w-5 text-[var(--color-acento-perdidos)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Perdidos</h1>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)]">Aprende por qué y reactívalos cuando sea el momento.</p>

      {motivos.length > 0 && (
        <Card>
          <h2 className="font-bold text-[var(--color-text-primary)] mb-3">Motivos más comunes</h2>
          <div className="space-y-2">
            {motivos.map((m) => (
              <div key={m.motivoPerdida} className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">{m.motivoPerdida}</span>
                <span className="font-semibold">{m._count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {clientes.length === 0 ? (
        <Card className="py-16 text-center">
          <XCircle className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-[var(--color-text-secondary)] font-medium">No hay clientes perdidos</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {clientes.map((c) => (
            <Card key={c.id} hover className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold shrink-0">
                {iniciales(c.nombre)}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/clientes/${c.id}`} className="nombre-cliente text-base">{c.nombre}</Link>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {c.perdidoEn && `Perdido el ${formatearFechaCorta(c.perdidoEn)}`}
                  {c.motivoPerdida && ` · ${c.motivoPerdida}`}
                  {c.valorEstimado > 0 && ` · ${formatearMoneda(c.valorEstimado)}`}
                </p>
              </div>
              <ReactivarBtn clienteId={c.id} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
