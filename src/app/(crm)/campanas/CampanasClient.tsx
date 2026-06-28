"use client";
import { useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import { Megaphone, MessageCircle, SkipForward, ArrowLeft, Rocket } from "lucide-react";
import { telefonoParaWhatsApp } from "@/lib/utils";

interface ClienteCamp { id: string; nombre: string; telefono: string | null; etapa: string; estadoCartera: string; temperatura: string }

const PLANTILLAS = [
  { nombre: "Promoción del mes", texto: "¡Hola {nombre}! 🙌 En *Vita Construye* tenemos promoción este mes en Vigueta y Bovedilla. Cotiza sin compromiso y aparta tu material con entrega rápida. ¿Te paso precios?" },
  { nombre: "Reactivar cliente", texto: "Hola {nombre}, ¿cómo va tu proyecto? 🔨 En *Vita Construye* seguimos a tus órdenes para tu losa de Vigueta y Bovedilla. Si necesitas una nueva cotización, con gusto te apoyo." },
  { nombre: "Aviso / novedad", texto: "Hola {nombre} 👋 Te comparto novedades de *Vita Construye*. Material de calidad y entrega en tiempo. Cualquier duda, aquí estamos." },
];

const primerNombre = (n: string) => n.trim().split(/\s+/)[0];
const aplicar = (txt: string, nombre: string, link: string) =>
  txt.replace(/\{nombre\}/g, primerNombre(nombre)) + (link ? `\n${link}` : "");

const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });

export default function CampanasClient({ clientes, enviados: enviadosPrevios }: { clientes: ClienteCamp[]; enviados: Record<string, string> }) {
  const conTel = useMemo(() => clientes.filter((c) => (c.telefono || "").replace(/\D/g, "").length >= 10), [clientes]);

  const [mensaje, setMensaje] = useState(PLANTILLAS[0].texto);
  const [link, setLink] = useState("");
  const [campanaNombre, setCampanaNombre] = useState("Promoción del mes");
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState<"todos" | "enviados" | "sinenviar">("todos");

  // Envío guiado
  const [enviando, setEnviando] = useState(false);
  const [indice, setIndice] = useState(0);
  const [enviados, setEnviados] = useState<Set<string>>(new Set());

  // Quién ya recibió campaña = los del historial + los enviados en esta sesión
  const enviadosSet = useMemo(() => {
    const s = new Set(Object.keys(enviadosPrevios));
    enviados.forEach((id) => s.add(id));
    return s;
  }, [enviadosPrevios, enviados]);
  const totalEnviados = useMemo(() => conTel.filter((c) => enviadosSet.has(c.id)).length, [conTel, enviadosSet]);
  const totalSinEnviar = conTel.length - totalEnviados;

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    let lista = q ? conTel.filter((c) => c.nombre.toLowerCase().includes(q)) : conTel;
    if (vista === "enviados") lista = lista.filter((c) => enviadosSet.has(c.id));
    else if (vista === "sinenviar") lista = lista.filter((c) => !enviadosSet.has(c.id));
    return lista;
  }, [conTel, busqueda, vista, enviadosSet]);

  const preset = (fn: (c: ClienteCamp) => boolean, label: string) => {
    setSeleccion(new Set(conTel.filter(fn).map((c) => c.id)));
    setCampanaNombre(label);
  };

  const toggle = (id: string) =>
    setSeleccion((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const destinatarios = useMemo(() => conTel.filter((c) => seleccion.has(c.id)), [conTel, seleccion]);

  // ─── ENVÍO GUIADO ───
  const actual = destinatarios[indice];
  const progreso = destinatarios.length > 0 ? Math.round((enviados.size / destinatarios.length) * 100) : 0;

  async function registrar(clienteId: string) {
    try {
      await fetch("/api/campanas/registrar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId, campana: campanaNombre, canal: "WhatsApp" }),
      });
    } catch { /* no bloquear el flujo */ }
  }

  function enviarActual() {
    if (!actual) return;
    const url = `https://wa.me/${telefonoParaWhatsApp(actual.telefono || "")}?text=${encodeURIComponent(aplicar(mensaje, actual.nombre, link))}`;
    window.open(url, "_blank");
    registrar(actual.id);
    setEnviados((s) => new Set(s).add(actual.id));
    setIndice((i) => i + 1);
  }
  function saltar() { setIndice((i) => i + 1); }

  // ─── VISTA: ENVÍO GUIADO ───
  if (enviando) {
    const terminado = indice >= destinatarios.length;
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-5">
        <button onClick={() => setEnviando(false)} className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-[var(--color-text-primary)]">Campaña: {campanaNombre}</h2>
            <span className="text-sm text-[var(--color-text-muted)]">{enviados.size} / {destinatarios.length}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--color-surface-border)] overflow-hidden mb-4">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${progreso}%` }} />
          </div>

          {terminado ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🎉</div>
              <p className="font-bold text-[var(--color-text-primary)]">¡Campaña enviada!</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Mandaste el mensaje a {enviados.size} cliente{enviados.size !== 1 ? "s" : ""}. Quedó registrado en su historial.</p>
              <button onClick={() => { setEnviando(false); setIndice(0); setEnviados(new Set()); }} className="mt-4 px-4 py-2 rounded-lg bg-[var(--color-brand)] text-white text-sm font-semibold">
                Terminar
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Cliente {indice + 1} de {destinatarios.length}</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">{actual?.nombre}</p>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">{actual?.telefono}</p>

              <div className="bg-[var(--color-surface-raised)] rounded-xl p-3 text-left text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap mb-4">
                {aplicar(mensaje, actual?.nombre || "", link)}
              </div>

              <button onClick={enviarActual} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold mb-2" style={{ background: "#25d366" }}>
                <MessageCircle className="h-5 w-5" /> Enviar por WhatsApp y siguiente
              </button>
              <button onClick={saltar} className="text-sm text-[var(--color-text-muted)] hover:underline flex items-center gap-1 mx-auto">
                <SkipForward className="h-4 w-4" /> Saltar este
              </button>
            </div>
          )}
        </Card>
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          Se abre WhatsApp con el mensaje listo. Solo das &ldquo;Enviar&rdquo; en WhatsApp y vuelves aquí para el siguiente.
        </p>
      </div>
    );
  }

  // ─── VISTA: COMPONER ───
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-[var(--color-brand)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Campañas masivas</h1>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Manda promociones o links a muchos clientes por WhatsApp y reactiva cuentas.</p>
      </div>

      {/* Mensaje */}
      <Card>
        <h2 className="font-bold text-[var(--color-text-primary)] mb-3">1. Tu mensaje</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {PLANTILLAS.map((p) => (
            <button key={p.nombre} onClick={() => { setMensaje(p.texto); setCampanaNombre(p.nombre); }}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-surface-border)] hover:bg-[var(--color-surface-raised)]">
              {p.nombre}
            </button>
          ))}
        </div>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-surface-border)] text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] resize-none"
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">Usa <code className="bg-[var(--color-surface-raised)] px-1 rounded">{"{nombre}"}</code> y se reemplaza por el nombre de cada cliente.</p>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Link de promo/publicidad (opcional): https://..."
          className="w-full mt-3 px-3 py-2 rounded-lg border border-[var(--color-surface-border)] text-sm bg-[var(--color-surface)]"
        />
      </Card>

      {/* Destinatarios */}
      <Card>
        <h2 className="font-bold text-[var(--color-text-primary)] mb-1">2. ¿A quién? <span className="text-[var(--color-brand)]">({seleccion.size} seleccionados)</span></h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">Elige un grupo rápido o selecciona manualmente. Solo clientes con teléfono ({conTel.length}).</p>

        {/* Resumen de envíos: enviadas vs no enviadas */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2">
            <p className="text-lg font-bold text-green-700">{totalEnviados}</p>
            <p className="text-[11px] text-green-600">✓ Ya recibieron campaña</p>
          </div>
          <div className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-raised)] px-3 py-2">
            <p className="text-lg font-bold text-[var(--color-text-primary)]">{totalSinEnviar}</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">📭 Sin enviar todavía</p>
          </div>
        </div>

        {/* Filtro de vista */}
        <div className="inline-flex rounded-lg border border-[var(--color-surface-border)] p-0.5 mb-3 text-xs">
          {([["todos","Todos"],["sinenviar","Sin enviar"],["enviados","Enviados"]] as const).map(([v, label]) => (
            <button key={v} onClick={() => setVista(v)}
              className={`px-3 py-1.5 rounded-md font-medium ${vista === v ? "bg-[var(--color-brand)] text-white" : "text-[var(--color-text-secondary)]"}`}>
              {label}
            </button>
          ))}
        </div>

        <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">Grupos rápidos:</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => preset(() => true, "Todos")} className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-brand)] text-white font-medium">Todos ({conTel.length})</button>
          <button onClick={() => preset((c) => !enviadosSet.has(c.id), "Sin enviar aún")} className="text-xs px-3 py-1.5 rounded-full border border-green-300 text-green-700 font-medium hover:bg-green-50">📭 Sin enviar aún ({totalSinEnviar})</button>
          <button onClick={() => preset((c) => c.estadoCartera === "GANADO", "Clientes que compraron")} className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-surface-border)] hover:bg-[var(--color-surface-raised)]">Ya compraron</button>
          <button onClick={() => preset((c) => c.estadoCartera === "ACTIVO", "Clientes activos")} className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-surface-border)] hover:bg-[var(--color-surface-raised)]">Activos</button>
          <button onClick={() => preset((c) => c.estadoCartera === "PERDIDO", "Reactivar perdidos")} className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-surface-border)] hover:bg-[var(--color-surface-raised)]">Perdidos (reactivar)</button>
          <button onClick={() => preset((c) => c.temperatura === "Caliente", "Clientes calientes")} className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-surface-border)] hover:bg-[var(--color-surface-raised)]">🔥 Calientes</button>
        </div>

        {/* Empezar de cero / seleccionar visibles */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            onClick={() => { setSeleccion(new Set()); setCampanaNombre("Selección manual"); }}
            disabled={seleccion.size === 0}
            className="text-xs px-3 py-1.5 rounded-full border border-red-200 text-red-600 font-medium hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ✕ Deseleccionar todos (empezar de cero)
          </button>
          <button
            onClick={() => setSeleccion(new Set([...seleccion, ...filtrados.map((c) => c.id)]))}
            className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-surface-border)] hover:bg-[var(--color-surface-raised)]"
          >
            Seleccionar visibles
          </button>
        </div>

        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Busca un cliente y márcalo abajo para armar tu lista a mano…"
          className="w-full mb-2 px-3 py-2 rounded-lg border border-[var(--color-surface-border)] text-sm bg-[var(--color-surface)]"
        />
        <div className="max-h-64 overflow-y-auto divide-y divide-[var(--color-surface-border)] border border-[var(--color-surface-border)] rounded-xl">
          {filtrados.slice(0, 200).map((c) => {
            const sel = seleccion.has(c.id);
            const yaEnviado = enviadosSet.has(c.id);
            return (
              <div
                key={c.id}
                role="button"
                onClick={() => toggle(c.id)}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer select-none ${sel ? "bg-[var(--color-brand-bg)]" : "hover:bg-[var(--color-surface-raised)]"}`}
              >
                <input type="checkbox" checked={sel} readOnly tabIndex={-1} className="h-4 w-4 accent-[var(--color-brand)] pointer-events-none" />
                <span className="flex-1 text-sm truncate">{c.nombre}</span>
                {yaEnviado ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium shrink-0">
                    ✓ Enviado{enviadosPrevios[c.id] ? ` · ${fechaCorta(enviadosPrevios[c.id])}` : ""}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] shrink-0">Sin enviar</span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Lanzar */}
      <div className="pt-1 pb-4">
        <button
          onClick={() => { if (destinatarios.length > 0) { setIndice(0); setEnviados(new Set()); setEnviando(true); } }}
          disabled={destinatarios.length === 0}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[var(--color-brand)] text-white font-bold text-base shadow-lg disabled:opacity-50 hover:bg-[var(--color-brand-dark)] transition-colors"
        >
          <Rocket className="h-5 w-5" /> Lanzar campaña a {destinatarios.length} cliente{destinatarios.length !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}
