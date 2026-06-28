import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export default function Card({ children, className, glass, hover, padding = "md" }: CardProps) {
  const pads = { none: "", sm: "p-3", md: "p-4 md:p-5", lg: "p-6 md:p-8" };
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--color-surface-border)] bg-[var(--color-surface)]",
        "shadow-[var(--shadow-card)]",
        glass && "glass",
        hover && "transition-shadow hover:shadow-[var(--shadow-raised)]",
        pads[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 mb-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-lg font-bold text-[var(--color-text-primary)]", className)}>{children}</h2>;
}
