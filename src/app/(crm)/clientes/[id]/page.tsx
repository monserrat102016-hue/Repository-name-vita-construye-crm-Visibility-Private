import { obtenerUsuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import ExpedienteClient from "./ExpedienteClient";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({ where: { id }, select: { nombre: true } });
  return { title: cliente?.nombre || "Cliente" };
}

export default async function ExpedientePage({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const { id } = await params;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      vendedor: { select: { id: true, nombre: true } },
      etiquetas: { include: { etiqueta: true } },
      citas: { where: { eliminadoEn: null }, orderBy: { inicio: "desc" } },
      pagos: { where: { eliminadoEn: null }, orderBy: { creadoEn: "desc" } },
      interacciones: { where: { eliminadoEn: null }, orderBy: { fecha: "desc" }, take: 50 },
      archivos: {
        where: { eliminadoEn: null },
        orderBy: { creadoEn: "desc" },
        select: { id: true, nombre: true, tipo: true, tamano: true, etiqueta: true, subidoPor: true, creadoEn: true, esUrl: true },
      },
    },
  });

  if (!cliente || cliente.eliminadoEn) notFound();

  // Verificar acceso
  if (usuario.rol !== "ADMIN" && cliente.vendedorId !== usuario.id) {
    return redirect("/clientes");
  }

  const vendedores = usuario.rol === "ADMIN"
    ? await prisma.usuario.findMany({ where: { activo: true }, select: { id: true, nombre: true } })
    : [{ id: usuario.id, nombre: usuario.nombre }];

  const plantillas = await prisma.plantilla.findMany({
    where: { OR: [{ usuarioId: usuario.id }, { usuarioId: null }] },
    orderBy: [{ favorita: "desc" }, { creadoEn: "desc" }],
  });

  const config = await prisma.configuracion.findUnique({ where: { id: "global" } });

  return (
    <ExpedienteClient
      cliente={JSON.parse(JSON.stringify(cliente))}
      vendedores={vendedores}
      plantillas={JSON.parse(JSON.stringify(plantillas))}
      usuarioActual={{ id: usuario.id, nombre: usuario.nombre, rol: usuario.rol }}
      mensajeWhatsApp={config?.mensajeWhatsApp || "Hola {nombre}, muchas gracias por contactar a Vita Construye."}
      motivosPerdida={JSON.parse(config?.motivosPerdida || '["Precio alto","Se fue con la competencia","No contestó","Otro"]')}
    />
  );
}
