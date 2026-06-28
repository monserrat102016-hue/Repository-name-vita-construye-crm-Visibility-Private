import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  ayuda?: string;
  icono?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ayuda, icono, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </label>
        )}
        <div className="relative">
          {icono && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {icono}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)]",
              "text-[var(--color-text-primary)] text-base px-3 py-2.5 min-h-[44px]",
              "placeholder:text-[var(--color-text-muted)]",
              "focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20",
              "transition-colors duration-150",
              error && "border-red-500 focus:border-red-500 focus:ring-red-200",
              icono && "pl-10",
              className
            )}
            {...props}
          />
        </div>
        {ayuda && !error && <p className="text-xs text-[var(--color-text-muted)]">{ayuda}</p>}
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
