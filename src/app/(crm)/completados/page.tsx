import { obtenerUsuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { Trophy } from "lucide-react";
import { formatearMoneda, formatearFechaCorta, iniciales } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Completados" };

export default async function CompletadosPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const filtroBase = {
    estadoCartera: "GANADO",
    eliminadoEn: null as null,
    ...(usuario.rol !== "ADMIN" ? { vendedorId: usuario.id } : {}),
  };

  const [clientes, totalMonto] = await Promise.all([
    prisma.cliente.findMany({
      where: filtroBase,
      orderBy: { ganadoEn: "desc" },
      include: { pagos: { where: { eliminadoEn: null }, select: { monto: true, estatus: true } } },
      take: 100,
    }),
    prisma.cliente.aggregate({ where: filtroBase, _sum: { valorEstimado: true } }),
  ]);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-[var(--color-acento-completados)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Tu muro de victorias</h1>
      </div>
      {clientes.length === 0 ? (
        <Card className="py-16 text-center">
          <Trophy className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-[var(--color-text-secondary)] font-medium">Aún no tienes clientes completados</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Cierra tu primera venta y aparecerá aquí 🎉</p>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <Trophy className="h-6 w-6 text-green-600 shrink-0" />
            <div>
              <p className="font-bold text-green-700 dark:text-green-400">{clientes.length} ventas cerradas</p>
              <p className="text-sm text-green-600 dark:text-green-500">Total: {formatearMoneda(totalMonto._sum.valorEstimado || 0)}</p>
            </div>
          </div>
          <div className="space-y-3">
            {clientes.map((c) => {
              const totalPagado = c.pagos.filter(p => p.estatus === "pagado").reduce((a, p) => a + p.monto, 0);
              return (
                <Card key={c.id} hover className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shrink-0">
                    {iniciales(c.nombre)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/clientes/${c.id}`} className="nombre-cliente text-base">
                      {c.nombre}
                    </Link>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Cerrado el {formatearFechaCorta(c.ganadoEn)} · {formatearMoneda(c.valorEstimado)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-green-600">{formatearMoneda(totalPagado)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">cobrado</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
