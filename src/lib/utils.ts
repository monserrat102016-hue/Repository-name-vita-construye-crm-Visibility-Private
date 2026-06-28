import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ─── DATOS DEL NEGOCIO ──────────────────────────────────────────────────────
 * Cambia AQUÍ el número de WhatsApp del negocio y se actualiza en todo el CRM.
 * Formato para wa.me: 52 (país) + 1 (móvil) + 10 dígitos.
 */
export const WHATSAPP_NEGOCIO = "5215614393066"; // 52 56 1439 3066
export const TELEFONO_NEGOCIO = "5614393066";
export const NOMBRE_NEGOCIO = "Vita Construye";

export function formatearMoneda(monto: number, moneda = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(monto);
}

export function formatearFecha(fecha: Date | string | null): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const ahora = new Date();
  const diffMs = ahora.getTime() - d.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias === 0) {
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHoras === 0) {
      const diffMin = Math.floor(diffMs / (1000 * 60));
      return diffMin <= 1 ? "hace un momento" : `hace ${diffMin} min`;
    }
    const hora = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    return `Hoy ${hora}`;
  }
  if (diffDias === 1) return "Ayer";
  if (diffDias < 7) return `hace ${diffDias} días`;

  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: diffDias > 365 ? "numeric" : undefined,
  });
}

export function formatearFechaCorta(fecha: Date | string | null): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

export function diasSinContacto(ultimoContacto: Date | null): number {
  if (!ultimoContacto) return 999;
  const diffMs = Date.now() - new Date(ultimoContacto).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

export function colorTemperatura(temp: string) {
  switch (temp) {
    case "Caliente": return "text-orange-500";
    case "Tibio":    return "text-yellow-500";
    case "Frio":     return "text-blue-400";
    default:         return "text-gray-400";
  }
}

export function emojiTemperatura(temp: string) {
  switch (temp) {
    case "Caliente": return "🔥";
    case "Tibio":    return "🟡";
    case "Frio":     return "🔵";
    default:         return "⚪";
  }
}

export function formatearTelefono(tel: string): string {
  const limpio = tel.replace(/\D/g, "");
  if (limpio.length === 10) return `+52 ${limpio.slice(0, 2)} ${limpio.slice(2, 6)} ${limpio.slice(6)}`;
  return tel;
}

export function telefonoParaWhatsApp(tel: string): string {
  const limpio = tel.replace(/\D/g, "");
  if (limpio.length === 10) return `521${limpio}`;
  if (limpio.startsWith("52") && limpio.length === 12) return `521${limpio.slice(2)}`;
  return limpio;
}

export function generarMensajeWhatsApp(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);
}

export function colorEstadoCartera(estado: string) {
  switch (estado) {
    case "ACTIVO":   return "bg-brand/10 text-brand border-brand/20";
    case "GANADO":   return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400";
    case "PERDIDO":  return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400";
    case "ARCHIVADO": return "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400";
    default:         return "bg-gray-100 text-gray-600";
  }
}
