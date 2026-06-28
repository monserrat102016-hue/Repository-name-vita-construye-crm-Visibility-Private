import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

// ID del modelo de Anthropic — cámbialo en UNA SOLA constante
const MODELO_IA = "claude-haiku-4-5-20251001";

// Plantillas locales cuando no hay llave de IA (degradación elegante)
function plantillaLocal(tipo: string, cliente: Record<string, unknown>): string {
  const nombre = (cliente.nombre as string) || "el cliente";
  const etapa = (cliente.etapa as string) || "desconocida";
  const objecion = (cliente.objecionPrincipal as string) || "no especificada";
  const temp = (cliente.temperatura as string) || "Tibio";

  switch (tipo) {
    case "mensaje":
      return `Hola ${nombre},\n\nEspero que todo vaya bien. Quería dar seguimiento a tu proyecto y asegurarme de que tienes toda la información que necesitas.\n\n¿Tienes alguna duda o podemos avanzar con el pedido?\n\nQeudamos a tus órdenes,\nVita Construye`;
    case "temperatura":
      return `Temperatura actual: ${temp} — ${temp === "Caliente" ? "Prioriza a este cliente hoy. Tiene alta intención de compra." : temp === "Tibio" ? "Mantén el seguimiento constante. Aún puede cerrar." : "Está en pausa. Contacta en unas semanas para reactivar."}`;
    case "accion":
      return `Próxima acción sugerida: ${etapa === "Nuevo" ? "Contactar por WhatsApp para calificar el proyecto" : etapa === "Cotización Enviada" ? "Llamar para resolver dudas sobre la cotización" : "Dar seguimiento personalizado por WhatsApp"}. Fecha sugerida: mañana.`;
    case "resumen":
      return `Cliente: ${nombre}. Etapa: ${etapa}. Temperatura: ${temp}. Objeción principal: ${objecion}. Se recomienda seguimiento activo para avanzar en el proceso de venta.`;
    case "objecion":
      return objecion === "Está caro"
        ? `Respuesta sugerida: "Entiendo que el precio importa. Manejamos opciones de pago en mensualidades sin intereses. ¿Le explico cómo funciona?"`
        : objecion === "Lo voy a pensar"
        ? `Respuesta sugerida: "Con gusto le doy tiempo. ¿Qué le genera más duda? Con gusto lo resuelvo para que pueda tomar la mejor decisión."`
        : `Respuesta sugerida: "Entiendo su situación. ¿Qué necesitaría para avanzar? Podemos ajustar los términos para que funcione para usted."`;
    default:
      return "Función de IA no disponible. Activa el asistente de IA poniendo tu llave en las variables de entorno.";
  }
}

export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { tipo, clienteId } = await req.json();

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    include: {
      interacciones: { where: { eliminadoEn: null }, orderBy: { fecha: "desc" }, take: 5 },
    },
  });

  if (!cliente) return Response.json({ error: "Cliente no encontrado" }, { status: 404 });
  if (sesion.rol !== "ADMIN" && cliente.vendedorId !== sesion.usuarioId) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Sin llave → plantilla local
  if (!apiKey) {
    return Response.json({
      respuesta: plantillaLocal(tipo, cliente as unknown as Record<string, unknown>),
      esPlantilla: true,
    });
  }

  // Con llave → Claude API
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey });

    const contexto = `
Cliente: ${cliente.nombre}
Etapa: ${cliente.etapa}
Temperatura: ${cliente.temperatura}
Objeción principal: ${cliente.objecionPrincipal || "No registrada"}
Valor estimado: $${cliente.valorEstimado.toLocaleString("es-MX")} MXN
Última nota del historial: ${cliente.interacciones[0]?.descripcion || "Sin historial"}
Notas: ${cliente.notas || "Sin notas"}
`;

    const prompts: Record<string, string> = {
      mensaje: `Eres un vendedor experto de Vita Construye (venta de vigueta y bovedilla en Estado de México). Redacta un mensaje de WhatsApp corto, cálido y orientado a cerrar, para el siguiente cliente. El mensaje debe abordar su objeción y moverlo a la siguiente etapa. Usa el nombre del cliente. No uses emojis en exceso. Sé natural y directo.\n\n${contexto}`,
      temperatura: `Analiza este expediente de cliente y clasifica su temperatura de compra (Caliente, Tibio o Frío) con una frase de por qué. Responde en 2-3 líneas.\n\n${contexto}`,
      accion: `Sugiere la próxima acción comercial concreta para este cliente, con una fecha sugerida. Sé específico. Responde en 1-2 líneas.\n\n${contexto}`,
      resumen: `Resume en 3-5 líneas el expediente de este cliente: quién es, en qué etapa está, cuál es su objeción, y dónde quedó el último contacto.\n\n${contexto}`,
      objecion: `El cliente tiene como objeción principal: "${cliente.objecionPrincipal || 'no especificada'}". Sugiere una respuesta concreta, empática y orientada a cerrar. Incluye qué decir y el siguiente paso a dar.\n\n${contexto}`,
    };

    const msg = await anthropic.messages.create({
      model: MODELO_IA,
      max_tokens: 400,
      messages: [{ role: "user", content: prompts[tipo] || prompts.resumen }],
    });

    const texto = msg.content[0].type === "text" ? msg.content[0].text : "Sin respuesta";
    return Response.json({ respuesta: texto, esPlantilla: false });
  } catch (err) {
    console.error("Error IA:", err);
    // Degradación elegante si la API falla
    return Response.json({
      respuesta: plantillaLocal(tipo, cliente as unknown as Record<string, unknown>),
      esPlantilla: true,
      aviso: "La IA no está disponible en este momento. Usando plantilla local.",
    });
  }
}
