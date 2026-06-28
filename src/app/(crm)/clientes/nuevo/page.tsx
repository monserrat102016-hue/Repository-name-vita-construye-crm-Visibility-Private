"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

const ETAPAS = ["NUEVO", "CONTACTADO", "PRESENTACION", "COTIZACION", "NEGOCIACION", "CIERRE"];
const CANALES = ["Facebook", "Instagram", "WhatsApp", "Google", "Referido", "Visita directa", "Landing", "Otro"];

export default function NuevoClientePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: "", telefono: "", correo: "", empresa: "", etapa: "NUEVO",
    canalOrigen: "", temperatura: "TIBIO", notas: "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [duplicado, setDuplicado] = useState<{ clienteId: string; mensaje: string } | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre) { setError("El nombre es obligatorio."); return; }
    setGuardando(true); setError(""); setDuplicado(null);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error === "duplicado") {
        setDuplicado({ clienteId: data.clienteId, mensaje: data.mensaje });
        setGuardando(false); return;
      }
      if (!res.ok) { setError(data.error || "Error al guardar"); setGuardando(false); return; }
      router.push(`/clientes/${data.id}`);
    } catch {
      setError("Error de conexión"); setGuardando(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-[var(--color-brand)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Nuevo cliente</h1>
      </div>

      {duplicado && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Posible duplicado</p>
            <p className="text-sm text-amber-700 mt-0.5">{duplicado.mensaje}</p>
            <div className="flex gap-2 mt-3">
              <Button variante="primario" tamaño="sm" onClick={() => router.push(`/clientes/${duplicado.clienteId}`)}>
                Ver cliente existente
              </Button>
              <Button variante="ghost" tamaño="sm" onClick={() => setDuplicado(null)}>
                Crear de todas formas
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre completo *" value={form.nombre} onChange={set("nombre")} placeholder="Ej. Juan Pérez" />
          <Input label="WhatsApp / Teléfono" value={form.telefono} onChange={set("telefono")} placeholder="55 1234 5678" type="tel" />
          <Input label="Correo electrónico" value={form.correo} onChange={set("correo")} placeholder="juan@email.com" type="email" />
          <Input label="Empresa" value={form.empresa} onChange={set("empresa")} placeholder="Constructora XYZ (opcional)" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] block mb-1">Etapa</label>
              <select value={form.etapa} onChange={set("etapa")} className="w-full px-3 py-2 rounded-xl border border-[var(--color-surface-border)] text-sm bg-[var(--color-surface-card)] text-[var(--color-text-primary)]">
                {ETAPAS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] block mb-1">Temperatura</label>
              <select value={form.temperatura} onChange={set("temperatura")} className="w-full px-3 py-2 rounded-xl border border-[var(--color-surface-border)] text-sm bg-[var(--color-surface-card)] text-[var(--color-text-primary)]">
                <option value="CALIENTE">🔥 Caliente</option>
                <option value="TIBIO">🌡️ Tibio</option>
                <option value="FRIO">🧊 Frío</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] block mb-1">¿Cómo nos conoció?</label>
            <select value={form.canalOrigen} onChange={set("canalOrigen")} className="w-full px-3 py-2 rounded-xl border border-[var(--color-surface-border)] text-sm bg-[var(--color-surface-card)] text-[var(--color-text-primary)]">
              <option value="">— Seleccionar —</option>
              {CANALES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] block mb-1">Notas iniciales</label>
            <textarea
              value={form.notas}
              onChange={set("notas")}
              rows={3}
              placeholder="Qué necesita, qué proyecto tiene, observaciones..."
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-surface-border)] text-sm bg-[var(--color-surface-card)] text-[var(--color-text-primary)] resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variante="primario" cargando={guardando} className="flex-1">
              Guardar cliente
            </Button>
            <Button type="button" variante="ghost" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
