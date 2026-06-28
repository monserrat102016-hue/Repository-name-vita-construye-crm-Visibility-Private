import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

function crearCliente() {
  const url = process.env["DATABASE_URL"] ?? "file:./dev.db";
  if (url.startsWith("file:")) {
    const filePath = url.replace("file:", "");
    const adapter = new PrismaBetterSqlite3({ url: filePath });
    return new PrismaClient({ adapter } as any);
  }
  const adapter = new PrismaNeon({ connectionString: url });
  return new PrismaClient({ adapter } as any);
}

const prisma = crearCliente();

async function main() {
  // Solo corre si la base está vacía
  const existeAdmin = await prisma.usuario.findFirst({ where: { rol: "ADMIN" } });
  if (existeAdmin) {
    console.log("⚠️  Ya hay datos en la base. Seed cancelado para proteger datos reales.");
    return;
  }

  console.log("🌱 Sembrando datos de ejemplo...");

  // Configuración global
  await prisma.configuracion.upsert({
    where: { id: "global" },
    create: {
      nombreNegocio: "Vita Construye",
      colorMarca: "#e8965a",
      moneda: "MXN",
      metaMensual: 500000,
    },
    update: {},
  });

  // Contador de folios
  await prisma.contador.upsert({
    where: { id: "folio_pago" },
    create: { id: "folio_pago", valor: 100 },
    update: {},
  });

  // Contraseñas hasheadas
  const hashAdmin = await bcrypt.hash("VitaAdmin2026!", 12);
  const hashVendedor1 = await bcrypt.hash("Vendedor123!", 12);
  const hashVendedor2 = await bcrypt.hash("Vendedor456!", 12);

  // Usuarios
  const admin = await prisma.usuario.create({
    data: {
      nombre: "Rodrigo Ramírez",
      correo: "admin@vitaconstruye.com",
      passwordHash: hashAdmin,
      rol: "ADMIN",
      metaMensual: 500000,
      onboardingCompletado: false,
    },
  });

  const vendedor1 = await prisma.usuario.create({
    data: {
      nombre: "Ana González",
      correo: "ana@vitaconstruye.com",
      passwordHash: hashVendedor1,
      rol: "VENDEDOR",
      metaMensual: 250000,
    },
  });

  const vendedor2 = await prisma.usuario.create({
    data: {
      nombre: "Carlos Mendoza",
      correo: "carlos@vitaconstruye.com",
      passwordHash: hashVendedor2,
      rol: "VENDEDOR",
      metaMensual: 250000,
    },
  });

  // Etiquetas
  const etiquetaVip = await prisma.etiqueta.create({ data: { nombre: "VIP", color: "#f59e0b" } });
  const etiquetaReferido = await prisma.etiqueta.create({ data: { nombre: "Referido", color: "#8b5cf6" } });
  const etiquetaAnticipo = await prisma.etiqueta.create({ data: { nombre: "Pagó anticipo", color: "#10b981" } });

  // Fechas de historial (últimos 6 meses)
  const hace6m = new Date(); hace6m.setMonth(hace6m.getMonth() - 6);
  const hace5m = new Date(); hace5m.setMonth(hace5m.getMonth() - 5);
  const hace4m = new Date(); hace4m.setMonth(hace4m.getMonth() - 4);
  const hace3m = new Date(); hace3m.setMonth(hace3m.getMonth() - 3);
  const hace2m = new Date(); hace2m.setMonth(hace2m.getMonth() - 2);
  const hace1m = new Date(); hace1m.setMonth(hace1m.getMonth() - 1);
  const hoy = new Date();
  const manana = new Date(); manana.setDate(manana.getDate() + 1);
  const pasadoMañana = new Date(); pasadoMañana.setDate(pasadoMañana.getDate() + 2);
  const hace3dias = new Date(); hace3dias.setDate(hace3dias.getDate() - 3);
  const hace5dias = new Date(); hace5dias.setDate(hace5dias.getDate() - 5);

  // ─── CLIENTES ───────────────────────────────────────────────────────────────

  // 1. GANADO — completado hace 5 meses
  const cliente1 = await prisma.cliente.create({
    data: {
      nombre: "Miguel Ángel Torres",
      telefono: "5521345678",
      correo: "miguel.torres@gmail.com",
      origen: "Instagram",
      etapa: "Pedido Confirmado",
      estadoCartera: "GANADO",
      temperatura: "Caliente",
      valorEstimado: 85000,
      prioridad: "Alta",
      tipoObra: "Casa",
      m2Aproximados: 120,
      productoInteres: "Vigueta y Bovedilla",
      objecionPrincipal: "Precio alto",
      notas: "Cliente satisfecho. Pagó completo. Potencial de recompra para segundo nivel.",
      proximaAccion: "Pedir referidos y recompra",
      proximaAccionFecha: new Date(hoy.getTime() + 7 * 86400000),
      ultimoContacto: hace5m,
      vendedorId: vendedor1.id,
      ganadoEn: hace5m,
      creadoEn: hace6m,
    },
  });
  await prisma.clienteEtiqueta.create({ data: { clienteId: cliente1.id, etiquetaId: etiquetaVip.id } });
  await prisma.pago.create({ data: { clienteId: cliente1.id, monto: 85000, metodo: "Transferencia", estatus: "pagado", fechaPago: hace5m, concepto: "Vigueta y Bovedilla 120m2", folio: 101 } });
  await prisma.interaccion.create({ data: { clienteId: cliente1.id, tipo: "estado", descripcion: "Marcado como GANADO 🎉 — cliente cerró por $85,000", usuarioNombre: vendedor1.nombre, fecha: hace5m } });

  // 2. PERDIDO — hace 4 meses
  const cliente2 = await prisma.cliente.create({
    data: {
      nombre: "Sofía Hernández",
      telefono: "5534567890",
      correo: "sofia.h@hotmail.com",
      origen: "Facebook",
      etapa: "Negociación",
      estadoCartera: "PERDIDO",
      temperatura: "Frio",
      valorEstimado: 45000,
      tipoObra: "Ampliación",
      m2Aproximados: 60,
      objecionPrincipal: "Ya tengo otro proveedor",
      motivoPerdida: "Se fue con la competencia",
      notas: "Perdimos por precio. El otro proveedor le dio 10% de descuento.",
      ultimoContacto: hace4m,
      vendedorId: admin.id,
      perdidoEn: hace4m,
      creadoEn: hace5m,
    },
  });
  await prisma.interaccion.create({ data: { clienteId: cliente2.id, tipo: "estado", descripcion: "Marcado como PERDIDO — motivo: Se fue con la competencia", usuarioNombre: admin.nombre, fecha: hace4m } });

  // 3. Ganado hace 3 meses
  const cliente3 = await prisma.cliente.create({
    data: {
      nombre: "Constructora Neza SA de CV",
      telefono: "5545678901",
      correo: "compras@construye-neza.com",
      empresa: "Constructora Neza",
      giroEmpresa: "Construcción",
      puestoContacto: "Director de Compras",
      origen: "Referido",
      etapa: "Pedido Confirmado",
      estadoCartera: "GANADO",
      temperatura: "Caliente",
      valorEstimado: 320000,
      tipoCliente: "Empresa",
      tipoObra: "Edificio",
      m2Aproximados: 450,
      productoInteres: "Vigueta y Bovedilla Premium",
      objecionPrincipal: "Lo voy a pensar",
      notas: "Cliente empresa. Contrato de 6 pedidos al año. Referido por Miguel Torres.",
      proximaAccion: "Renovar contrato anual",
      proximaAccionFecha: new Date(hoy.getTime() + 30 * 86400000),
      ultimoContacto: hace1m,
      vendedorId: vendedor2.id,
      ganadoEn: hace3m,
      creadoEn: hace4m,
    },
  });
  await prisma.clienteEtiqueta.create({ data: { clienteId: cliente3.id, etiquetaId: etiquetaVip.id } });
  await prisma.clienteEtiqueta.create({ data: { clienteId: cliente3.id, etiquetaId: etiquetaReferido.id } });
  await prisma.pago.create({ data: { clienteId: cliente3.id, monto: 320000, metodo: "Transferencia", estatus: "pagado", fechaPago: hace3m, concepto: "Proyecto Edificio 450m2", folio: 102 } });

  // 4. ACTIVO — Negociación 🔥
  const cliente4 = await prisma.cliente.create({
    data: {
      nombre: "Juan Pablo Jiménez",
      telefono: "5556789012",
      correo: "jpj@gmail.com",
      origen: "Landing",
      etapa: "Negociación",
      estadoCartera: "ACTIVO",
      temperatura: "Caliente",
      valorEstimado: 65000,
      tipoObra: "Tercer nivel",
      m2Aproximados: 90,
      productoInteres: "Vigueta y Bovedilla",
      objecionPrincipal: "Está caro",
      notas: "Quiere hacer tercer nivel. Duda entre nosotros y la competencia. Precio es la objeción.",
      proximaAccion: "Llamar para ofrecer pago en 3 MSI",
      proximaAccionFecha: manana,
      ultimoContacto: hoy,
      vendedorId: vendedor1.id,
      creadoEn: hace1m,
    },
  });
  await prisma.clienteEtiqueta.create({ data: { clienteId: cliente4.id, etiquetaId: etiquetaAnticipo.id } });
  await prisma.pago.create({ data: { clienteId: cliente4.id, monto: 15000, metodo: "Depósito / anticipo", estatus: "pagado", fechaPago: hace3dias, concepto: "Anticipo pedido", folio: 103 } });
  await prisma.pago.create({ data: { clienteId: cliente4.id, monto: 50000, metodo: "Meses sin intereses", estatus: "pendiente", concepto: "Saldo pendiente vigueta y bovedilla", folio: 104 } });

  // 5. ACTIVO — Cotización Enviada 🟡
  const cliente5 = await prisma.cliente.create({
    data: {
      nombre: "Mariana López Vega",
      telefono: "5567890123",
      correo: "mariana.lv@gmail.com",
      origen: "WhatsApp",
      etapa: "Cotización Enviada",
      estadoCartera: "ACTIVO",
      temperatura: "Tibio",
      valorEstimado: 38000,
      tipoObra: "Ampliación",
      m2Aproximados: 52,
      productoInteres: "Vigueta y Bovedilla",
      objecionPrincipal: "Lo voy a pensar",
      notas: "Esperando respuesta a la cotización enviada el lunes.",
      proximaAccion: "Dar seguimiento por WhatsApp",
      proximaAccionFecha: hoy,
      ultimoContacto: hace3dias,
      vendedorId: vendedor1.id,
      creadoEn: hace2m,
    },
  });

  // 6. ACTIVO — Proyecto Calificado 🔥 (próxima acción VENCIDA)
  const cliente6 = await prisma.cliente.create({
    data: {
      nombre: "Roberto Sánchez Morales",
      telefono: "5578901234",
      correo: "rsanchez@outlook.com",
      origen: "Instagram",
      utmCampaign: "instagram",
      etapa: "Proyecto Calificado",
      estadoCartera: "ACTIVO",
      temperatura: "Caliente",
      valorEstimado: 92000,
      tipoObra: "Casa",
      m2Aproximados: 140,
      productoInteres: "Vigueta y Bovedilla",
      objecionPrincipal: "Tengo que consultarlo con mi pareja/socio",
      notas: "Casa de 2 pisos. Espera respuesta del banco. Caliente pero lento.",
      proximaAccion: "Llamar para saber respuesta del banco",
      proximaAccionFecha: hace5dias, // VENCIDA
      ultimoContacto: hace5dias,
      vendedorId: vendedor2.id,
      creadoEn: hace2m,
    },
  });

  // 7. ACTIVO — Nuevo (lead de hoy, sin primer contacto — alerta de demora)
  const cliente7 = await prisma.cliente.create({
    data: {
      nombre: "Diana Reyes Castro",
      telefono: "5589012345",
      correo: "diana.rc@gmail.com",
      origen: "Landing",
      etapa: "Nuevo",
      estadoCartera: "ACTIVO",
      temperatura: "Tibio",
      valorEstimado: 0,
      proximaAccion: "Contactar en menos de 24 h",
      proximaAccionFecha: new Date(hoy.getTime() + 86400000),
      vendedorId: admin.id,
      creadoEn: hoy,
    },
  });

  // 8. ACTIVO — Seguimiento 🟡
  const cliente8 = await prisma.cliente.create({
    data: {
      nombre: "Luis Eduardo Vargas",
      telefono: "5590123456",
      correo: "luis.e.vargas@gmail.com",
      origen: "Facebook",
      utmCampaign: "facebook",
      etapa: "Seguimiento",
      estadoCartera: "ACTIVO",
      temperatura: "Tibio",
      valorEstimado: 55000,
      tipoObra: "Ampliación",
      m2Aproximados: 75,
      objecionPrincipal: "No era buen momento",
      notas: "Quiere esperar a que termine la obra de la calle. Prometió contactar en marzo.",
      proximaAccion: "Llamar para reactivar",
      proximaAccionFecha: hace3dias, // VENCIDA
      ultimoContacto: hace2m,
      vendedorId: vendedor2.id,
      creadoEn: hace3m,
    },
  });

  // 9. ACTIVO — Asesoría Técnica 🔥
  const cliente9 = await prisma.cliente.create({
    data: {
      nombre: "Patricia Flores Gutiérrez",
      telefono: "5501234567",
      correo: "pati.flores@hotmail.com",
      origen: "Referido",
      etapa: "Asesoría Técnica",
      estadoCartera: "ACTIVO",
      temperatura: "Caliente",
      valorEstimado: 110000,
      tipoObra: "Edificio",
      m2Aproximados: 160,
      productoInteres: "Vigueta y Bovedilla Premium",
      objecionPrincipal: "Precio alto",
      notas: "Referida por Constructora Neza. Requiere asesoría técnica del ingeniero esta semana.",
      proximaAccion: "Confirmar visita técnica",
      proximaAccionFecha: pasadoMañana,
      ultimoContacto: hoy,
      vendedorId: vendedor1.id,
      creadoEn: new Date(hoy.getTime() - 10 * 86400000),
    },
  });
  await prisma.clienteEtiqueta.create({ data: { clienteId: cliente9.id, etiquetaId: etiquetaReferido.id } });

  // 10. ARCHIVADO
  const cliente10 = await prisma.cliente.create({
    data: {
      nombre: "Héctor Ramírez Blanco",
      telefono: "5512345679",
      origen: "Facebook",
      etapa: "Contactado",
      estadoCartera: "ARCHIVADO",
      temperatura: "Frio",
      valorEstimado: 25000,
      objecionPrincipal: "No contestó",
      notas: "No respondió después de 3 intentos de contacto.",
      ultimoContacto: hace3m,
      vendedorId: admin.id,
      archivadoEn: hace2m,
      creadoEn: hace4m,
    },
  });

  // 11. ACTIVO — Información Completa 🟡, pago vencido
  const cliente11 = await prisma.cliente.create({
    data: {
      nombre: "Fernando Ávila Noriega",
      telefono: "5523456780",
      correo: "favila@hotmail.com",
      origen: "Agenda Ana",
      etapa: "Información Completa",
      estadoCartera: "ACTIVO",
      temperatura: "Tibio",
      valorEstimado: 72000,
      tipoObra: "Casa",
      m2Aproximados: 100,
      productoInteres: "Vigueta y Bovedilla",
      objecionPrincipal: "Tengo que consultarlo con mi pareja/socio",
      notas: "Ya tenemos toda la información. Pendiente de aprobación de su socio.",
      proximaAccion: "Enviar cotización formal",
      proximaAccionFecha: hoy,
      ultimoContacto: hace3dias,
      vendedorId: vendedor1.id,
      creadoEn: new Date(hoy.getTime() - 20 * 86400000),
    },
  });
  await prisma.pago.create({
    data: { clienteId: cliente11.id, monto: 10000, metodo: "Depósito / anticipo", estatus: "vencido", fechaVencimiento: hace5dias, concepto: "Anticipo prometido", folio: 105 }
  });

  // 12. ACTIVO — Contactado 🔵 (sin próxima acción — debe marcar alerta)
  const cliente12 = await prisma.cliente.create({
    data: {
      nombre: "Beatriz Moreno Ríos",
      telefono: "5534567891",
      correo: "bea.moreno@gmail.com",
      origen: "Landing",
      etapa: "Contactado",
      estadoCartera: "ACTIVO",
      temperatura: "Frio",
      valorEstimado: 28000,
      tipoObra: "Ampliación",
      m2Aproximados: 40,
      objecionPrincipal: "Lo voy a pensar",
      notas: "Primer contacto realizado. Mandó mensaje por la landing. Fría pero interesada.",
      // Sin próxima acción — dispara alerta
      ultimoContacto: hace2m,
      vendedorId: vendedor2.id,
      creadoEn: hace2m,
    },
  });

  // Ganado del mes pasado para historial
  const ganado1m = await prisma.cliente.create({
    data: {
      nombre: "Óscar Navarro Dávila",
      telefono: "5545678902",
      origen: "Instagram",
      utmCampaign: "instagram",
      etapa: "Pedido Confirmado",
      estadoCartera: "GANADO",
      temperatura: "Caliente",
      valorEstimado: 67000,
      tipoObra: "Casa",
      m2Aproximados: 95,
      objecionPrincipal: "Precio alto",
      vendedorId: vendedor2.id,
      ganadoEn: hace1m,
      creadoEn: new Date(hace1m.getTime() - 30 * 86400000),
    },
  });
  await prisma.pago.create({ data: { clienteId: ganado1m.id, monto: 67000, metodo: "Transferencia", estatus: "pagado", fechaPago: hace1m, concepto: "Vigueta y Bovedilla", folio: 106 } });

  // Ganado hace 2 meses
  const ganado2m = await prisma.cliente.create({
    data: {
      nombre: "Claudia Guzmán Peña",
      telefono: "5556789013",
      origen: "Referido",
      etapa: "Pedido Confirmado",
      estadoCartera: "GANADO",
      temperatura: "Caliente",
      valorEstimado: 48000,
      tipoObra: "Tercer nivel",
      vendedorId: vendedor1.id,
      ganadoEn: hace2m,
      creadoEn: new Date(hace2m.getTime() - 25 * 86400000),
    },
  });
  await prisma.pago.create({ data: { clienteId: ganado2m.id, monto: 48000, metodo: "Efectivo", estatus: "pagado", fechaPago: hace2m, concepto: "Vigueta y Bovedilla", folio: 107 } });

  // Citas
  const citaHoy = new Date(hoy); citaHoy.setHours(10, 0, 0, 0);
  const citaHoyFin = new Date(hoy); citaHoyFin.setHours(10, 45, 0, 0);
  await prisma.cita.create({ data: { clienteId: cliente4.id, vendedorId: vendedor1.id, titulo: "Asesoría - Juan Pablo Jiménez", inicio: citaHoy, fin: citaHoyFin, estatus: "programada" } });

  const citaManana = new Date(manana); citaManana.setHours(14, 0, 0, 0);
  const citaMananaFin = new Date(manana); citaMananaFin.setHours(14, 45, 0, 0);
  await prisma.cita.create({ data: { clienteId: cliente9.id, vendedorId: vendedor1.id, titulo: "Visita técnica - Patricia Flores", inicio: citaManana, fin: citaMananaFin, estatus: "programada" } });

  const citaPasado = new Date(hace3dias); citaPasado.setHours(11, 0, 0, 0);
  const citaPasadoFin = new Date(hace3dias); citaPasadoFin.setHours(11, 45, 0, 0);
  await prisma.cita.create({ data: { clienteId: cliente6.id, vendedorId: vendedor2.id, titulo: "Seguimiento - Roberto Sánchez", inicio: citaPasado, fin: citaPasadoFin, estatus: "completada" } });

  // Interacciones de historial
  await prisma.interaccion.createMany({
    data: [
      { clienteId: cliente4.id, tipo: "cita", descripcion: "Cita de asesoría agendada para hoy 10:00 am", usuarioNombre: vendedor1.nombre, fecha: hace3dias },
      { clienteId: cliente4.id, tipo: "pago", descripcion: "Anticipo recibido: $15,000 por depósito bancario", usuarioNombre: vendedor1.nombre, fecha: hace3dias },
      { clienteId: cliente4.id, tipo: "mensaje", descripcion: "WhatsApp enviado: oferta de 3 MSI para cerrar", usuarioNombre: vendedor1.nombre, fecha: hoy },
      { clienteId: cliente5.id, tipo: "mensaje", descripcion: "Cotización enviada por correo: $38,000 por 52m2", usuarioNombre: vendedor1.nombre, fecha: hace3dias },
      { clienteId: cliente6.id, tipo: "llamada", descripcion: "Llamada realizada — espera respuesta del banco", usuarioNombre: vendedor2.nombre, fecha: hace5dias },
      { clienteId: cliente9.id, tipo: "nota", descripcion: "Referida por Constructora Neza. Proyecto de edificio 4 pisos.", usuarioNombre: vendedor1.nombre, fecha: new Date(hoy.getTime() - 10 * 86400000) },
      { clienteId: cliente9.id, tipo: "etapa", descripcion: "Movido a Asesoría Técnica", usuarioNombre: vendedor1.nombre, fecha: new Date(hoy.getTime() - 5 * 86400000) },
    ],
  });

  // Plantillas de mensajes del sistema
  await prisma.plantilla.createMany({
    data: [
      { nombre: "Bienvenida inicial", tipo: "whatsapp", etapa: "Nuevo", esDefault: true, cuerpo: "Hola {nombre}, muchas gracias por contactar a Vita Construye. 👋\n\nCon gusto te apoyamos con tu proyecto.\n\nPara brindarte una recomendación y una cotización adecuada, ¿podrías compartirnos?\n\n📍 Ubicación de la obra\n📐 Metros aproximados de losa\n🏗 Tipo de proyecto (casa, ampliación, tercer nivel, edificio, etc.)\n📅 Fecha estimada de construcción\n\n¡Estamos para ayudarte!" },
      { nombre: "Seguimiento - Sin respuesta", tipo: "whatsapp", etapa: "Cotización Enviada", esDefault: true, cuerpo: "Hola {nombre} 👋 Te escribo de Vita Construye. Quería saber si pudiste revisar la cotización que te enviamos. ¿Tienes alguna duda o te gustaría ajustar algo? Estamos aquí para ayudarte." },
      { nombre: "Vencer objeción: Está caro", tipo: "whatsapp", objecion: "Está caro", esDefault: true, cuerpo: "Hola {nombre}, entiendo que el precio importa. Te cuento que manejamos opciones de pago en mensualidades sin intereses y depósito parcial para que no tengas que desembolsar todo de golpe. ¿Te interesa que te explique cómo funciona?" },
      { nombre: "Vencer objeción: Lo voy a pensar", tipo: "whatsapp", objecion: "Lo voy a pensar", esDefault: true, cuerpo: "Hola {nombre}, con gusto te doy tiempo de pensar. Solo quería comentarte que el material tiene disponibilidad limitada para esta semana. ¿Qué es lo que te genera más duda? Con gusto te resuelvo cualquier pregunta." },
      { nombre: "Cierre con urgencia", tipo: "whatsapp", etapa: "Negociación", esDefault: true, cuerpo: "Hola {nombre}, quería avisarte que tenemos stock disponible esta semana pero está bajando rápido. Si quieres asegurar tu pedido, podemos separarlo hoy con un anticipo mínimo. ¿Lo dejamos cerrado hoy?" },
      { nombre: "Pedir el sí final", tipo: "whatsapp", etapa: "Negociación", esDefault: true, cuerpo: "Hola {nombre}, ¿cómo vas con la decisión? Queremos que tu proyecto salga perfecto y estamos listos para arrancar en cuanto confirmes. ¿Tienes alguna duda de última hora? ¿Lo dejamos cerrado hoy?" },
      { nombre: "Post-venta y referidos", tipo: "whatsapp", etapa: "Pedido Confirmado", esDefault: true, cuerpo: "Hola {nombre} 🎉 Fue un placer trabajar contigo. Espero que tu proyecto vaya de maravilla. Si conoces a alguien más que necesite vigueta y bovedilla, ¡con gusto los atendemos! Muchas gracias por tu preferencia." },
      { nombre: "Confirmar cita", tipo: "whatsapp", etapa: "Contactado", esDefault: true, cuerpo: "Hola {nombre}, te confirmo tu cita con Vita Construye para mañana. Cualquier duda, escríbeme aquí. ¡Nos vemos pronto!" },
      { nombre: "Recuperar pago vencido", tipo: "whatsapp", esDefault: true, cuerpo: "Hola {nombre}, te escribo porque tenemos pendiente un pago de tu pedido. ¿Podemos coordinarlo hoy? Cualquier acuerdo de pago, con gusto lo vemos." },
    ],
  });

  console.log("✅ Seed completado exitosamente.");
  console.log("");
  console.log("═══════════════════════════════════════════");
  console.log("  CREDENCIALES PARA ENTRAR AL CRM");
  console.log("═══════════════════════════════════════════");
  console.log(`  Admin:      admin@vitaconstruye.com`);
  console.log(`  Contraseña: VitaAdmin2026!`);
  console.log(`  Vendedor 1: ana@vitaconstruye.com`);
  console.log(`  Contraseña: Vendedor123!`);
  console.log(`  Vendedor 2: carlos@vitaconstruye.com`);
  console.log(`  Contraseña: Vendedor456!`);
  console.log("═══════════════════════════════════════════");
}

main()
  .catch((e) => { console.error("Error en seed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
