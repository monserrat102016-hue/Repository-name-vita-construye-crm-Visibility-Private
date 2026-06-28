"use client";
import { useState } from "react";
import { Search, Bell, HelpCircle, Sun, Moon, Monitor, LogOut, User, Settings } from "lucide-react";
import { cn, iniciales } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MobileMenu from "./MobileMenu";

interface TopBarProps {
  usuario: { nombre: string; rol: string; foto?: string | null; temaPreferencia?: string };
  notificacionesNoLeidas?: number;
}

export default function TopBar({ usuario, notificacionesNoLeidas = 0 }: TopBarProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const router = useRouter();

  const cerrarSesion = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="h-16 flex items-center gap-3 px-4 md:px-6 border-b border-[var(--color-surface-border)] bg-[var(--color-surface)] sticky top-0 z-20 glass">
      {/* Menú móvil (todas las secciones) */}
      <MobileMenu rol={usuario.rol} />

      {/* Buscador (escritorio) */}
      <button
        onClick={() => router.push("/clientes?buscar=true")}
        className="hidden md:flex items-center gap-2 flex-1 max-w-sm px-3 py-2 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-muted)] hover:border-[var(--color-brand)] transition-colors"
        aria-label="Buscar"
      >
        <Search className="h-4 w-4" />
        <span>Buscar… (Ctrl+K)</span>
      </button>

      {/* Buscador móvil */}
      <button
        onClick={() => router.push("/clientes?buscar=true")}
        className="md:hidden p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]"
        aria-label="Buscar"
      >
        <Search className="h-5 w-5" />
      </button>

      <div className="flex-1 md:flex-none" />

      {/* Notificaciones */}
      <button
        className="relative p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
        aria-label={`Notificaciones${notificacionesNoLeidas > 0 ? ` (${notificacionesNoLeidas} nuevas)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {notificacionesNoLeidas > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {notificacionesNoLeidas > 9 ? "9+" : notificacionesNoLeidas}
          </span>
        )}
      </button>

      {/* Ayuda */}
      <Link
        href="/ayuda"
        className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors flex items-center gap-1.5"
        aria-label="Ayuda"
      >
        <HelpCircle className="h-5 w-5" />
        <span className="hidden lg:inline text-sm font-medium">Ayuda</span>
      </Link>

      {/* Avatar / Menú de usuario */}
      <div className="relative">
        <button
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--color-surface-raised)] transition-colors"
          aria-label="Menú de usuario"
          aria-expanded={menuAbierto}
        >
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-white text-sm font-bold select-none">
            {usuario.foto ? (
              <img src={usuario.foto} alt={usuario.nombre} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              iniciales(usuario.nombre)
            )}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">{usuario.nombre}</span>
            <span className="text-xs text-[var(--color-text-muted)] leading-tight">{usuario.rol === "ADMIN" ? "Admin" : "Vendedor"}</span>
          </div>
        </button>

        {menuAbierto && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuAbierto(false)} />
            <div className={cn(
              "absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--color-surface-border)]",
              "bg-[var(--color-surface)] shadow-[var(--shadow-modal)] z-50 py-1"
            )}>
              <div className="px-4 py-3 border-b border-[var(--color-surface-border)]">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{usuario.nombre}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{usuario.rol === "ADMIN" ? "Administrador" : "Vendedor"}</p>
              </div>
              <MenuItem href="/perfil" icono={<User className="h-4 w-4" />} onClick={() => setMenuAbierto(false)}>Mi perfil</MenuItem>
              <MenuItem href="/configuracion" icono={<Settings className="h-4 w-4" />} onClick={() => setMenuAbierto(false)}>Configuración</MenuItem>
              <div className="my-1 border-t border-[var(--color-surface-border)]" />
              <button
                onClick={cerrarSesion}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function MenuItem({ href, icono, children, onClick }: { href: string; icono: React.ReactNode; children: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] transition-colors"
    >
      {icono}
      {children}
    </Link>
  );
}
