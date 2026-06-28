"use client";
import { useState } from "react";
import { Share2, Copy, Check, ExternalLink } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";

const CANALES = [
  { id: "instagram", label: "Instagram", utm: "?utm=instagram", emoji: "📸" },
  { id: "whatsapp",  label: "WhatsApp",  utm: "?utm=whatsapp",  emoji: "💬" },
  { id: "facebook",  label: "Facebook",  utm: "?utm=facebook",  emoji: "👍" },
  { id: "volante",   label: "Volante/Evento", utm: "?utm=volante", emoji: "📄" },
];

export default function CompartirClient() {
  const [copiado, setCopiado] = useState<string | null>(null);
  const { mostrar } = useToast();

  const copiar = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(id);
      mostrar("¡Liga copiada al portapapeles! ✓", "exito");
      setTimeout(() => setCopiado(null), 2000);
    });
  };

  const compartirWA = (url: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Hola! Agenda tu cita con Vita Construye aquí: ${url}`)}`, "_blank");
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5 text-[var(--color-brand)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Comparte y crece</h1>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)]">Difunde tu landing y mide qué canal vende más.</p>

      <Card>
        <h2 className="font-bold text-[var(--color-text-primary)] mb-1">Tu página de citas</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-3">Esta es tu liga principal. Compártela por todos lados.</p>
        <div className="flex items-center gap-2 p-3 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-surface-border)]">
          <code className="flex-1 text-sm text-[var(--color-brand-dark)] font-mono truncate">{BASE_URL}/agenda</code>
          <Button
            tamaño="sm"
            variante="primario"
            icono={copiado === "main" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            onClick={() => copiar(`${BASE_URL}/agenda`, "main")}
          >
            {copiado === "main" ? "Copiada ✓" : "Copiar liga"}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="font-bold text-[var(--color-text-primary)] mb-3">Ligas por canal (con seguimiento)</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">Cada canal tiene su propia liga. Cuando un cliente entra por una, se registra automáticamente de dónde vino.</p>
        <div className="space-y-3">
          {CANALES.map((c) => {
            const url = `${BASE_URL}/agenda${c.utm}`;
            return (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-surface-border)] hover:bg-[var(--color-surface-raised)]">
                <span className="text-xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{c.label}</p>
                  <code className="text-xs text-[var(--color-text-muted)] truncate block">{url}</code>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => compartirWA(url)}
                    className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                    title="Compartir por WhatsApp"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => copiar(url, c.id)}
                    className="p-1.5 rounded-lg text-[var(--color-brand)] hover:bg-[var(--color-brand-bg)] transition-colors"
                    title="Copiar liga"
                  >
                    {copiado === c.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="font-bold text-[var(--color-text-primary)] mb-2">Abre tu landing</h2>
        <a
          href="/agenda"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-[var(--color-brand)] font-medium hover:underline"
        >
          <ExternalLink className="h-4 w-4" /> Ver cómo se ve tu página de citas
        </a>
      </Card>
    </div>
  );
}
