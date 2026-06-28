import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-page)] p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-[var(--color-brand)] mb-4">404</div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Página no encontrada</h1>
        <p className="text-[var(--color-text-muted)] mb-8">Esta página no existe o fue movida.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-brand)] text-white font-semibold"
        >
          <Home className="h-4 w-4" /> Ir al inicio
        </Link>
      </div>
    </div>
  );
}
