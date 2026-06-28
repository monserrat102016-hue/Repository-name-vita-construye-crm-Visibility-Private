"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import VitaLogo from "@/components/VitaLogo";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Correo o contraseña incorrectos");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[var(--color-navy-dark)] via-[var(--color-navy)] to-[var(--color-navy-light)]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <VitaLogo tono="claro" alto="h-16" className="mb-3" />
          <p className="text-sm text-white/60 mt-1">Sistema de gestión de clientes</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-modal)] border border-[var(--color-surface-border)] shadow-[var(--shadow-raised)] p-6">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-5">Iniciar sesión</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tu@correo.com"
              required
              autoComplete="email"
              autoFocus
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Contraseña</label>
              <div className="relative">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] text-base px-3 py-2.5 pr-10 min-h-[44px] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {mostrarPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" cargando={cargando} className="w-full" tamaño="lg">
              Entrar
            </Button>
          </form>
        </div>
        <p className="text-center text-xs text-white/50 mt-4">
          Vita Construye CRM — Gestión de clientes
        </p>
      </div>
    </div>
  );
}
