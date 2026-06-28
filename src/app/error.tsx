"use client";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-page)] p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-red-400 mb-4">500</div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Algo salió mal</h1>
        <p className="text-[var(--color-text-muted)] mb-8">Ocurrió un error inesperado. Por favor intenta de nuevo.</p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-brand)] text-white font-semibold"
        >
          <RefreshCw className="h-4 w-4" /> Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
