import { obtenerUsuarioActual } from "@/lib/auth";
import { redirect } from "next/navigation";
import Card from "@/components/ui/Card";
import { User } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function PerfilPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <User className="h-5 w-5 text-[var(--color-brand)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Mi perfil</h1>
      </div>
      <Card>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-white text-2xl font-bold">
            {usuario.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{usuario.nombre}</h2>
            <p className="text-sm text-[var(--color-text-muted)]">{usuario.correo}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{usuario.rol === "ADMIN" ? "Administrador" : "Vendedor"}</p>
          </div>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">Para cambiar tu contraseña o datos, contacta al administrador.</p>
      </Card>
    </div>
  );
}
