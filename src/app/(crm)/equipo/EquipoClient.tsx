"use client";
import { useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import Link from "next/link";
import { UserCog, Search, UserPlus, Download } from "lucide-react";
import { formatearMoneda } from "@/lib/utils";

interface Fase { etapa: string; count: number }
interface Miembro {
  id: string; nombre: string; correo: string; rol: string; metaMensual: number;
  cierres: number; ingresos: number; activos: number; fases: Fase[];
}
interface ClienteSin { id: string; nombre: string; etapa: string; temperatura: string }

const ORDEN_ETAPAS = ["Nuevo", "Contactado", "Proyecto Calificado", "Asesoría Técnica", "Información Completa", "Cotización Enviada", "Seguimiento", "Negociación", "Pedido Confirmado", "Perdido"];
// Ignora valores de etapa corruptos (IDs sueltos del seed de demo)
const etapaValida = (e: string) => !/^[a-z0-9]{20,}$/i.test(e);
function ordenarFases(fases: Fase[]) {
  return [...fases].filter((f) => etapaValida(f.etapa)).sort((a, b) => {
    const ia = ORDEN_ETAPAS.indexOf(a.etapa), ib = ORDEN_ETAPAS.indexOf(b.etapa);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}
const colorEtapa = (e: string) =>
  e === "Pedido Confirmado" ? "bg-green-100 text-green-700"
  : e === "Perdido" ? "bg-gray-100 text-gray-500"
  : e === "Cotización Enviada" ? "bg-blue-100 text-blue-700"
  : e === "Seguimiento" ? "bg-amber-100 text-amber-700"
  : e === "Nuevo" ? "bg-orange-100 text-orange-700"
  : "bg-purple-100 text-purple-700";

export default function EquipoClient({ miembros, sinAsignar }: { miembros: Miembro[]; sinAsignar: ClienteSin[] }) {
  const ranking = [...miembros].sort((a, b) => b.ingresos - a.ingresos);
  const vendedoresAsignables = miembros; // admin puede asignar a cualquiera (incluido él mismo)

  const [lista, setLista] = useState<ClienteSin[]>(sinAsignar);
  const [busqueda, setBusqueda] = useState("");
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [destino, setDestino] = useState(miembros[0]?.id || "");
  const [asignando, setAsignando] = useState(false);
  const [aviso, setAviso] = useState("");

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return q ? lista.filter((c) => c.nombre.toLowerCase().includes(q)) : lista;
  }, [lista, busqueda]);

  const toggle = (id: string) => {
    setSeleccion((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const seleccionarVisibles = () => setSeleccion(new Set(filtrados.map((c) => c.id)));
  const limpiar = () => setSeleccion(new Set());

  async function asignar(ids: string[], vendedorId: string) {
    if (!vendedorId || ids.length === 0) return;
    setAsignando(true); setAviso("");
    try {
      await Promise.all(ids.map((id) =>
        fetch(`/api/clientes/${id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accion: "asignar", vendedorId }),
        })
      ));
      const nombre = miembros.find((m) => m.id === vendedorId)?.nombre || "vendedor";
      setLista((l) => l.filter((c) => !ids.includes(c.id)));
      setSeleccion(new Set());
      setAviso(`✅ ${ids.length} cliente${ids.length !== 1 ? "s" : ""} asignado${ids.length !== 1 ? "s" : ""} a ${nombre}.`);
    } catch {
      setAviso("❌ Hubo un error al asignar. Intenta de nuevo.");
    } finally {
      setAsignando(false);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-[var(--color-acento-equipo)]" />
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Equipo</h1>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Tu gente, sus metas y en qué fase están sus clientes.</p>
        </div>
        <a
          href="/api/exportar"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-surface-border)] text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
        >
          <Download className="h-4 w-4" /> Descargar base en Excel
        </a>
      </div>

      {/* Tarjetas de miembros con fases */}
      <div className="space-y-3">
        {ranking.map((v, i) => {
          const pct = v.metaMensual > 0 ? Math.min((v.ingresos / v.metaMensual) * 100, 100) : 0;
          const emoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
          const fases = ordenarFases(v.fases);
          return (
            <Card key={v.id}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl shrink-0">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-text-primary)]">{v.nombre}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{v.rol === "ADMIN" ? "Administrador" : "Vendedor"} · {v.activos} activos</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[var(--color-text-primary)]">{formatearMoneda(v.ingresos)}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{v.cierres} cierre{v.cierres !== 1 ? "s" : ""} este mes</p>
                </div>
              </div>

              {v.metaMensual > 0 && (
                <div className="mb-3">
                  <div className="w-full h-2 rounded-full bg-[var(--color-surface-border)] overflow-hidden">
                    <div className={`h-full rounded-full ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{pct.toFixed(0)}% de {formatearMoneda(v.metaMensual)}</p>
                </div>
              )}

              {/* Fases de sus clientes */}
              {fases.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {fases.map((f) => (
                    <Link
                      key={f.etapa}
                      href={`/clientes?vendedor=${v.id}&etapa=${encodeURIComponent(f.etapa)}`}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${colorEtapa(f.etapa)} hover:opacity-80`}
                    >
                      {f.etapa}: {f.count}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--color-text-muted)]">Sin clientes asignados todavía.</p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Asignar clientes sin dueño */}
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <UserPlus className="h-5 w-5 text-[var(--color-brand)]" />
          <h2 className="font-bold text-[var(--color-text-primary)]">Clientes sin asignar ({lista.length})</h2>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">Reparte estos clientes entre tu equipo. Selecciona y asigna.</p>

        {aviso && <p className="text-sm mb-3 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)]">{aviso}</p>}

        {lista.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">🎉 Todos los clientes ya tienen vendedor asignado.</p>
        ) : (
          <>
            {/* Barra de acciones */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar cliente…"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--color-surface-border)] text-sm bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-brand)]"
                />
              </div>
              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--color-surface-border)] text-sm bg-[var(--color-surface)]"
              >
                {vendedoresAsignables.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
              <button
                onClick={() => asignar([...seleccion], destino)}
                disabled={asignando || seleccion.size === 0}
                className="px-4 py-2 rounded-lg bg-[var(--color-brand)] text-white text-sm font-semibold disabled:opacity-50 hover:bg-[var(--color-brand-dark)] transition-colors shrink-0"
              >
                Asignar {seleccion.size > 0 ? `(${seleccion.size})` : ""}
              </button>
            </div>

            <div className="flex items-center gap-3 mb-2 text-xs">
              <button onClick={seleccionarVisibles} className="text-[var(--color-brand)] font-medium hover:underline">Seleccionar todos los visibles</button>
              {seleccion.size > 0 && <button onClick={limpiar} className="text-[var(--color-text-muted)] hover:underline">Limpiar</button>}
            </div>

            {/* Lista */}
            <div className="max-h-96 overflow-y-auto divide-y divide-[var(--color-surface-border)] border border-[var(--color-surface-border)] rounded-xl">
              {filtrados.slice(0, 200).map((c) => {
                const sel = seleccion.has(c.id);
                const etapaLimpia = etapaValida(c.etapa) ? c.etapa : "—";
                return (
                  <div
                    key={c.id}
                    role="button"
                    onClick={() => toggle(c.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none ${sel ? "bg-[var(--color-brand-bg)]" : "hover:bg-[var(--color-surface-raised)]"}`}
                  >
                    <input type="checkbox" checked={sel} readOnly tabIndex={-1} className="h-4 w-4 accent-[var(--color-brand)] pointer-events-none" />
                    <span className="flex-1 text-sm text-[var(--color-text-primary)] truncate">{c.nombre}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${colorEtapa(c.etapa)}`}>{etapaLimpia}</span>
                  </div>
                );
              })}
              {filtrados.length > 200 && (
                <p className="text-xs text-center text-[var(--color-text-muted)] py-2">Mostrando 200 de {filtrados.length}. Usa el buscador para filtrar.</p>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
