"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primario" | "secundario" | "peligro" | "ghost" | "outline";
  tamaño?: "sm" | "md" | "lg";
  cargando?: boolean;
  icono?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variante = "primario", tamaño = "md", cargando, icono, children, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer select-none";

    const variantes = {
      primario: "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)] shadow-sm",
      secundario: "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-surface-border)] hover:bg-[var(--color-surface-raised)] shadow-sm",
      peligro: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
      ghost: "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]",
      outline: "border border-[var(--color-brand)] text-[var(--color-brand)] hover:bg-[var(--color-brand-bg)]",
    };

    const tamaños = {
      sm: "text-sm px-3 py-1.5 min-h-[36px]",
      md: "text-sm px-4 py-2 min-h-[40px]",
      lg: "text-base px-6 py-3 min-h-[48px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || cargando}
        className={cn(base, variantes[variante], tamaños[tamaño], className)}
        {...props}
      >
        {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : icono}
        {cargando ? "Guardando…" : children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
