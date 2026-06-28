"use client";
import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { KanbanSquare, Trophy, XCircle, Archive, Clock } from "lucide-react";
import { formatearMoneda, emojiTemperatura, iniciales, diasSinContacto } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

interface ClienteKanban {
  id: string;
  nombre: string;
  telefono?: string | null;
  temperatura: string;
  valorEstimado: number;
  etapa: string;
  proximaAccionFecha?: string | null;
  actualizadoEn: string;
  objecionPrincipal?: string | null;
  vendedor?: { nombre: string } | null;
  etiquetas?: { etiqueta: { nombre: string; color: string } }[];
}

interface Columna {
  etapa: string;
  items: ClienteKanban[];
  dinero: number;
}

interface EmbudoClientProps {
  columnasIniciales: Columna[];
  contadores: { completados: number; perdidos: number; archivados: number };
  usuarioId: string;
  esAdmin: boolean;
}

const colorEtapa: Record<string, string> = {
  "Nuevo": "bg-blue-100 text-blue-700",
  "Contactado": "bg-sky-100 text-sky-700",
  "Proyecto Calificado": "bg-indigo-100 text-indigo-700",
  "Asesoría Técnica": "bg-violet-100 text-violet-700",
  "Información Completa": "bg-purple-100 text-purple-700",
  "Cotización Enviada": "bg-fuchsia-100 text-fuchsia-700",
  "Seguimiento": "bg-orange-100 text-orange-700",
  "Negociación": "bg-yellow-100 text-yellow-700",
  "Pedido Confirmado": "bg-green-100 text-green-700",
};

export default function EmbudoClient({ columnasIniciales, contadores, usuarioId, esAdmin }: EmbudoClientProps) {
  const [columnas, setColumnas] = useState(columnasIniciales);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const { mostrar } = useToast();
  const router = useRouter();
  const ahora = new Date();

  const getCliente = (id: string) =>
    columnas.flatMap((c) => c.items).find((c) => c.id === id);

  const handleDragStart = (e: DragStartEvent) => {
    setDraggingId(e.active.id as string);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = e;
    if (!over) return;

    const clienteId = active.id as string;
    const nuevaEtapa = over.id as string;
    const clienteActual = getCliente(clienteId);
    if (!clienteActual || clienteActual.etapa === nuevaEtapa) return;

    // Actualizar UI optimistamente
    setColumnas((prev) => {
      const nuevas = prev.map((col) => ({
        ...col,
        items: col.items.filter((c) => c.id !== clienteId),
        dinero: col.items.filter((c) => c.id !== clienteId).reduce((a, c) => a + c.valorEstimado, 0),
      }));
      return nuevas.map((col) => {
        if (col.etapa === nuevaEtapa) {
          const items = [...col.items, { ...clienteActual, etapa: nuevaEtapa }];
          return { ...col, items, dinero: items.reduce((a, c) => a + c.valorEstimado, 0) };
        }
        return col;
      });
    });

    try {
      const res = await fetch(`/api/clientes/${clienteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "mover-etapa", etapa: nuevaEtapa }),
      });
      if (!res.ok) throw new Error();
      mostrar(`${clienteActual.nombre} movido a ${nuevaEtapa} ✓`);
    } catch {
      mostrar("Error al mover el cliente", "error");
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-[var(--color-surface-border)] flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <KanbanSquare className="h-5 w-5 text-[var(--color-acento-embudo)]" />
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Embudo de ventas</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/completados" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium hover:bg-green-100 transition-colors">
              <Trophy className="h-3.5 w-3.5" /> Completados ({contadores.completados})
            </Link>
            <Link href="/perdidos" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-200 transition-colors">
              <XCircle className="h-3.5 w-3.5" /> Perdidos ({contadores.perdidos})
            </Link>
            <Link href="/archivados" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-sm font-medium hover:bg-stone-200 transition-colors">
              <Archive className="h-3.5 w-3.5" /> Archivados ({contadores.archivados})
            </Link>
          </div>
        </div>
      </div>

      {/* Tablero kanban */}
      <div className="flex-1 overflow-x-auto p-4 md:p-5">
        <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full min-w-max">
            {columnas.map((col) => (
              <SortableContext key={col.etapa} id={col.etapa} items={col.items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <Columna
                  etapa={col.etapa}
                  items={col.items}
                  dinero={col.dinero}
                  ahora={ahora}
                />
              </SortableContext>
            ))}
          </div>

          <DragOverlay>
            {draggingId && (() => {
              const c = getCliente(draggingId);
              return c ? <TarjetaCliente cliente={c} ahora={ahora} overlay /> : null;
            })()}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

function Columna({ etapa, items, dinero, ahora }: { etapa: string; items: ClienteKanban[]; dinero: number; ahora: Date }) {
  const color = colorEtapa[etapa] || "bg-gray-100 text-gray-700";
  return (
    <div
      className="flex flex-col w-72 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-raised)] overflow-hidden"
      style={{ minHeight: "400px" }}
    >
      <div className="p-3 border-b border-[var(--color-surface-border)]">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{etapa}</span>
          <span className="text-xs text-[var(--color-text-muted)] font-medium">{items.length}</span>
        </div>
        {dinero > 0 && (
          <p className="text-xs text-[var(--color-text-muted)]">💰 {formatearMoneda(dinero)}</p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Drop zone vacía */}
        <DropZone id={etapa} />
        {items.map((cliente) => (
          <TarjetaCliente key={cliente.id} cliente={cliente} ahora={ahora} />
        ))}
      </div>
    </div>
  );
}

function DropZone({ id }: { id: string }) {
  const { setNodeRef, isOver } = useSortable({ id, disabled: true });
  return (
    <div
      ref={setNodeRef}
      className={`h-1 rounded transition-all ${isOver ? "h-12 bg-[var(--color-brand)]/20 border-2 border-dashed border-[var(--color-brand)]" : ""}`}
    />
  );
}

function TarjetaCliente({ cliente: c, ahora, overlay }: { cliente: ClienteKanban; ahora: Date; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id });
  const vencida = c.proximaAccionFecha && new Date(c.proximaAccionFecha) < ahora;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(overlay ? {} : { ...attributes, ...listeners })}
      className={`bg-[var(--color-surface)] rounded-xl border border-[var(--color-surface-border)] p-3 shadow-[var(--shadow-card)] cursor-grab active:cursor-grabbing select-none hover:shadow-[var(--shadow-raised)] transition-shadow ${overlay ? "rotate-2 shadow-[var(--shadow-modal)]" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/clientes/${c.id}`}
          className="font-semibold text-sm text-[var(--color-text-primary)] hover:text-[var(--color-brand)] hover:underline leading-tight"
          onClick={(e) => e.stopPropagation()}
        >
          {c.nombre}
        </Link>
        <span className="text-base shrink-0">{emojiTemperatura(c.temperatura)}</span>
      </div>

      {c.valorEstimado > 0 && (
        <p className="text-xs font-semibold text-[var(--color-brand-dark)] mt-1">{formatearMoneda(c.valorEstimado)}</p>
      )}

      {c.objecionPrincipal && (
        <p className="text-[11px] text-[var(--color-text-muted)] mt-1 line-clamp-1">💬 {c.objecionPrincipal}</p>
      )}

      {vencida && (
        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-red-600 font-medium">
          <Clock className="h-3 w-3" />
          Acción vencida
        </div>
      )}

      {c.etiquetas && c.etiquetas.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {c.etiquetas.map((e) => (
            <span
              key={e.etiqueta.nombre}
              className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
              style={{ background: e.etiqueta.color }}
            >
              {e.etiqueta.nombre}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
