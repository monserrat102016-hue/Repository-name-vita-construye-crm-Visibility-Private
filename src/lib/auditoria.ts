import { prisma } from "./db";

interface RegistrarAuditoriaParams {
  usuarioId?: string;
  usuarioNombre: string;
  accion: string;
  recursoTipo: string;
  recursoId?: string;
  recursoNombre?: string;
  detalle?: string;
  ip?: string;
}

export async function registrarAuditoria(params: RegistrarAuditoriaParams) {
  try {
    await prisma.registroAuditoria.create({ data: params });
  } catch {
    // No rompe el flujo si la bitácora falla
  }
}
