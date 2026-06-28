"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, LayoutDashboard, Users, KanbanSquare, CalendarDays, ListChecks,
  Wallet, Trophy, XCircle, Archive, UserCog, Share2, ShieldCheck, Megaphone,
  Settings, User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import VitaLogo from "@/components/VitaLogo";

const nav = [
  { href: "/dashboard",   label: "Tablero",     icono: LayoutDashboard },
  { href: "/clientes",    label: "Clientes",    icono: Users },
  { href: "/embudo",      label: "Embudo",      icono: KanbanSquare },
  { href: "/agenda",      label: "Agenda",      icono: CalendarDays },
  { href: "/seguimiento", label: "Seguimiento", icono: ListChecks },
  { href: "/campanas",    label: "Campañas",    icono: Megaphone },
  { href: "/pagos",       label: "Pagos",       icono: Wallet, soloAdmin: true },
  { tipo: "separador" as const },
  { href: "/completados", label: "Completados", icono: Trophy },
  { href: "/perdidos",    label: "Perdidos",    icono: XCircle },
  { href: "/archivados",  label: "Archivados",  icono: Archive },
  { tipo: "separador" as const },
  { href: "/equipo",      label: "Equipo",      icono: UserCog, soloAdmin: true },
  { href: "/compartir",   label: "Comparte",    icono: Share2 },
  { href: "/admin",       label: "Admin",       icono: ShieldCheck, soloAdmin: true },
  { tipo: "separador" as const },
  { href: "/perfil",        label: "Mi perfil",     icono: UserIcon },
  { href: "/configuracion", label: "Configuración", icono: Settings },
];

export default function MobileMenu({ rol }: { rol: string }) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const esAdmin = rol === "ADMIN";

  const items = nav.filter((item) => !("soloAdmin" in item && item.soloAdmin && !esAdmin));

  return (
    <>
      {/* Botón menú (solo móvil) */}
      <button
        onClick={() => setAbierto(true)}
        className="md:hidden p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]"
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Fondo oscuro */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setAbierto(false)} />

          {/* Cajón lateral */}
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85%] bg-[var(--color-navy)] text-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <VitaLogo tono="claro" alto="h-8" />
              <button onClick={() => setAbierto(false)} aria-label="Cerrar menú" className="p-1.5 rounded-lg hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-2">
              {items.map((item, i) => {
                if ("tipo" in item) {
                  return <div key={`sep-${i}`} className="my-2 border-t border-white/10" />;
                }
                const Icono = item.icono;
                const activo = pathname.startsWith(`/${item.href.split("/")[1]}`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setAbierto(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium min-h-[48px]",
                      activo ? "bg-[var(--color-brand)] text-white font-semibold" : "text-white/80 hover:bg-white/10"
                    )}
                  >
                    <Icono className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
