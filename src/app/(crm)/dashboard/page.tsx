import { obtenerUsuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatearMoneda, formatearFechaCorta, diasSinContacto } from "@/lib/utils";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tablero" };

export default async function DashboardPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const esAdmin = usuario.rol === "ADMIN";
  const filtroVendedor = esAdmin ? {} : { vendedorId: usuario.id };
  // Los pagos no tienen vendedorId directo: se filtran por el vendedor de su cliente.
  const filtroPago = esAdmin ? {} : { cliente: { vendedorId: usuario.id } };

  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0);

  const config = await prisma.configuracion.findUnique({ where: { id: "global" } });

  // Clientes activos del mes
  const [
    totalNuevos,
    totalGanados,
    ingresosMes,
    clientesActivos,
    pagosVencidos,
    citasMes,
    totalNuevosMesAnt,
    ingresosAnt,
    totalGanadosMesAnt,
  ] = await Promise.all([
    prisma.cliente.count({ where: { ...filtroVendedor, estadoCartera: "ACTIVO", creadoEn: { gte: inicioMes }, eliminadoEn: null } }),
    prisma.cliente.count({ where: { ...filtroVendedor, estadoCartera: "GANADO", ganadoEn: { gte: inicioMes }, eliminadoEn: null } }),
    prisma.pago.aggregate({ where: { ...filtroPago, estatus: "pagado", fechaPago: { gte: inicioMes }, eliminadoEn: null }, _sum: { monto: true } }),
    prisma.cliente.count({ where: { ...filtroVendedor, estadoCartera: "ACTIVO", eliminadoEn: null } }),
    prisma.pago.aggregate({ where: { ...filtroPago, estatus: "vencido", eliminadoEn: null }, _sum: { monto: true }, _count: true }),
    prisma.cita.count({ where: { ...filtroVendedor, inicio: { gte: inicioMes }, eliminadoEn: null } }),
    prisma.cliente.count({ where: { ...filtroVendedor, creadoEn: { gte: inicioMesAnterior, lte: finMesAnterior }, eliminadoEn: null } }),
    prisma.pago.aggregate({ where: { ...filtroPago, estatus: "pagado", fechaPago: { gte: inicioMesAnterior, lte: finMesAnterior }, eliminadoEn: null }, _sum: { monto: true } }),
    prisma.cliente.count({ where: { ...filtroVendedor, estadoCartera: "GANADO", ganadoEn: { gte: inicioMesAnterior, lte: finMesAnterior }, eliminadoEn: null } }),
  ]);

  // Historial últimos 6 meses para gráfica
  const datosMeses: { mes: string; ingresos: number; ganados: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const ini = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const fin = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 0);
    const [ing, gan] = await Promise.all([
      prisma.pago.aggregate({ where: { ...filtroPago, estatus: "pagado", fechaPago: { gte: ini, lte: fin }, eliminadoEn: null }, _sum: { monto: true } }),
      prisma.cliente.count({ where: { ...filtroVendedor, estadoCartera: "GANADO", ganadoEn: { gte: ini, lte: fin }, eliminadoEn: null } }),
    ]);
    datosMeses.push({
      mes: ini.toLocaleDateString("es-MX", { month: "short" }),
      ingresos: ing._sum.monto || 0,
      ganados: gan,
    });
  }

  // Valor del embudo activo ponderado
  const embudo = await prisma.cliente.findMany({
    where: { ...filtroVendedor, estadoCartera: "ACTIVO", eliminadoEn: null },
    select: { valorEstimado: true, probabilidadCierre: true, etapa: true },
  });
  const valorEmbudoPonderado = embudo.reduce((acc, c) => acc + (c.valorEstimado * (c.probabilidadCierre / 100)), 0);
  const valorEmbudo = embudo.reduce((acc, c) => acc + c.valorEstimado, 0);

  // Leads en riesgo (activos sin próxima acción o vencida)
  const leadsEnRiesgo = await prisma.cliente.count({
    where: {
      ...filtroVendedor,
      estadoCartera: "ACTIVO",
      eliminadoEn: null,
      OR: [
        { proximaAccionFecha: null },
        { proximaAccionFecha: { lt: ahora } },
      ],
    },
  });

  // Leads nuevos sin contactar >24h
  const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
  const leadsFrios = await prisma.cliente.count({
    where: {
      ...filtroVendedor,
      etapa: "Nuevo",
      estadoCartera: "ACTIVO",
      eliminadoEn: null,
      ultimoContacto: null,
      creadoEn: { lt: hace24h },
    },
  });

  // Fuentes de leads (este mes)
  const fuentes = await prisma.cliente.groupBy({
    by: ["origen"],
    where: { ...filtroVendedor, estadoCartera: "ACTIVO", eliminadoEn: null, creadoEn: { gte: inicioMes } },
    _count: true,
    orderBy: { _count: { origen: "desc" } },
  });

  // Motivos de pérdida
  const motivosPerdida = await prisma.cliente.groupBy({
    by: ["motivoPerdida"],
    where: { ...filtroVendedor, estadoCartera: "PERDIDO", eliminadoEn: null, motivoPerdida: { not: null } },
    _count: true,
    orderBy: { _count: { motivoPerdida: "desc" } },
  });

  const ingresosMesNum = ingresosMes._sum.monto || 0;
  const ingresosAntNum = ingresosAnt._sum.monto || 0;
  const metaMensual = esAdmin ? (config?.metaMensual || 500000) : (usuario.metaMensual || 250000);
  const porcentajeMeta = Math.min((ingresosMesNum / metaMensual) * 100, 100);
  const diasMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
  const diasRestantes = diasMes - ahora.getDate();
  const crecimientoIngresos = ingresosAntNum > 0 ? ((ingresosMesNum - ingresosAntNum) / ingresosAntNum) * 100 : 0;

  const semaforo = valorEmbudoPonderado + ingresosMesNum >= metaMensual ? "verde"
    : valorEmbudoPonderado + ingresosMesNum >= metaMensual * 0.7 ? "amarillo" : "rojo";

  return (
    <DashboardClient
      usuario={{ nombre: usuario.nombre, rol: usuario.rol }}
      datos={{
        totalNuevos,
        totalGanados,
        ingresosMes: ingresosMesNum,
        metaMensual,
        porcentajeMeta,
        clientesActivos,
        pagosVencidosMonto: pagosVencidos._sum.monto || 0,
        pagosVencidosCount: pagosVencidos._count,
        citasMes,
        diasRestantes,
        crecimientoIngresos,
        totalGanadosMesAnt,
        valorEmbudo,
        valorEmbudoPonderado,
        leadsEnRiesgo,
        leadsFrios,
        semaforo,
        datosMeses,
        fuentes: fuentes.map(f => ({ origen: f.origen || "Sin origen", count: f._count })),
        motivosPerdida: motivosPerdida.map(m => ({ motivo: m.motivoPerdida || "Desconocido", count: m._count })),
      }}
    />
  );
}
