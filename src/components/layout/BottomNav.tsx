"use client";
import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, KanbanSquare, ListChecks, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",   label: "Tablero",     icono: LayoutDashboard },
  { href: "/clientes",    label: "Clientes",    icono: Users },
  { href: "/embudo",      label: "Embudo",      icono: KanbanSquare },
  { href: "/seguimiento", label: "Seguimiento", icono: ListChecks },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--color-surface)] border-t border-[var(--color-surface-border)] flex items-center safe-area-inset-bottom">
      {navItems.map((item, i) => {
        const Icono = item.icono;
        const activo = pathname.startsWith(`/${item.href.split("/")[1]}`);
        const esMitad = i === 1;
        return (
          <Fragment key={item.href}>
            {esMitad && (
              <Link
                href="/clientes/nuevo"
                className="flex flex-col items-center justify-center -mt-4 bg-[var(--color-brand)] text-white w-14 h-14 rounded-full shadow-lg mx-2 shrink-0"
                aria-label="Nuevo cliente"
              >
                <Plus className="h-6 w-6" />
              </Link>
            )}
            <Link
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-[10px] font-medium transition-colors min-h-[56px]",
                activo ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)]"
              )}
            >
              <Icono className={cn("h-5 w-5", activo ? "text-[var(--color-brand)]" : "")} />
              {item.label}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}
