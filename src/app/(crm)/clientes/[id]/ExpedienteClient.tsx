"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, MessageCircle, Mail, Phone, Edit3, Trophy, XCircle, Archive, Sparkles,
  Clock, Flame, Calendar, Wallet, FileText, History, Building2, CheckCircle2, RotateCcw
} from "lucide-react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { formatearMoneda, formatearFecha, formatearFechaCorta, diasSinContacto, emojiTemperatura } from "@/lib/utils";
import Modal from "@/components/ui/Modal";

type Seccion = "resumen" | "historial" | "pagos" | "archivos" | "empresa";

interface ExpedienteClientProps {
  cliente: Record<string, unknown>;
  vendedores: { id: string; nombre: string }[];
  plantillas: Record<string, unknown>[];
  usuarioActual: { id: string; nombre: string; rol: string };
  mensajeWhatsApp: string;
  motivosPerdida: string[];
}

export default function ExpedienteClient({ cliente: c, vendedores, plantillas, usuarioActual, mensajeWhatsApp, motivosPerdida }: ExpedienteClientProps) {
  const cl = c as {
    id: string; nombre: string; telefono?: string; correo?: string; etapa: string;
    estadoCartera: string; temperatura: string; objecionPrincipal?: string; notas?: string;
    proximaAccion?: string; proximaAccionFecha?: string; valorEstimado: number;
    probabilidadCierre: number; empresa?: string; tipoObra?: string; m2Aproximados?: number;
    productoInteres?: string; origen?: string; ultimoContacto?: string;
    vendedor?: { id: string; nombre: string }; etiquetas?: unknown[];
    pagos?: unknown[]; interacciones?: unknown[]; archivos?: unknown[];
    motivoPerdida?: string; creadoEn: string;
  };

  const [seccion, setSeccion] = useState<Seccion>("resumen");
  const [editando, setEditando] = useState(false);
  const [modalGanado, setModalGanado] = useState(false);
  const [modalPerdido, setModalPerdido] = useState(false);
  const [modalArchivar, setModalArchivar] = useState(false);
  const [motivoPerdidaSeleccionado, setMotivoPerdidaSeleccionado] = useState(motivosPerdida[0]);
  const [cargando, setCargando] = useState(false);
  const [iaRespuesta, setIaRespuesta] = useState<string | null>(null);
  const [iaCargando, setIaCargando] = useState(false);
  const { mostrar } = useToast();
  const router = useRouter();

  const ahora = new Date();
  const dias = diasSinContacto(cl.ultimoContacto ? new Date(cl.ultimoContacto) : null);
  const diasLleva = Math.floor((ahora.getTime() - new Date(cl.creadoEn).getTime()) / 86400000);
  const accionVencida = cl.proximaAccionFecha && new Date(cl.proximaAccionFecha) < ahora;

  const pagos = (cl.pagos || []) as { monto: number; estatus: string; metodo: string; fechaPago?: string; concepto?: string }[];
  const totalPagado = pagos.filter((p) => p.estatus === "pagado").reduce((a, p) => a + p.monto, 0);
  const interacciones = (cl.interacciones || []) as { id: string; tipo: string; descripcion: string; usuarioNombre: string; fecha: string }[];
  const archivos = (cl.archivos || []) as { id: string; nombre: string; etiqueta: string; creadoEn: string; subidoPor: string }[];

  const whatsAppNum = cl.telefono ? `521${cl.telefono.replace(/\D/g, "")}` : "";
  const msgWA = mensajeWhatsApp.replace(/\{nombre\}/g, cl.nombre).replace(/\{empresa\}/g, cl.empresa || "").replace(/\{etapa\}/g, cl.etapa);

  const accion = async (accionStr: string, extra?: Record<string, unknown>) => {
    setCargando(true);
    try {
      const res = await fetch(`/api/clientes/${cl.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: accionStr, ...extra }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
      return true;
    } catch {
      mostrar("Error al actualizar", "error");
      return false;
    } finally {
      setCargando(false);
    }
  };

  const marcarGanado = async () => {
    const ok = await accion("marcar-ganado");
    if (ok) {
      setModalGanado(false);
      mostrar(`¡Cerraste a ${cl.nombre}! 🎉 +${formatearMoneda(cl.valorEstimado)}`, "exito");
    }
  };

  const marcarPerdido = async () => {
    const ok = await accion("marcar-perdido", { motivoPerdida: motivoPerdidaSeleccionado });
    if (ok) {
      setModalPerdido(false);
      mostrar("Cliente marcado como perdido.", "info");
    }
  };

  const archivar = async () => {
    const ok = await accion("archivar");
    if (ok) {
      setModalArchivar(false);
      router.push("/clientes");
    }
  };

  const llamarIA = async (tipo: string) => {
    setIaCargando(true);
    setIaRespuesta(null);
    try {
      const res = await fetch("/api/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, clienteId: cl.id }),
      });
      const data = await res.json();
      setIaRespuesta(data.respuesta || data.error || "Sin respuesta");
    } catch {
      setIaRespuesta("No se pudo contactar al asistente de IA. Verifica tu conexión.");
    } finally {
      setIaCargando(false);
    }
  };

  const badgeEstado = () => {
    switch (cl.estadoCartera) {
      case "GANADO":   return <Badge color="green"><Trophy className="h-3 w-3" /> Ganado</Badge>;
      case "PERDIDO":  return <Badge color="gray"><XCircle className="h-3 w-3" /> Perdido</Badge>;
      case "ARCHIVADO":return <Badge color="stone"><Archive className="h-3 w-3" /> Archivado</Badge>;
      default:         return <Badge color="brand">Activo</Badge>;
    }
  };

  const secciones: { id: Seccion; label: string; icono: React.ReactNode }[] = [
    { id: "resumen",   label: "Resumen",   icono: <FileText className="h-4 w-4" /> },
    { id: "historial", label: "Historial", icono: <History className="h-4 w-4" /> },
    { id: "pagos",     label: "Pagos",     icono: <Wallet className="h-4 w-4" /> },
    { id: "archivos",  label: "Archivos",  icono: <FileText className="h-4 w-4" /> },
    { id: "empresa",   label: "Empresa",   icono: <Building2 className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-5">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Link href="/clientes" className="p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] transition-colors" aria-label="Volver a clientes">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] truncate">{cl.nombre}</h1>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {badgeEstado()}
            <span className="text-sm text-[var(--color-text-muted)]">{cl.etapa}</span>
            <span className="text-base">{emojiTemperatura(cl.temperatura)}</span>
            {cl.empresa && <span className="text-sm text-[var(--color-text-muted)]">· {cl.empresa}</span>}
          </div>
        </div>
      </div>

      {/* Encabezado de venta */}
      <Card className="border-l-4 border-l-[var(--color-brand)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-[var(--color-text-muted)] text-xs mb-0.5">Objeción</p>
            <p className="font-medium text-[var(--color-text-primary)]">{cl.objecionPrincipal || "—"}</p>
          </div>
          <div>
            <p className="text-[var(--color-text-muted)] text-xs mb-0.5">Último contacto</p>
            <p className={`font-medium ${dias > 7 ? "text-red-600" : "text-[var(--color-text-primary)]"}`}>
              {cl.ultimoContacto ? `hace ${dias} día${dias !== 1 ? "s" : ""}` : "Sin contacto"}
            </p>
          </div>
          <div>
            <p className="text-[var(--color-text-muted)] text-xs mb-0.5">Próxima acción</p>
            <p className={`font-medium text-xs ${accionVencida ? "text-red-600" : "text-[var(--color-text-primary)]"}`}>
              {cl.proximaAccion || <span className="text-orange-500">🟠 Sin acción</span>}
            </p>
            {cl.proximaAccionFecha && (
              <p className={`text-[11px] ${accionVencida ? "text-red-500" : "text-[var(--color-text-muted)]"}`}>
                {accionVencida ? "⚠️ " : ""}{formatearFechaCorta(cl.proximaAccionFecha)}
              </p>
            )}
          </div>
          <div>
            <p className="text-[var(--color-text-muted)] text-xs mb-0.5">Valor estimado</p>
            <p className="font-bold text-[var(--color-brand-dark)] text-base">{formatearMoneda(cl.valorEstimado)}</p>
          </div>
        </div>
      </Card>

      {/* Botones de contacto */}
      <div className="flex gap-2 flex-wrap">
        {cl.telefono && (
          <a
            href={`https://wa.me/${whatsAppNum}?text=${encodeURIComponent(msgWA)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        )}
        {cl.correo && (
          <a
            href={`mailto:${cl.correo}?subject=Vita Construye — ${cl.etapa}&body=Hola ${cl.nombre},%0D%0A%0D%0A`}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--color-surface-border)] text-[var(--color-text-secondary)] rounded-lg text-sm font-semibold hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            <Mail className="h-4 w-4" /> Correo
          </a>
        )}
        {cl.estadoCartera === "ACTIVO" && (
          <>
            <Button variante="secundario" tamaño="sm" icono={<Trophy className="h-4 w-4 text-green-600" />} onClick={() => setModalGanado(true)}>
              Marcar ganado
            </Button>
            <Button variante="ghost" tamaño="sm" icono={<XCircle className="h-4 w-4 text-gray-500" />} onClick={() => setModalPerdido(true)}>
              Perdido
            </Button>
            <Button variante="ghost" tamaño="sm" icono={<Archive className="h-4 w-4 text-stone-500" />} onClick={() => setModalArchivar(true)}>
              Archivar
            </Button>
          </>
        )}
        {(cl.estadoCartera === "PERDIDO" || cl.estadoCartera === "ARCHIVADO") && (
          <Button variante="outline" tamaño="sm" icono={<RotateCcw className="h-4 w-4" />} onClick={() => accion("reactivar")} cargando={cargando}>
            Reactivar
          </Button>
        )}
      </div>

      {/* Asistente IA */}
      <Card glass>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-[var(--color-brand)]" />
          <h2 className="font-bold text-[var(--color-text-primary)]">Asistente IA</h2>
          <span className="text-xs text-[var(--color-text-muted)]">Tu copiloto para vender</span>
        </div>
        <div className="flex gap-2 flex-wrap mb-3">
          {[
            { tipo: "mensaje", label: "Redactar mensaje" },
            { tipo: "temperatura", label: "Clasificar temperatura" },
            { tipo: "accion", label: "Sugerir próxima acción" },
            { tipo: "resumen", label: "Resumir expediente" },
            { tipo: "objecion", label: "Manejar objeción" },
          ].map((btn) => (
            <button
              key={btn.tipo}
              onClick={() => llamarIA(btn.tipo)}
              disabled={iaCargando}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-surface-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-bg)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)] transition-colors disabled:opacity-50"
            >
              {btn.label}
            </button>
          ))}
        </div>
        {iaCargando && <p className="text-sm text-[var(--color-text-muted)] animate-pulse">Analizando el expediente…</p>}
        {iaRespuesta && (
          <div className="bg-[var(--color-surface-raised)] rounded-xl p-4 text-sm text-[var(--color-text-primary)] whitespace-pre-wrap border border-[var(--color-surface-border)]">
            {iaRespuesta}
          </div>
        )}
      </Card>

      {/* Tabs de sección */}
      <div className="flex gap-1 border-b border-[var(--color-surface-border)] overflow-x-auto">
        {secciones.map((s) => (
          <button
            key={s.id}
            onClick={() => setSeccion(s.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              seccion === s.id
                ? "border-[var(--color-brand)] text-[var(--color-brand)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {s.icono} {s.label}
          </button>
        ))}
      </div>

      {/* Contenido de la sección */}
      {seccion === "resumen" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <h3 className="font-bold text-[var(--color-text-primary)] mb-3">Datos de contacto</h3>
            <dl className="space-y-2 text-sm">
              <Campo label="Teléfono/WhatsApp" valor={cl.telefono} />
              <Campo label="Correo" valor={cl.correo} />
              <Campo label="Origen" valor={cl.origen} />
              <Campo label="Etapa" valor={cl.etapa} />
              <Campo label="Temperatura" valor={`${emojiTemperatura(cl.temperatura)} ${cl.temperatura}`} />
              <Campo label="Probabilidad de cierre" valor={`${cl.probabilidadCierre}%`} />
            </dl>
          </Card>
          <Card>
            <h3 className="font-bold text-[var(--color-text-primary)] mb-3">Proyecto</h3>
            <dl className="space-y-2 text-sm">
              <Campo label="Tipo de obra" valor={cl.tipoObra} />
              <Campo label="m² aproximados" valor={cl.m2Aproximados?.toString()} />
              <Campo label="Producto de interés" valor={cl.productoInteres} />
              <Campo label="Valor estimado" valor={formatearMoneda(cl.valorEstimado)} />
              <Campo label="Vendedor" valor={cl.vendedor?.nombre} />
            </dl>
          </Card>
          {cl.notas && (
            <Card className="md:col-span-2">
              <h3 className="font-bold text-[var(--color-text-primary)] mb-2">Notas</h3>
              <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{cl.notas}</p>
            </Card>
          )}
        </div>
      )}

      {seccion === "historial" && (
        <div className="space-y-2">
          {interacciones.length === 0 ? (
            <p className="text-center text-[var(--color-text-muted)] py-8">Sin historial aún.</p>
          ) : interacciones.map((inter) => (
            <div key={inter.id} className="flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-[var(--color-brand)] mt-2 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-[var(--color-text-primary)]">{inter.descripcion}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{inter.usuarioNombre} · {formatearFecha(inter.fecha)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {seccion === "pagos" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Total cobrado: <span className="font-bold text-[var(--color-text-primary)]">{formatearMoneda(totalPagado)}</span></p>
              {cl.valorEstimado > 0 && (
                <div className="w-full h-2 rounded-full bg-[var(--color-surface-border)] mt-1 max-w-xs">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min((totalPagado / cl.valorEstimado) * 100, 100)}%` }} />
                </div>
              )}
            </div>
            <Link href={`/pagos/nuevo?clienteId=${cl.id}`} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)]">
              + Registrar pago
            </Link>
          </div>
          {pagos.length === 0 ? (
            <p className="text-center text-[var(--color-text-muted)] py-8">Sin pagos registrados.</p>
          ) : pagos.map((p, i) => (
            <Card key={i} className="flex items-center gap-3">
              <div className={`w-2 h-8 rounded-full ${p.estatus === "pagado" ? "bg-green-500" : p.estatus === "vencido" ? "bg-red-500" : "bg-yellow-400"}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{formatearMoneda(p.monto)} · {p.metodo}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{p.concepto || "Sin concepto"} {p.fechaPago && `· ${formatearFechaCorta(p.fechaPago)}`}</p>
              </div>
              <Badge color={p.estatus === "pagado" ? "green" : p.estatus === "vencido" ? "red" : "yellow"}>
                {p.estatus}
              </Badge>
            </Card>
          ))}
        </div>
      )}

      {seccion === "archivos" && (
        <div>
          <p className="text-sm text-[var(--color-text-muted)] mb-3">{archivos.length} archivo{archivos.length !== 1 ? "s" : ""} guardado{archivos.length !== 1 ? "s" : ""}</p>
          {archivos.length === 0 ? (
            <p className="text-center text-[var(--color-text-muted)] py-8">Sin archivos. Sube comprobantes, contratos o cotizaciones.</p>
          ) : archivos.map((a) => (
            <Card key={a.id} hover className="flex items-center gap-3 mb-2">
              <FileText className="h-5 w-5 text-[var(--color-brand)] shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{a.nombre}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{a.etiqueta} · {a.subidoPor} · {formatearFechaCorta(a.creadoEn)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {seccion === "empresa" && (
        <Card>
          <h3 className="font-bold text-[var(--color-text-primary)] mb-3">Datos de empresa</h3>
          {!cl.empresa ? (
            <p className="text-sm text-[var(--color-text-muted)]">Este cliente no tiene empresa asociada.</p>
          ) : (
            <dl className="space-y-2 text-sm">
              <Campo label="Empresa" valor={(c as { empresa?: string }).empresa} />
              <Campo label="Giro/Industria" valor={(c as { giroEmpresa?: string }).giroEmpresa} />
              <Campo label="Puesto del contacto" valor={(c as { puestoContacto?: string }).puestoContacto} />
              <Campo label="RFC" valor={(c as { rfcEmpresa?: string }).rfcEmpresa} />
              <Campo label="Sitio web" valor={(c as { sitioWebEmpresa?: string }).sitioWebEmpresa} />
              <Campo label="Tamaño" valor={(c as { tamanoEmpresa?: string }).tamanoEmpresa} />
            </dl>
          )}
        </Card>
      )}

      {/* Modales de confirmación */}
      <Modal abierto={modalGanado} onCerrar={() => setModalGanado(false)} titulo="¿Marcar como ganado? 🎉">
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Esto marcará a <strong>{cl.nombre}</strong> como Ganado y lo moverá a Clientes completados. ¿Seguro?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variante="secundario" tamaño="sm" onClick={() => setModalGanado(false)}>Cancelar</Button>
          <Button variante="primario" tamaño="sm" cargando={cargando} icono={<Trophy className="h-4 w-4" />} onClick={marcarGanado}>
            Sí, ¡lo cerramos!
          </Button>
        </div>
      </Modal>

      <Modal abierto={modalPerdido} onCerrar={() => setModalPerdido(false)} titulo="Marcar como perdido">
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">¿Por qué se perdió este cliente?</p>
        <div className="space-y-2 mb-4">
          {motivosPerdida.map((m) => (
            <label key={m} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="motivo" value={m} checked={motivoPerdidaSeleccionado === m} onChange={() => setMotivoPerdidaSeleccionado(m)} className="accent-[var(--color-brand)]" />
              <span className="text-sm">{m}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variante="secundario" tamaño="sm" onClick={() => setModalPerdido(false)}>Cancelar</Button>
          <Button variante="ghost" tamaño="sm" cargando={cargando} onClick={marcarPerdido}>Marcar perdido</Button>
        </div>
      </Modal>

      <Modal abierto={modalArchivar} onCerrar={() => setModalArchivar(false)} titulo="¿Archivar cliente?">
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          ¿Archivar a <strong>{cl.nombre}</strong>? Saldrá de todas las vistas activas. Podrás restaurarlo cuando quieras.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variante="secundario" tamaño="sm" onClick={() => setModalArchivar(false)}>Cancelar</Button>
          <Button variante="ghost" tamaño="sm" cargando={cargando} onClick={archivar}>Archivar</Button>
        </div>
      </Modal>
    </div>
  );
}

function Campo({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div className="flex gap-2">
      <dt className="text-[var(--color-text-muted)] min-w-32 shrink-0">{label}</dt>
      <dd className="text-[var(--color-text-primary)] font-medium">{valor || "—"}</dd>
    </div>
  );
}
