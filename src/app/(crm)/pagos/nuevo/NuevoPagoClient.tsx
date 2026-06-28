"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Banknote, ArrowLeftRight, CreditCard, Landmark, FileText, Smartphone, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

interface ClienteMin { id: string; nombre: string; estadoCartera: string }

// Opciones de método de pago (las más usadas en México)
const METODOS = [
  { valor: "Efectivo",      icono: Banknote },
  { valor: "Transferencia", icono: ArrowLeftRight },
  { valor: "Depósito",      icono: Landmark },
  { valor: "Tarjeta",       icono: CreditCard },
  { valor: "Terminal (TPV)",icono: Smartphone },
  { valor: "Cheque",        icono: FileText },
];

// Conceptos típicos de una venta de material
const CONCEPTOS = ["Anticipo", "Abono / pago parcial", "Liquidación", "Pago de contado", "Apartado de material", "Flete / entrega"];

// Estatus del pago
const ESTATUS = [
  { valor: "pagado",    etiqueta: "Cobrado",    desc: "Ya recibiste el dinero", icono: CheckCircle2, color: "green" },
  { valor: "pendiente", etiqueta: "Por cobrar", desc: "Acordado, aún sin pagar", icono: Clock,        color: "yellow" },
  { valor: "vencido",   etiqueta: "Vencido",    desc: "Pasó la fecha de pago",  icono: AlertTriangle, color: "red" },
];

export default function NuevoPagoClient({ clientes, clienteIdInicial }: { clientes: ClienteMin[]; clienteIdInicial?: string }) {
  const router = useRouter();
  const hoy = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    clienteId: clienteIdInicial || "",
    monto: "",
    metodo: "Efectivo",
    concepto: "Anticipo",
    estatus: "pagado",
    fechaPago: hoy,
    fechaVencimiento: "",
    notas: "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clienteId) { setError("Selecciona un cliente."); return; }
    const monto = parseFloat(form.monto);
    if (!monto || monto <= 0) { setError("Escribe un monto válido mayor a 0."); return; }

    setGuardando(true); setError("");
    try {
      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: form.clienteId,
          monto,
          metodo: form.metodo,
          concepto: form.concepto,
          estatus: form.estatus,
          fechaPago: form.estatus === "pagado" ? form.fechaPago : undefined,
          fechaVencimiento: form.estatus !== "pagado" && form.fechaVencimiento ? form.fechaVencimiento : undefined,
          notas: form.notas || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "No se pudo registrar el pago."); setGuardando(false); return; }
      router.push(`/clientes/${form.clienteId}`);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo."); setGuardando(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-[var(--color-acento-pagos)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Registrar pago</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cliente */}
          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-1">Cliente *</label>
            <select
              value={form.clienteId}
              onChange={(e) => upd("clienteId", e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-[var(--color-surface-border)] text-base bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
            >
              <option value="">— Selecciona el cliente —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            {clientes.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Aún no tienes clientes. Crea uno primero.</p>
            )}
          </div>

          {/* Monto */}
          <Input
            label="Monto (MXN) *"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={form.monto}
            onChange={(e) => upd("monto", e.target.value)}
            placeholder="0.00"
            icono={<span className="font-semibold">$</span>}
          />

          {/* Método de pago */}
          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">Método de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {METODOS.map((m) => {
                const Icono = m.icono;
                const activo = form.metodo === m.valor;
                return (
                  <button
                    key={m.valor}
                    type="button"
                    onClick={() => upd("metodo", m.valor)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                      activo
                        ? "border-[var(--color-brand)] bg-[var(--color-brand-bg)] text-[var(--color-brand-dark)]"
                        : "border-[var(--color-surface-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]"
                    }`}
                  >
                    <Icono className="h-5 w-5" />
                    {m.valor}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Concepto */}
          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-1">Concepto</label>
            <select
              value={form.concepto}
              onChange={(e) => upd("concepto", e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-[var(--color-surface-border)] text-base bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
            >
              {CONCEPTOS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Estatus */}
          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">Estatus del pago</label>
            <div className="grid grid-cols-3 gap-2">
              {ESTATUS.map((s) => {
                const Icono = s.icono;
                const activo = form.estatus === s.valor;
                return (
                  <button
                    key={s.valor}
                    type="button"
                    onClick={() => upd("estatus", s.valor)}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-center transition-all ${
                      activo
                        ? s.color === "green" ? "border-green-500 bg-green-50 text-green-700"
                        : s.color === "yellow" ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : "border-red-500 bg-red-50 text-red-700"
                        : "border-[var(--color-surface-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]"
                    }`}
                  >
                    <Icono className="h-5 w-5" />
                    <span className="text-xs font-semibold">{s.etiqueta}</span>
                    <span className="text-[10px] opacity-80 leading-tight">{s.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fecha según estatus */}
          {form.estatus === "pagado" ? (
            <Input label="Fecha en que se pagó" type="date" value={form.fechaPago} onChange={(e) => upd("fechaPago", e.target.value)} />
          ) : (
            <Input label="Fecha límite de pago" type="date" value={form.fechaVencimiento} onChange={(e) => upd("fechaVencimiento", e.target.value)} ayuda="Para recordarte cobrar a tiempo." />
          )}

          {/* Notas */}
          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-1">Notas (opcional)</label>
            <textarea
              value={form.notas}
              onChange={(e) => upd("notas", e.target.value)}
              rows={2}
              placeholder="Ej. Anticipo del 50% para losa de 80 m²"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-surface-border)] text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] resize-none focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="submit" variante="primario" cargando={guardando} className="flex-1">
              Guardar pago
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
