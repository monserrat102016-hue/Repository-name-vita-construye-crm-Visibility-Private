"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, KanbanSquare, CalendarDays, ListChecks,
  Wallet, Trophy, XCircle, Archive, UserCog, Share2, ShieldCheck,
  Megaphone, ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import VitaLogo, { VitaMark } from "@/components/VitaLogo";
import { useState } from "react";

const nav = [
  { href: "/dashboard",     label: "Tablero",       icono: LayoutDashboard, acento: "text-[var(--color-brand)]" },
  { href: "/clientes",      label: "Clientes",      icono: Users,           acento: "text-[var(--color-acento-clientes)]" },
  { href: "/embudo",        label: "Embudo",        icono: KanbanSquare,    acento: "text-[var(--color-acento-embudo)]" },
  { href: "/agenda",        label: "Agenda",        icono: CalendarDays,    acento: "text-[var(--color-acento-agenda)]" },
  { href: "/seguimiento",   label: "Seguimiento",   icono: ListChecks,      acento: "text-[var(--color-acento-seguimiento)]" },
  { href: "/campanas",      label: "Campañas",      icono: Megaphone,       acento: "text-[var(--color-brand)]" },
  { href: "/pagos",         label: "Pagos",         icono: Wallet,          acento: "text-[var(--color-acento-pagos)]", soloAdmin: true },
  { tipo: "separador" },
  { href: "/completados",   label: "Completados",   icono: Trophy,          acento: "text-[var(--color-acento-completados)]" },
  { href: "/perdidos",      label: "Perdidos",      icono: XCircle,         acento: "text-[var(--color-acento-perdidos)]" },
  { href: "/archivados",    label: "Archivados",    icono: Archive,         acento: "text-[var(--color-acento-archivados)]" },
  { tipo: "separador" },
  { href: "/equipo",        label: "Equipo",        icono: UserCog,         acento: "text-[var(--color-acento-equipo)]", soloAdmin: true },
  { href: "/compartir",     label: "Comparte",      icono: Share2,          acento: "text-[var(--color-brand)]" },
  { href: "/admin",         label: "Admin",         icono: ShieldCheck,     acento: "text-[var(--color-brand)]", soloAdmin: true },
] as const;

interface SidebarProps {
  rol: string;
}

export default function Sidebar({ rol }: SidebarProps) {
  const pathname = usePathname();
  const [contraido, setContraido] = useState(false);
  const esAdmin = rol === "ADMIN";

  const items = nav.filter((item) => {
    if ("soloAdmin" in item && item.soloAdmin && !esAdmin) return false;
    return true;
  });

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0",
        "bg-[var(--color-navy)] text-white transition-all duration-300 shrink-0 z-30",
        contraido ? "w-16" : "w-56"
      )}
    >
      {/* Logo real */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-white/10 min-h-[64px]">
        {contraido ? (
          <VitaMark className="h-7 w-7 mx-auto" />
        ) : (
          <VitaLogo tono="claro" alto="h-9" />
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {items.map((item, i) => {
          if ("tipo" in item) {
            return <div key={i} className="my-2 border-t border-white/10" />;
          }
          const Icono = item.icono;
          const activo = pathname.startsWith(`/${item.href.split("/")[1]}`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={contraido ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                "min-h-[44px] group",
                activo
                  ? "bg-[var(--color-brand)] text-white font-semibold shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icono className={cn("h-5 w-5 shrink-0", activo ? "text-white" : "opacity-90")} />
              {!contraido && <span className="truncate">{item.label}</span>}
              {activo && !contraido && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Botón contraer */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={() => setContraido(!contraido)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          aria-label={contraido ? "Expandir menú" : "Contraer menú"}
        >
          {contraido ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!contraido && <span className="ml-2 text-xs">Contraer</span>}
        </button>
      </div>
    </aside>
  );
}
