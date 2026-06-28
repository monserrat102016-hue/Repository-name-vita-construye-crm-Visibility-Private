"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo?: string;
  children: React.ReactNode;
  tamaño?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function Modal({ abierto, onCerrar, titulo, children, tamaño = "md", className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (abierto) { el.showModal(); }
    else { el.close(); }
  }, [abierto]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [onCerrar]);

  const tamaños = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "m-auto rounded-[var(--radius-modal)] p-0 border border-[var(--color-surface-border)]",
        "bg-[var(--color-surface)] shadow-[var(--shadow-modal)]",
        "w-full backdrop:bg-black/50 backdrop:backdrop-blur-sm",
        tamaños[tamaño],
        className
      )}
      onClick={(e) => { if (e.target === dialogRef.current) onCerrar(); }}
    >
      {titulo && (
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-surface-border)]">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{titulo}</h2>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      <div className="p-5">{children}</div>
    </dialog>
  );
}
