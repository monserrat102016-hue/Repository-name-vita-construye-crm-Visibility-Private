import { obtenerUsuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { Wallet, Plus, AlertTriangle } from "lucide-react";
import { formatearMoneda, formatearFechaCorta } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pagos" };

export default async function PagosPage({ searchParams }: { searchParams: Promise<{ estatus?: string }> }) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");
  if (usuario.rol !== "ADMIN") redirect("/dashboard"); // Solo el admin ve montos y métodos de pago

  const params = await searchParams;
  const filtroEstatus = params.estatus;
  const esAdmin = usuario.rol === "ADMIN";

  const where: Record<string, unknown> = {
    eliminadoEn: null,
    ...(filtroEstatus ? { estatus: filtroEstatus } : {}),
    ...(!esAdmin ? { cliente: { vendedorId: usuario.id } } : {}),
  };

  const [pagos, resumen] = await Promise.all([
    prisma.pago.findMany({
      where,
      include: { cliente: { select: { id: true, nombre: true } } },
      orderBy: { creadoEn: "desc" },
      take: 100,
    }),
    prisma.pago.groupBy({
      by: ["estatus"],
      where: { eliminadoEn: null, ...(!esAdmin ? { cliente: { vendedorId: usuario.id } } : {}) },
      _sum: { monto: true },
      _count: true,
    }),
  ]);

  const totalCobrado = resumen.find(r => r.estatus === "pagado")?._sum.monto || 0;
  const totalVencido = resumen.find(r => r.estatus === "vencido")?._sum.monto || 0;
  const totalPendiente = resumen.find(r => r.estatus === "pendiente")?._sum.monto || 0;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-[var(--color-acento-pagos)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Pagos</h1>
        </div>
        <Link href="/pagos/nuevo" className="flex items-center gap-2 px-4 py-2 bg-[var(--color-brand)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--color-brand-dark)] transition-colors">
          <Plus className="h-4 w-4" /> Registrar pago
        </Link>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center p-4">
          <p className="text-2xl font-bold text-green-600">{formatearMoneda(totalCobrado)}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Cobrado</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-2xl font-bold text-yellow-600">{formatearMoneda(totalPendiente)}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Pendiente</p>
        </Card>
        <Card className={`text-center p-4 ${totalVencido > 0 ? "border-red-200 bg-red-50/50 dark:bg-red-900/10" : ""}`}>
          <p className={`text-2xl font-bold ${totalVencido > 0 ? "text-red-600" : "text-[var(--color-text-muted)]"}`}>{formatearMoneda(totalVencido)}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Vencido</p>
        </Card>
      </div>

      {totalVencido > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">Tienes {formatearMoneda(totalVencido)} en pagos vencidos. Cobrar esto es la venta más fácil.</p>
        </div>
      )}

      {/* Lista */}
      {pagos.length === 0 ? (
        <Card className="py-12 text-center">
          <Wallet className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-[var(--color-text-muted)]">Sin pagos registrados aún.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {pagos.map((p) => (
            <Card key={p.id} hover className="flex items-center gap-4">
              <div className={`w-2 h-10 rounded-full shrink-0 ${p.estatus === "pagado" ? "bg-green-500" : p.estatus === "vencido" ? "bg-red-500" : "bg-yellow-400"}`} />
              <div className="flex-1 min-w-0">
                <Link href={`/clientes/${p.cliente.id}`} className="nombre-cliente text-sm">
                  {p.cliente.nombre}
                </Link>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {p.concepto || "Sin concepto"} · {p.metodo}
                  {p.fechaPago && ` · ${formatearFechaCorta(p.fechaPago)}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-[var(--color-text-primary)]">{formatearMoneda(p.monto)}</p>
                <Badge color={p.estatus === "pagado" ? "green" : p.estatus === "vencido" ? "red" : "yellow"} className="text-[10px]">
                  {p.estatus}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
