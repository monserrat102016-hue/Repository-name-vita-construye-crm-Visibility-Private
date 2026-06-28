import { obtenerUsuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import CampanasClient from "./CampanasClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Campañas" };

export default async function CampanasPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const esAdmin = usuario.rol === "ADMIN";
  const filtro = esAdmin ? {} : { vendedorId: usuario.id };

  const [clientes, enviadas] = await Promise.all([
    prisma.cliente.findMany({
      where: { ...filtro, eliminadoEn: null, telefono: { not: null } },
      select: { id: true, nombre: true, telefono: true, etapa: true, estadoCartera: true, temperatura: true },
      orderBy: { creadoEn: "desc" },
      take: 1000,
    }),
    // Interacciones de campaña = a quién ya se le envió (la más reciente por cliente)
    prisma.interaccion.findMany({
      where: { tipo: "campana", eliminadoEn: null, cliente: { ...filtro, eliminadoEn: null } },
      select: { clienteId: true, fecha: true },
      orderBy: { fecha: "desc" },
    }),
  ]);

  const enviados: Record<string, string> = {};
  for (const e of enviadas) {
    if (!enviados[e.clienteId]) enviados[e.clienteId] = e.fecha.toISOString();
  }

  return <CampanasClient clientes={clientes} enviados={enviados} />;
}
