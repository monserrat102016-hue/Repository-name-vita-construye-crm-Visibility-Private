"use client";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { LayoutDashboard, TrendingUp, TrendingDown, Users, Trophy, Wallet, AlertTriangle, CalendarDays, Target, Flame } from "lucide-react";
import Card from "@/components/ui/Card";
import { formatearMoneda } from "@/lib/utils";
import { InfoIcon } from "@/components/ui/Tooltip";
import Link from "next/link";

interface DashboardClientProps {
  usuario: { nombre: string; rol: string };
  datos: {
    totalNuevos: number;
    totalGanados: number;
    ingresosMes: number;
    metaMensual: number;
    porcentajeMeta: number;
    clientesActivos: number;
    pagosVencidosMonto: number;
    pagosVencidosCount: number;
    citasMes: number;
    diasRestantes: number;
    crecimientoIngresos: number;
    totalGanadosMesAnt: number;
    valorEmbudo: number;
    valorEmbudoPonderado: number;
    leadsEnRiesgo: number;
    leadsFrios: number;
    semaforo: "verde" | "amarillo" | "rojo";
    datosMeses: { mes: string; ingresos: number; ganados: number }[];
    fuentes: { origen: string; count: number }[];
    motivosPerdida: { motivo: string; count: number }[];
  };
}

export default function DashboardClient({ usuario, datos }: DashboardClientProps) {
  const {
    totalNuevos, totalGanados, ingresosMes, metaMensual, porcentajeMeta,
    clientesActivos, pagosVencidosMonto, pagosVencidosCount, citasMes,
    diasRestantes, crecimientoIngresos, valorEmbudoPonderado,
    leadsEnRiesgo, leadsFrios, semaforo, datosMeses, fuentes, motivosPerdida, valorEmbudo
  } = datos;

  // Solo el administrador (Rodrigo) ve montos en dinero. Los vendedores ven
  // su actividad (clientes, etapas) pero no cifras de dinero ni pagos.
  const verDinero = usuario.rol === "ADMIN";

  const semaforoColor = {
    verde:   "text-green-600 bg-green-50 dark:bg-green-900/20",
    amarillo:"text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
    rojo:    "text-red-600 bg-red-50 dark:bg-red-900/20",
  };

  const semaforoTexto = {
    verde:   "🟢 ¡Vas bien! Con el embudo activo, puedes llegar a la meta.",
    amarillo:"🟡 Ajustado. Aprieta el seguimiento esta semana.",
    rojo:    `🔴 Te faltan ${formatearMoneda(metaMensual - ingresosMes)}. Enfócate en los calientes.`,
  };

  const faltanMetaMes = Math.max(0, metaMensual - ingresosMes);
  const subio = crecimientoIngresos >= 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="h-5 w-5 text-[var(--color-brand)]" />
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Tablero</h1>
            <InfoIcon contenido={"¿Vas a cerrar el mes?\nRevisa tus números aquí cada mañana."} />
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm">Hola, {usuario.nombre} 👋 — quedan {diasRestantes} días del mes.</p>
        </div>
        <Link
          href="/seguimiento"
          className="shrink-0 px-4 py-2 bg-[var(--color-brand)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--color-brand-dark)] transition-colors"
        >
          📋 Hoy te toca
        </Link>
      </div>

      {/* Alertas */}
      {(leadsFrios > 0 || leadsEnRiesgo > 0) && (
        <div className="flex flex-wrap gap-3">
          {leadsFrios > 0 && (
            <Link href="/seguimiento" className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400 hover:bg-red-100 transition-colors">
              <AlertTriangle className="h-4 w-4" />
              <span><strong>{leadsFrios}</strong> lead{leadsFrios !== 1 ? "s" : ""} fríos por demora (&gt;24h sin contacto)</span>
            </Link>
          )}
          {leadsEnRiesgo > 0 && (
            <Link href="/seguimiento" className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl text-sm text-orange-700 dark:text-orange-400 hover:bg-orange-100 transition-colors">
              <Flame className="h-4 w-4" />
              <span><strong>{leadsEnRiesgo}</strong> cliente{leadsEnRiesgo !== 1 ? "s" : ""} en riesgo de enfriarse</span>
            </Link>
          )}
        </div>
      )}

      {/* Bento grid — números clave */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {verDinero ? (
          <MetricaCard
            titulo="Ingresos del mes"
            valor={formatearMoneda(ingresosMes)}
            icono={<Wallet className="h-5 w-5 text-[var(--color-acento-pagos)]" />}
            sub={`${subio ? "▲" : "▼"} ${Math.abs(crecimientoIngresos).toFixed(0)}% vs. mes pasado`}
            subColor={subio ? "text-green-600" : "text-red-600"}
          />
        ) : (
          <MetricaCard
            titulo="Clientes activos"
            valor={clientesActivos.toString()}
            icono={<Users className="h-5 w-5 text-[var(--color-acento-clientes)]" />}
            sub="en tu embudo"
          />
        )}
        <MetricaCard
          titulo="Clientes ganados"
          valor={totalGanados.toString()}
          icono={<Trophy className="h-5 w-5 text-[var(--color-acento-completados)]" />}
          sub="este mes"
        />
        <MetricaCard
          titulo="Nuevos interesados"
          valor={totalNuevos.toString()}
          icono={<Users className="h-5 w-5 text-[var(--color-acento-clientes)]" />}
          sub="este mes"
        />
        <MetricaCard
          titulo="Citas agendadas"
          valor={citasMes.toString()}
          icono={<CalendarDays className="h-5 w-5 text-[var(--color-acento-agenda)]" />}
          sub="este mes"
        />
      </div>

      {/* Meta del mes + pronóstico (solo admin: lleva dinero) */}
      {verDinero && (
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-[var(--color-brand)]" />
            <h2 className="font-bold text-[var(--color-text-primary)]">Meta del mes</h2>
            <InfoIcon contenido="Tu meta de ventas mensual. Cada vez que cierras un cliente, sube la barra." />
          </div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">{formatearMoneda(ingresosMes)}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">de {formatearMoneda(metaMensual)}</p>
            </div>
            <p className="text-2xl font-bold text-[var(--color-brand)]">{porcentajeMeta.toFixed(0)}%</p>
          </div>
          <div className="w-full h-3 rounded-full bg-[var(--color-surface-border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-brand)] transition-all duration-700"
              style={{ width: `${porcentajeMeta}%` }}
            />
          </div>
          {faltanMetaMes > 0 && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              Faltan <strong>{formatearMoneda(faltanMetaMes)}</strong> en {diasRestantes} días
            </p>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-[var(--color-brand)]" />
            <h2 className="font-bold text-[var(--color-text-primary)]">Pronóstico de cierre</h2>
          </div>
          <div className={`rounded-xl px-4 py-3 mb-3 ${semaforoColor[semaforo]}`}>
            <p className="text-sm font-medium">{semaforoTexto[semaforo]}</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Embudo activo (valor real)</span>
              <span className="font-semibold">{formatearMoneda(valorEmbudo)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Embudo ponderado por probabilidad</span>
              <span className="font-semibold">{formatearMoneda(valorEmbudoPonderado)}</span>
            </div>
          </div>
        </Card>
      </div>
      )}

      {/* Gráfica de crecimiento — admin: ingresos | vendedor: clientes ganados */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-[var(--color-brand)]" />
          <h2 className="font-bold text-[var(--color-text-primary)]">
            {verDinero ? "Crecimiento últimos 6 meses" : "Clientes ganados últimos 6 meses"}
          </h2>
          <InfoIcon contenido={verDinero ? "Ingresos cobrados mes por mes. Entre más sube, mejor van las ventas." : "Clientes ganados mes por mes."} />
        </div>
        {datosMeses.every(d => (verDinero ? d.ingresos : d.ganados) === 0) ? (
          <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">Aún juntando historial, esto se llena solo 📈</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={datosMeses} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => (verDinero ? `$${(v / 1000).toFixed(0)}k` : `${v}`)} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} width={50} />
              <Tooltip
                formatter={(value) => [verDinero ? formatearMoneda(Number(value)) : `${value} clientes`, verDinero ? "Ingresos" : "Ganados"]}
                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)", borderRadius: "0.5rem" }}
                labelStyle={{ color: "var(--color-text-primary)", fontWeight: 600 }}
              />
              <Bar dataKey={verDinero ? "ingresos" : "ganados"} fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Fuentes de leads + Motivos de pérdida */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-bold text-[var(--color-text-primary)] mb-3">De dónde llegan tus clientes</h2>
          {fuentes.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">Sin datos este mes aún.</p>
          ) : (
            <div className="space-y-2">
              {fuentes.map((f) => (
                <div key={f.origen} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-[var(--color-text-secondary)]">{f.origen}</span>
                  <div className="w-24 h-2 rounded-full bg-[var(--color-surface-border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-brand)]"
                      style={{ width: `${Math.min((f.count / (fuentes[0]?.count || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="font-semibold text-[var(--color-text-primary)] w-6 text-right">{f.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-bold text-[var(--color-text-primary)] mb-3">Por qué perdemos ventas</h2>
          {motivosPerdida.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">Sin pérdidas registradas. ¡Sigue así! 🎉</p>
          ) : (
            <div className="space-y-2">
              {motivosPerdida.map((m) => (
                <div key={m.motivo} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-[var(--color-text-secondary)]">{m.motivo}</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{m.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Pagos vencidos (solo admin) */}
      {verDinero && pagosVencidosCount > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400">{pagosVencidosCount} pago{pagosVencidosCount !== 1 ? "s" : ""} vencido{pagosVencidosCount !== 1 ? "s"  : ""}</p>
                <p className="text-sm text-red-600 dark:text-red-500">Total: {formatearMoneda(pagosVencidosMonto)}</p>
              </div>
            </div>
            <Link href="/pagos?estatus=vencido" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shrink-0">
              Ver pagos vencidos
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

function MetricaCard({ titulo, valor, icono, sub, subColor }: {
  titulo: string; valor: string; icono: React.ReactNode; sub?: string; subColor?: string;
}) {
  return (
    <Card hover className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-secondary)] font-medium">{titulo}</p>
        {icono}
      </div>
      <p className="text-3xl font-bold text-[var(--color-text-primary)]">{valor}</p>
      {sub && <p className={`text-xs ${subColor || "text-[var(--color-text-muted)]"}`}>{sub}</p>}
    </Card>
  );
}
