import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

async function verificarAcceso(sesion: { usuarioId: string; rol: string }, clienteId: string) {
  const c = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { vendedorId: true, eliminadoEn: true } });
  if (!c || c.eliminadoEn) return null;
  if (sesion.rol !== "ADMIN" && c.vendedorId !== sesion.usuarioId) return null;
  return c;
}

export async function GET(req: NextRequest, ctx: RouteContext<"/api/clientes/[id]">) {
  const sesion = await obtenerSesion();
  if (!sesion) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const acceso = await verificarAcceso(sesion, id);
  if (!acceso) return Response.json({ error: "No encontrado" }, { status: 404 });

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      vendedor: { select: { id: true, nombre: true } },
      etiquetas: { include: { etiqueta: true } },
      citas: { where: { eliminadoEn: null }, orderBy: { inicio: "desc" } },
      pagos: { where: { eliminadoEn: null }, orderBy: { creadoEn: "desc" } },
      interacciones: { where: { eliminadoEn: null }, orderBy: { fecha: "desc" } },
      archivos: { where: { eliminadoEn: null }, orderBy: { creadoEn: "desc" }, select: { id: true, nombre: true, tipo: true, tamano: true, etiqueta: true, subidoPor: true, creadoEn: true, esUrl: true } },
    },
  });

  return Response.json({ cliente });
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/clientes/[id]">) {
  const sesion = await obtenerSesion();
  if (!sesion) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const acceso = await verificarAcceso(sesion, id);
  if (!acceso) return Response.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();

  try {
    const { accion, ...datos } = body;

    if (accion === "marcar-ganado") {
      const cliente = await prisma.$transaction(async (tx) => {
        const c = await tx.cliente.update({
          where: { id },
          data: { estadoCartera: "GANADO", ganadoEn: new Date(), ultimoContacto: new Date() },
        });
        await tx.interaccion.create({
          data: { clienteId: id, tipo: "estado", descripcion: `Marcado como GANADO 🎉 — $${c.valorEstimado.toLocaleString("es-MX")}`, usuarioNombre: sesion.nombre, usuarioId: sesion.usuarioId },
        });
        return c;
      });
      await registrarAuditoria({ usuarioId: sesion.usuarioId, usuarioNombre: sesion.nombre, accion: "marcó ganado", recursoTipo: "cliente", recursoId: id, recursoNombre: cliente.nombre });
      return Response.json({ cliente });
    }

    if (accion === "marcar-perdido") {
      const motivo = datos.motivoPerdida || "Otro";
      const cliente = await prisma.$transaction(async (tx) => {
        const c = await tx.cliente.update({
          where: { id },
          data: { estadoCartera: "PERDIDO", perdidoEn: new Date(), motivoPerdida: motivo },
        });
        await tx.interaccion.create({
          data: { clienteId: id, tipo: "estado", descripcion: `Marcado como PERDIDO — motivo: ${motivo}`, usuarioNombre: sesion.nombre, usuarioId: sesion.usuarioId },
        });
        return c;
      });
      await registrarAuditoria({ usuarioId: sesion.usuarioId, usuarioNombre: sesion.nombre, accion: "marcó perdido", recursoTipo: "cliente", recursoId: id });
      return Response.json({ cliente });
    }

    if (accion === "archivar") {
      const actual = await prisma.cliente.findUnique({ where: { id }, select: { estadoCartera: true, etapa: true } });
      const cliente = await prisma.$transaction(async (tx) => {
        const c = await tx.cliente.update({
          where: { id },
          data: { estadoCartera: "ARCHIVADO", archivadoEn: new Date(), etapaAnterior: actual?.etapa, estadoAnterior: actual?.estadoCartera },
        });
        await tx.interaccion.create({
          data: { clienteId: id, tipo: "estado", descripcion: "Archivado", usuarioNombre: sesion.nombre, usuarioId: sesion.usuarioId },
        });
        return c;
      });
      await registrarAuditoria({ usuarioId: sesion.usuarioId, usuarioNombre: sesion.nombre, accion: "archivó", recursoTipo: "cliente", recursoId: id });
      return Response.json({ cliente });
    }

    if (accion === "restaurar") {
      const actual = await prisma.cliente.findUnique({ where: { id }, select: { etapaAnterior: true, estadoAnterior: true } });
      const cliente = await prisma.$transaction(async (tx) => {
        const c = await tx.cliente.update({
          where: { id },
          data: { estadoCartera: actual?.estadoAnterior || "ACTIVO", archivadoEn: null, etapa: actual?.etapaAnterior || "Nuevo" },
        });
        await tx.interaccion.create({
          data: { clienteId: id, tipo: "estado", descripcion: "Restaurado desde Archivados", usuarioNombre: sesion.nombre, usuarioId: sesion.usuarioId },
        });
        return c;
      });
      return Response.json({ cliente });
    }

    if (accion === "reactivar") {
      const cliente = await prisma.$transaction(async (tx) => {
        const c = await tx.cliente.update({
          where: { id },
          data: { estadoCartera: "ACTIVO", etapa: "Nuevo", proximaAccion: "Contactar para reactivar", proximaAccionFecha: new Date(Date.now() + 86400000), perdidoEn: null, archivadoEn: null },
        });
        await tx.interaccion.create({
          data: { clienteId: id, tipo: "estado", descripcion: "Reactivado — regresa al embudo como Nuevo", usuarioNombre: sesion.nombre, usuarioId: sesion.usuarioId },
        });
        return c;
      });
      return Response.json({ cliente });
    }

    if (accion === "asignar") {
      if (sesion.rol !== "ADMIN") return Response.json({ error: "Solo el administrador puede asignar clientes" }, { status: 403 });
      const vendedorId = datos.vendedorId || null;
      const vendedor = vendedorId ? await prisma.usuario.findUnique({ where: { id: vendedorId }, select: { nombre: true } }) : null;
      const cliente = await prisma.$transaction(async (tx) => {
        const c = await tx.cliente.update({ where: { id }, data: { vendedorId } });
        await tx.interaccion.create({
          data: { clienteId: id, tipo: "asignacion", descripcion: vendedor ? `Asignado a ${vendedor.nombre}` : "Sin asignar", usuarioNombre: sesion.nombre, usuarioId: sesion.usuarioId },
        });
        return c;
      });
      await registrarAuditoria({ usuarioId: sesion.usuarioId, usuarioNombre: sesion.nombre, accion: "asignó cliente", recursoTipo: "cliente", recursoId: id, recursoNombre: vendedor?.nombre });
      return Response.json({ cliente });
    }

    if (accion === "mover-etapa") {
      const etapaAnterior = (await prisma.cliente.findUnique({ where: { id }, select: { etapa: true } }))?.etapa;
      const cliente = await prisma.$transaction(async (tx) => {
        const c = await tx.cliente.update({ where: { id }, data: { etapa: datos.etapa } });
        await tx.interaccion.create({
          data: { clienteId: id, tipo: "etapa", descripcion: `Movido de "${etapaAnterior}" a "${datos.etapa}"`, usuarioNombre: sesion.nombre, usuarioId: sesion.usuarioId },
        });
        return c;
      });
      return Response.json({ cliente });
    }

    // Actualización general
    const clienteActual = await prisma.cliente.findUnique({ where: { id } });
    const cliente = await prisma.$transaction(async (tx) => {
      const c = await tx.cliente.update({
        where: { id },
        data: {
          ...datos,
          proximaAccionFecha: datos.proximaAccionFecha ? new Date(datos.proximaAccionFecha) : datos.proximaAccionFecha === null ? null : undefined,
          ultimoContacto: datos.ultimoContacto ? new Date(datos.ultimoContacto) : undefined,
        },
      });
      if (datos.etapa && datos.etapa !== clienteActual?.etapa) {
        await tx.interaccion.create({
          data: { clienteId: id, tipo: "etapa", descripcion: `Etapa cambiada a "${datos.etapa}"`, usuarioNombre: sesion.nombre, usuarioId: sesion.usuarioId },
        });
      }
      return c;
    });

    await registrarAuditoria({ usuarioId: sesion.usuarioId, usuarioNombre: sesion.nombre, accion: "editó", recursoTipo: "cliente", recursoId: id });
    return Response.json({ cliente });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/clientes/[id]">) {
  const sesion = await obtenerSesion();
  if (!sesion) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await ctx.params;
  const acceso = await verificarAcceso(sesion, id);
  if (!acceso) return Response.json({ error: "No autorizado" }, { status: 403 });

  // Soft delete
  const cliente = await prisma.cliente.update({
    where: { id },
    data: { eliminadoEn: new Date() },
    select: { nombre: true },
  });

  await registrarAuditoria({ usuarioId: sesion.usuarioId, usuarioNombre: sesion.nombre, accion: "borró", recursoTipo: "cliente", recursoId: id, recursoNombre: cliente.nombre });
  return Response.json({ ok: true });
}
