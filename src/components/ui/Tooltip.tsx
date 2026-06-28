"use client";
import { useState, useRef } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  contenido: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function Tooltip({ contenido, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2",
            "bg-[var(--color-text-primary)] text-[var(--color-surface)] text-xs rounded-lg px-3 py-2",
            "shadow-[var(--shadow-raised)] max-w-[260px] text-center whitespace-pre-wrap",
            "pointer-events-none"
          )}
        >
          {contenido}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--color-text-primary)]" />
        </div>
      )}
    </div>
  );
}

interface InfoIconProps {
  contenido: React.ReactNode;
  className?: string;
}

export function InfoIcon({ contenido, className }: InfoIconProps) {
  return (
    <Tooltip contenido={contenido} className={className}>
      <button
        type="button"
        aria-label="Más información"
        className="inline-flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-brand)] focus-visible:text-[var(--color-brand)] transition-colors"
        onClick={(e) => e.preventDefault()}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
    </Tooltip>
  );
}
