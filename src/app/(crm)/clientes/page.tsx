import { obtenerUsuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import ClientesClient from "./ClientesClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ buscar?: string; etapa?: string; estado?: string; pagina?: string }> }) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const params = await searchParams;
  const pagina = parseInt(params.pagina || "1");
  const porPagina = 25;
  const skip = (pagina - 1) * porPagina;

  const esAdmin = usuario.rol === "ADMIN";
  const filtroBase = {
    eliminadoEn: null,
    estadoCartera: "ACTIVO",
    ...(esAdmin ? {} : { vendedorId: usuario.id }),
  };

  const [clientes, total, etiquetas, vendedores] = await Promise.all([
    prisma.cliente.findMany({
      where: filtroBase,
      include: {
        vendedor: { select: { id: true, nombre: true } },
        etiquetas: { include: { etiqueta: true } },
        pagos: { where: { eliminadoEn: null } },
      },
      orderBy: { actualizadoEn: "desc" },
      skip,
      take: porPagina,
    }),
    prisma.cliente.count({ where: filtroBase }),
    prisma.etiqueta.findMany(),
    esAdmin ? prisma.usuario.findMany({ where: { activo: true }, select: { id: true, nombre: true } }) : [],
  ]);

  return (
    <ClientesClient
      clientesIniciales={JSON.parse(JSON.stringify(clientes))}
      total={total}
      pagina={pagina}
      porPagina={porPagina}
      etiquetas={etiquetas}
      vendedores={vendedores}
      usuarioId={usuario.id}
      esAdmin={esAdmin}
    />
  );
}
