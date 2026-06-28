import { obtenerUsuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { Archive } from "lucide-react";
import { formatearMoneda, formatearFechaCorta, iniciales } from "@/lib/utils";
import type { Metadata } from "next";
import RestaurarBtn from "./RestaurarBtn";

export const metadata: Metadata = { title: "Archivados" };

export default async function ArchivadosPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const clientes = await prisma.cliente.findMany({
    where: {
      estadoCartera: "ARCHIVADO",
      eliminadoEn: null,
      ...(usuario.rol !== "ADMIN" ? { vendedorId: usuario.id } : {}),
    },
    orderBy: { archivadoEn: "desc" },
    take: 100,
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Archive className="h-5 w-5 text-[var(--color-acento-archivados)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Archivados</h1>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)]">Guardados sin perder nada. Puedes restaurarlos en cualquier momento.</p>

      {clientes.length === 0 ? (
        <Card className="py-16 text-center">
          <Archive className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-[var(--color-text-secondary)] font-medium">No hay nada archivado</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {clientes.map((c) => (
            <Card key={c.id} hover className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-stone-300 dark:bg-stone-600 flex items-center justify-center text-stone-600 dark:text-stone-300 font-bold shrink-0">
                {iniciales(c.nombre)}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/clientes/${c.id}`} className="nombre-cliente text-base">{c.nombre}</Link>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Archivado el {c.archivadoEn ? formatearFechaCorta(c.archivadoEn) : "—"}
                  {c.valorEstimado > 0 && ` · ${formatearMoneda(c.valorEstimado)}`}
                </p>
              </div>
              <RestaurarBtn clienteId={c.id} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
