"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type TipoToast = "exito" | "error" | "info" | "alerta";

interface ToastItem {
  id: string;
  mensaje: string;
  tipo: TipoToast;
  accion?: { texto: string; fn: () => void };
}

interface ToastContextValue {
  mostrar: (mensaje: string, tipo?: TipoToast, accion?: ToastItem["accion"]) => void;
}

const ToastContext = createContext<ToastContextValue>({ mostrar: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const mostrar = useCallback((mensaje: string, tipo: TipoToast = "exito", accion?: ToastItem["accion"]) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, mensaje, tipo, accion }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), accion ? 8000 : 4000);
  }, []);

  const quitar = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const iconos = {
    exito: <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />,
    info:  <Info className="h-5 w-5 text-blue-500 shrink-0" />,
    alerta:<AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />,
  };

  return (
    <ToastContext.Provider value={{ mostrar }}>
      {children}
      <div className="toast-container no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl shadow-[var(--shadow-raised)]",
              "bg-[var(--color-surface)] border border-[var(--color-surface-border)]",
              "text-sm text-[var(--color-text-primary)] min-w-[260px] max-w-[380px]",
              "animate-[fadeSlideIn_0.2s_ease-out]"
            )}
          >
            {iconos[t.tipo]}
            <span className="flex-1">{t.mensaje}</span>
            {t.accion && (
              <button
                onClick={() => { t.accion!.fn(); quitar(t.id); }}
                className="text-[var(--color-brand)] font-semibold hover:underline text-xs shrink-0"
              >
                {t.accion.texto}
              </button>
            )}
            <button onClick={() => quitar(t.id)} aria-label="Cerrar" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
