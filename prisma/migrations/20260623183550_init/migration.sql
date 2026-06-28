-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'VENDEDOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "foto" TEXT,
    "metaMensual" REAL NOT NULL DEFAULT 0,
    "comision" REAL,
    "onboardingCompletado" BOOLEAN NOT NULL DEFAULT false,
    "temaPreferencia" TEXT NOT NULL DEFAULT 'automatico',
    "vistaCompacta" BOOLEAN NOT NULL DEFAULT false,
    "columnasClientes" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "telefonoInternacional" TEXT,
    "correo" TEXT,
    "origen" TEXT,
    "utmCampaign" TEXT,
    "etapa" TEXT NOT NULL DEFAULT 'Nuevo',
    "estadoCartera" TEXT NOT NULL DEFAULT 'ACTIVO',
    "temperatura" TEXT NOT NULL DEFAULT 'Tibio',
    "objecionPrincipal" TEXT,
    "notas" TEXT,
    "proximaAccion" TEXT,
    "proximaAccionFecha" DATETIME,
    "valorEstimado" REAL NOT NULL DEFAULT 0,
    "probabilidadCierre" REAL NOT NULL DEFAULT 50,
    "prioridad" TEXT NOT NULL DEFAULT 'Media',
    "tipoCliente" TEXT,
    "tipoObra" TEXT,
    "m2Aproximados" REAL,
    "productoInteres" TEXT,
    "empresa" TEXT,
    "giroEmpresa" TEXT,
    "puestoContacto" TEXT,
    "rfcEmpresa" TEXT,
    "sitioWebEmpresa" TEXT,
    "direccionEmpresa" TEXT,
    "tamanoEmpresa" TEXT,
    "notasEmpresa" TEXT,
    "motivoPerdida" TEXT,
    "ultimoContacto" DATETIME,
    "vendedorId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    "eliminadoEn" DATETIME,
    "archivadoEn" DATETIME,
    "ganadoEn" DATETIME,
    "perdidoEn" DATETIME,
    "etapaAnterior" TEXT,
    "estadoAnterior" TEXT,
    CONSTRAINT "clientes_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "etiquetas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#e8965a',
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "clientes_etiquetas" (
    "clienteId" TEXT NOT NULL,
    "etiquetaId" TEXT NOT NULL,

    PRIMARY KEY ("clienteId", "etiquetaId"),
    CONSTRAINT "clientes_etiquetas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "clientes_etiquetas_etiquetaId_fkey" FOREIGN KEY ("etiquetaId") REFERENCES "etiquetas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "citas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "inicio" DATETIME NOT NULL,
    "fin" DATETIME NOT NULL,
    "googleEventId" TEXT,
    "googleMeetLink" TEXT,
    "googleCalendarId" TEXT,
    "estatus" TEXT NOT NULL DEFAULT 'programada',
    "notas" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminadoEn" DATETIME,
    CONSTRAINT "citas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "citas_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'MXN',
    "metodo" TEXT NOT NULL,
    "estatus" TEXT NOT NULL DEFAULT 'pendiente',
    "fechaPago" DATETIME,
    "fechaVencimiento" DATETIME,
    "concepto" TEXT,
    "folio" INTEGER,
    "notas" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminadoEn" DATETIME,
    CONSTRAINT "pagos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "interacciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "usuarioNombre" TEXT NOT NULL,
    "usuarioId" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editable" BOOLEAN NOT NULL DEFAULT false,
    "eliminadoEn" DATETIME,
    CONSTRAINT "interacciones_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "archivos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "etiqueta" TEXT NOT NULL DEFAULT 'Otro',
    "datos" TEXT NOT NULL,
    "esUrl" BOOLEAN NOT NULL DEFAULT false,
    "subidoPor" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminadoEn" DATETIME,
    CONSTRAINT "archivos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tareas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaVence" DATETIME NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminadoEn" DATETIME,
    CONSTRAINT "tareas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tareas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "tipo" TEXT NOT NULL DEFAULT 'info',
    "enlace" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plantillas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'whatsapp',
    "etapa" TEXT,
    "objecion" TEXT,
    "asunto" TEXT,
    "cuerpo" TEXT NOT NULL,
    "favorita" BOOLEAN NOT NULL DEFAULT false,
    "esDefault" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "favoritos" (
    "usuarioId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("usuarioId", "clienteId"),
    CONSTRAINT "favoritos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "favoritos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vistas_guardadas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "filtros" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vistas_guardadas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "configuracion" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "nombreNegocio" TEXT NOT NULL DEFAULT 'Vita Construye',
    "logo" TEXT,
    "colorMarca" TEXT NOT NULL DEFAULT '#e8965a',
    "moneda" TEXT NOT NULL DEFAULT 'MXN',
    "husoHorario" TEXT NOT NULL DEFAULT 'America/Mexico_City',
    "horarioInicio" TEXT NOT NULL DEFAULT '09:00',
    "horarioFin" TEXT NOT NULL DEFAULT '18:00',
    "duracionCita" INTEGER NOT NULL DEFAULT 45,
    "metaMensual" REAL NOT NULL DEFAULT 500000,
    "comisionGlobal" REAL NOT NULL DEFAULT 0,
    "umbralEstancamiento" INTEGER NOT NULL DEFAULT 7,
    "mensajeWhatsApp" TEXT NOT NULL DEFAULT 'Hola {nombre}, muchas gracias por contactar a Vita Construye. 👋',
    "motivosPerdida" TEXT NOT NULL DEFAULT '["Precio alto","Se fue con la competencia","No contestó","No era buen momento","No calificaba","Otro"]',
    "etapasEmbudo" TEXT NOT NULL DEFAULT '["Nuevo","Contactado","Proyecto Calificado","Asesoría Técnica","Información Completa","Cotización Enviada","Seguimiento","Negociación","Pedido Confirmado","Perdido"]',
    "metodosPago" TEXT NOT NULL DEFAULT '["Transferencia","Tarjeta","Liga de pago","Efectivo","Depósito / anticipo","Meses sin intereses"]',
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "registro_auditoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT,
    "usuarioNombre" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "recursoTipo" TEXT NOT NULL,
    "recursoId" TEXT,
    "recursoNombre" TEXT,
    "detalle" TEXT,
    "ip" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "registro_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contadores" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'folio_pago',
    "valor" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "leads_pendientes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "correo" TEXT,
    "origen" TEXT NOT NULL DEFAULT 'Landing',
    "utm" TEXT,
    "procesado" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expira" DATETIME NOT NULL,
    "ip" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "clientes_nombre_idx" ON "clientes"("nombre");

-- CreateIndex
CREATE INDEX "clientes_telefono_idx" ON "clientes"("telefono");

-- CreateIndex
CREATE INDEX "clientes_correo_idx" ON "clientes"("correo");

-- CreateIndex
CREATE INDEX "clientes_empresa_idx" ON "clientes"("empresa");

-- CreateIndex
CREATE INDEX "clientes_etapa_idx" ON "clientes"("etapa");

-- CreateIndex
CREATE INDEX "clientes_estadoCartera_idx" ON "clientes"("estadoCartera");

-- CreateIndex
CREATE INDEX "clientes_vendedorId_idx" ON "clientes"("vendedorId");

-- CreateIndex
CREATE INDEX "clientes_eliminadoEn_idx" ON "clientes"("eliminadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "etiquetas_nombre_key" ON "etiquetas"("nombre");

-- CreateIndex
CREATE INDEX "citas_clienteId_idx" ON "citas"("clienteId");

-- CreateIndex
CREATE INDEX "citas_vendedorId_idx" ON "citas"("vendedorId");

-- CreateIndex
CREATE INDEX "citas_inicio_idx" ON "citas"("inicio");

-- CreateIndex
CREATE INDEX "pagos_clienteId_idx" ON "pagos"("clienteId");

-- CreateIndex
CREATE INDEX "pagos_estatus_idx" ON "pagos"("estatus");

-- CreateIndex
CREATE INDEX "interacciones_clienteId_idx" ON "interacciones"("clienteId");

-- CreateIndex
CREATE INDEX "interacciones_fecha_idx" ON "interacciones"("fecha");

-- CreateIndex
CREATE INDEX "archivos_clienteId_idx" ON "archivos"("clienteId");

-- CreateIndex
CREATE INDEX "tareas_usuarioId_idx" ON "tareas"("usuarioId");

-- CreateIndex
CREATE INDEX "tareas_fechaVence_idx" ON "tareas"("fechaVence");

-- CreateIndex
CREATE INDEX "notificaciones_usuarioId_idx" ON "notificaciones"("usuarioId");

-- CreateIndex
CREATE INDEX "plantillas_usuarioId_idx" ON "plantillas"("usuarioId");

-- CreateIndex
CREATE INDEX "registro_auditoria_usuarioId_idx" ON "registro_auditoria"("usuarioId");

-- CreateIndex
CREATE INDEX "registro_auditoria_creadoEn_idx" ON "registro_auditoria"("creadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_token_key" ON "sesiones"("token");

-- CreateIndex
CREATE INDEX "sesiones_usuarioId_idx" ON "sesiones"("usuarioId");

-- CreateIndex
CREATE INDEX "sesiones_token_idx" ON "sesiones"("token");
