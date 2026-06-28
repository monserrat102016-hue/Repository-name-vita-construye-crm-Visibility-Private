import { obtenerUsuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { ListChecks, AlertTriangle, Phone, MessageCircle, Flame } from "lucide-react";
import { formatearFechaCorta, emojiTemperatura, formatearMoneda, diasSinContacto } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Seguimiento — Hoy te toca" };

export default async function SeguimientoPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const manana = new Date(hoy.getTime() + 86400000);
  const hace24h = new Date(ahora.getTime() - 86400000);

  const filtroBase = {
    estadoCartera: "ACTIVO",
    eliminadoEn: null as null,
    ...(usuario.rol !== "ADMIN" ? { vendedorId: usuario.id } : {}),
  };

  const [vencidos, hoyContactar, leadsFrios, sinAccion] = await Promise.all([
    // Acciones vencidas
    prisma.cliente.findMany({
      where: { ...filtroBase, proximaAccionFecha: { lt: hoy } },
      orderBy: [{ temperatura: "asc" }, { proximaAccionFecha: "asc" }],
      take: 50,
    }),
    // Hoy contactar
    prisma.cliente.findMany({
      where: { ...filtroBase, proximaAccionFecha: { gte: hoy, lt: manana } },
      orderBy: [{ temperatura: "asc" }, { valorEstimado: "desc" }],
      take: 50,
    }),
    // Leads nuevos sin contactar >24h
    prisma.cliente.findMany({
      where: { ...filtroBase, etapa: "Nuevo", ultimoContacto: null, creadoEn: { lt: hace24h } },
      orderBy: { creadoEn: "asc" },
      take: 20,
    }),
    // Sin próxima acción
    prisma.cliente.count({ where: { ...filtroBase, proximaAccion: null } }),
  ]);

  const ordenarPorTemp = (a: typeof vencidos[0]) => {
    if (a.temperatura === "Caliente") return 0;
    if (a.temperatura === "Tibio") return 1;
    return 2;
  };

  const todosHoy = [...vencidos, ...hoyContactar]
    .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
    .sort((a, b) => ordenarPorTemp(a) - ordenarPorTemp(b) || b.valorEstimado - a.valorEstimado);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ListChecks className="h-5 w-5 text-[var(--color-acento-seguimiento)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Hoy te toca</h1>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">A quién contactar hoy, ordenado por prioridad. Esto es lo primero que debes abrir cada mañana.</p>
      </div>

      {/* Alertas */}
      {(leadsFrios.length > 0 || sinAccion > 0) && (
        <div className="space-y-3">
          {leadsFrios.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400">⚠️ {leadsFrios.length} lead{leadsFrios.length !== 1 ? "s" : ""} frío{leadsFrios.length !== 1 ? "s" : ""} por demora</p>
                <p className="text-sm text-red-600 dark:text-red-500">Llevan más de 24 h sin primer contacto. El primero que contacta, gana.</p>
              </div>
            </div>
          )}
          {sinAccion > 0 && (
            <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
              <Flame className="h-5 w-5 text-orange-500 shrink-0" />
              <p className="text-orange-700 dark:text-orange-400"><strong>{sinAccion}</strong> cliente{sinAccion !== 1 ? "s" : ""} activo{sinAccion !== 1 ? "s" : ""} sin próxima acción definida — defíneles una hoy.</p>
            </div>
          )}
        </div>
      )}

      {/* Leads nuevos sin contactar */}
      {leadsFrios.length > 0 && (
        <Card>
          <h2 className="font-bold text-red-600 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Leads nuevos sin primer contacto
          </h2>
          <div className="space-y-2">
            {leadsFrios.map((c) => (
              <ClienteRow key={c.id} cliente={c} urgencia="red" />
            ))}
          </div>
        </Card>
      )}

      {/* Hoy te toca */}
      {todosHoy.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="font-semibold text-[var(--color-text-primary)]">Hoy no tienes pendientes</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">¡Buen trabajo! Aprovecha para generar nuevos contactos.</p>
        </Card>
      ) : (
        <Card>
          <h2 className="font-bold text-[var(--color-text-primary)] mb-4">
            {todosHoy.length} cliente{todosHoy.length !== 1 ? "s" : ""} para contactar hoy
          </h2>
          <div className="space-y-2">
            {todosHoy.map((c) => {
              const vencido = c.proximaAccionFecha && new Date(c.proximaAccionFecha) < hoy;
              return <ClienteRow key={c.id} cliente={c} urgencia={vencido ? "red" : "normal"} />;
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function ClienteRow({ cliente: c, urgencia }: { cliente: Record<string, unknown>; urgencia: "red" | "normal" }) {
  const cl = c as {
    id: string; nombre: string; telefono?: string | null; temperatura: string;
    valorEstimado: number; proximaAccion?: string | null; proximaAccionFecha?: unknown;
    etapa: string; objecionPrincipal?: string | null;
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${urgencia === "red" ? "border-red-200 bg-red-50/50 dark:bg-red-900/10" : "border-[var(--color-surface-border)] hover:bg-[var(--color-surface-raised)]"} transition-colors`}>
      <span className="text-xl shrink-0">{emojiTemperatura(cl.temperatura)}</span>
      <div className="flex-1 min-w-0">
        <Link href={`/clientes/${cl.id}`} className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-brand)] hover:underline">
          {cl.nombre}
        </Link>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] flex-wrap">
          <span>{cl.etapa}</span>
          {cl.valorEstimado > 0 && <span>· {formatearMoneda(cl.valorEstimado)}</span>}
          {cl.objecionPrincipal && <span>· 💬 {cl.objecionPrincipal}</span>}
        </div>
        {cl.proximaAccion && (
          <p className={`text-xs mt-0.5 font-medium ${urgencia === "red" ? "text-red-600" : "text-[var(--color-text-secondary)]"}`}>
            {urgencia === "red" ? "⚠️ " : ""}{cl.proximaAccion as string}
            {Boolean(cl.proximaAccionFecha) && <span>{` — ${formatearFechaCorta(String(cl.proximaAccionFecha))}`}</span>}
          </p>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        {cl.telefono && (
          <a
            href={`https://wa.me/521${(cl.telefono as string).replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            title="WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        )}
        <Link href={`/clientes/${cl.id}`} className="p-2 rounded-lg border border-[var(--color-surface-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-bg)] hover:text-[var(--color-brand)] transition-colors" title="Ver expediente">
          <Phone className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
