import { obtenerUsuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import EquipoClient from "./EquipoClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Equipo" };

export default async function EquipoPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");
  if (usuario.rol !== "ADMIN") redirect("/dashboard");

  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  const vendedores = await prisma.usuario.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, correo: true, rol: true, metaMensual: true },
    orderBy: { nombre: "asc" },
  });

  const miembros = await Promise.all(vendedores.map(async (v) => {
    const [cierres, ingresos, activos, fasesRaw] = await Promise.all([
      prisma.cliente.count({ where: { vendedorId: v.id, estadoCartera: "GANADO", ganadoEn: { gte: inicioMes }, eliminadoEn: null } }),
      prisma.pago.aggregate({ where: { cliente: { vendedorId: v.id }, estatus: "pagado", fechaPago: { gte: inicioMes }, eliminadoEn: null }, _sum: { monto: true } }),
      prisma.cliente.count({ where: { vendedorId: v.id, estadoCartera: "ACTIVO", eliminadoEn: null } }),
      prisma.cliente.groupBy({ by: ["etapa"], where: { vendedorId: v.id, eliminadoEn: null, estadoCartera: { not: "ARCHIVADO" } }, _count: true }),
    ]);
    return {
      ...v,
      cierres,
      ingresos: ingresos._sum.monto || 0,
      activos,
      fases: fasesRaw.map((f) => ({ etapa: f.etapa, count: f._count })),
    };
  }));

  const sinAsignar = await prisma.cliente.findMany({
    where: { vendedorId: null, eliminadoEn: null, estadoCartera: { not: "ARCHIVADO" } },
    select: { id: true, nombre: true, etapa: true, temperatura: true },
    orderBy: { creadoEn: "desc" },
    take: 500,
  });

  return <EquipoClient miembros={miembros} sinAsignar={sinAsignar} />;
}
