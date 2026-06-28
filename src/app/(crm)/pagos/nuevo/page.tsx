import { obtenerUsuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import NuevoPagoClient from "./NuevoPagoClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Registrar pago" };

export default async function NuevoPagoPage({ searchParams }: { searchParams: Promise<{ clienteId?: string }> }) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");
  if (usuario.rol !== "ADMIN") redirect("/dashboard"); // Solo el admin registra pagos

  const params = await searchParams;
  const esAdmin = usuario.rol === "ADMIN";

  // Solo clientes a los que el usuario tiene acceso
  const clientes = await prisma.cliente.findMany({
    where: {
      eliminadoEn: null,
      ...(!esAdmin ? { vendedorId: usuario.id } : {}),
    },
    select: { id: true, nombre: true, estadoCartera: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <NuevoPagoClient
      clientes={clientes}
      clienteIdInicial={params.clienteId}
    />
  );
}
