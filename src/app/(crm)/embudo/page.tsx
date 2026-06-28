import { obtenerUsuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import EmbudoClient from "./EmbudoClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Embudo de ventas" };

const ETAPAS = ["Nuevo","Contactado","Proyecto Calificado","Asesoría Técnica","Información Completa","Cotización Enviada","Seguimiento","Negociación","Pedido Confirmado"];

export default async function EmbudoPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const filtroBase = {
    estadoCartera: "ACTIVO",
    eliminadoEn: null as null,
    ...(usuario.rol !== "ADMIN" ? { vendedorId: usuario.id } : {}),
  };

  const clientes = await prisma.cliente.findMany({
    where: filtroBase,
    include: {
      vendedor: { select: { nombre: true } },
      etiquetas: { include: { etiqueta: true } },
    },
    orderBy: { actualizadoEn: "desc" },
  });

  // Agrupar por etapa
  const columnas = ETAPAS.map((etapa) => {
    const items = clientes.filter((c) => c.etapa === etapa);
    const dinero = items.reduce((a, c) => a + c.valorEstimado, 0);
    return { etapa, items, dinero };
  });

  const [completados, perdidos, archivados] = await Promise.all([
    prisma.cliente.count({ where: { ...filtroBase, estadoCartera: "GANADO" } }),
    prisma.cliente.count({ where: { ...filtroBase, estadoCartera: "PERDIDO" } }),
    prisma.cliente.count({ where: { ...filtroBase, estadoCartera: "ARCHIVADO" } }),
  ]);

  return (
    <EmbudoClient
      columnasIniciales={JSON.parse(JSON.stringify(columnas))}
      contadores={{ completados, perdidos, archivados }}
      usuarioId={usuario.id}
      esAdmin={usuario.rol === "ADMIN"}
    />
  );
}
