"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Search, Filter, ChevronLeft, ChevronRight, Star, StarOff } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatearMoneda, diasSinContacto, emojiTemperatura, iniciales, formatearFechaCorta } from "@/lib/utils";
import Link from "next/link";
import { InfoIcon } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";

interface Cliente {
  id: string;
  nombre: string;
  telefono?: string | null;
  correo?: string | null;
  etapa: string;
  temperatura: string;
  valorEstimado: number;
  proximaAccionFecha?: string | null;
  proximaAccion?: string | null;
  ultimoContacto?: string | null;
  estadoCartera: string;
  objecionPrincipal?: string | null;
  vendedor?: { nombre: string } | null;
  etiquetas?: { etiqueta: { nombre: string; color: string } }[];
}

interface Props {
  clientesIniciales: Cliente[];
  total: number;
  pagina: number;
  porPagina: number;
  etiquetas: { id: string; nombre: string; color: string }[];
  vendedores: { id: string; nombre: string }[];
  usuarioId: string;
  esAdmin: boolean;
}

export default function ClientesClient({ clientesIniciales, total, pagina, porPagina, etiquetas, vendedores, usuarioId, esAdmin }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [clientes, setClientes] = useState(clientesIniciales);
  const [buscando, setBuscando] = useState(false);
  const router = useRouter();
  const { mostrar } = useToast();

  const totalPaginas = Math.ceil(total / porPagina);
  const ahora = new Date();

  const buscar = useCallback(async (q: string) => {
    if (!q.trim()) { setClientes(clientesIniciales); return; }
    setBuscando(true);
    try {
      const res = await fetch(`/api/clientes?buscar=${encodeURIComponent(q)}&estado=ACTIVO`);
      const data = await res.json();
      setClientes(data.clientes || []);
    } catch { mostrar("Error al buscar", "error"); }
    finally { setBuscando(false); }
  }, [clientesIniciales, mostrar]);

  const handleBusqueda = (val: string) => {
    setBusqueda(val);
    const t = setTimeout(() => buscar(val), 300);
    return () => clearTimeout(t);
  };

  const accionVencida = (fecha?: string | null) => {
    if (!fecha) return false;
    return new Date(fecha) < ahora;
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--color-acento-clientes)]" />
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Clientes</h1>
            <InfoIcon contenido="Todas tus personas en un solo lugar. Haz clic en el nombre para ver el expediente completo." />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{total} cliente{total !== 1 ? "s" : ""} activo{total !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/clientes/nuevo">
          <Button icono={<Plus className="h-4 w-4" />}>Nuevo cliente</Button>
        </Link>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
        <input
          value={busqueda}
          onChange={(e) => handleBusqueda(e.target.value)}
          placeholder="Buscar por nombre, teléfono, correo o empresa…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface)] text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
          aria-label="Buscar clientes"
        />
      </div>

      {/* Lista */}
      {clientes.length === 0 ? (
        <Card className="py-16 text-center">
          <Users className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-[var(--color-text-secondary)] font-medium mb-2">
            {busqueda ? `No encontré nada con "${busqueda}"` : "Aún no tienes clientes"}
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            {busqueda ? "Revisa cómo lo escribiste o" : ""} Agrega tu primer cliente
          </p>
          <Link href="/clientes/nuevo">
            <Button icono={<Plus className="h-4 w-4" />}>+ Nuevo cliente</Button>
          </Link>
        </Card>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-surface-border)] shadow-[var(--shadow-card)] overflow-hidden">
          {/* Header tabla (escritorio) */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] gap-4 px-5 py-3 border-b border-[var(--color-surface-border)] text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            <span>Cliente</span>
            <span>Etapa</span>
            <span>Temperatura</span>
            <span>Valor estimado</span>
            <span>Próxima acción</span>
            <span>Acciones</span>
          </div>

          {clientes.map((c, i) => {
            const vencida = accionVencida(c.proximaAccionFecha);
            const diasSin = diasSinContacto(c.ultimoContacto ? new Date(c.ultimoContacto) : null);
            return (
              <div
                key={c.id}
                className={`flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] gap-3 md:gap-4 px-4 md:px-5 py-4 border-b border-[var(--color-surface-border)] last:border-0 hover:bg-[var(--color-surface-raised)] transition-colors ${i % 2 === 0 ? "" : "bg-[var(--color-surface-raised)]/30"}`}
              >
                {/* Nombre + contacto */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {iniciales(c.nombre)}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/clientes/${c.id}`}
                      className="nombre-cliente text-base hover:text-[var(--color-brand)] transition-colors font-semibold"
                    >
                      {c.nombre}
                    </Link>
                    {c.telefono && <p className="text-xs text-[var(--color-text-muted)]">{c.telefono}</p>}
                    {c.etiquetas && c.etiquetas.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {c.etiquetas.map((e) => (
                          <span
                            key={e.etiqueta.nombre}
                            className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
                            style={{ background: e.etiqueta.color }}
                          >
                            {e.etiqueta.nombre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Etapa */}
                <div className="flex items-center">
                  <Badge color="purple" className="text-[11px]">{c.etapa}</Badge>
                </div>

                {/* Temperatura */}
                <div className="flex items-center text-base">
                  {emojiTemperatura(c.temperatura)} <span className="ml-1 text-sm text-[var(--color-text-secondary)]">{c.temperatura}</span>
                </div>

                {/* Valor */}
                <div className="flex items-center text-sm font-semibold text-[var(--color-text-primary)]">
                  {c.valorEstimado > 0 ? formatearMoneda(c.valorEstimado) : <span className="text-[var(--color-text-muted)]">—</span>}
                </div>

                {/* Próxima acción */}
                <div className="flex items-center">
                  {c.proximaAccion ? (
                    <div>
                      <p className={`text-xs font-medium ${vencida ? "text-red-600" : "text-[var(--color-text-secondary)]"}`}>
                        {vencida ? "⚠️ Vencida" : ""} {c.proximaAccion}
                      </p>
                      {c.proximaAccionFecha && (
                        <p className={`text-[11px] ${vencida ? "text-red-500" : "text-[var(--color-text-muted)]"}`}>
                          {formatearFechaCorta(c.proximaAccionFecha)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-orange-500 font-medium">🟠 Sin seguimiento</span>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/clientes/${c.id}`}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-surface-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-bg)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)] transition-colors"
                  >
                    Ver
                  </Link>
                  {c.telefono && (
                    <a
                      href={`https://wa.me/521${c.telefono.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                      title="WhatsApp"
                    >
                      WA
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-muted)]">
            Mostrando {((pagina - 1) * porPagina) + 1}–{Math.min(pagina * porPagina, total)} de {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/clientes?pagina=${pagina - 1}`)}
              disabled={pagina <= 1}
              className="p-2 rounded-lg border border-[var(--color-surface-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 text-sm text-[var(--color-text-primary)]">{pagina} / {totalPaginas}</span>
            <button
              onClick={() => router.push(`/clientes?pagina=${pagina + 1}`)}
              disabled={pagina >= totalPaginas}
              className="p-2 rounded-lg border border-[var(--color-surface-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
