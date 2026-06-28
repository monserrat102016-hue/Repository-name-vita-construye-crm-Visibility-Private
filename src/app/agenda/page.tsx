import { prisma } from "@/lib/db";
import LandingClient from "./LandingClient";
import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Vita Construye — Vigueta y Bovedilla",
  description: "Vigueta y Bovedilla para tu proyecto en Estado de México. Solicita tu cotización gratis.",
  openGraph: {
    title: "Vita Construye — Vigueta y Bovedilla",
    description: "Especialistas en Vigueta y Bovedilla para construcción en Estado de México. Cotización gratis.",
    type: "website",
    siteName: "Vita Construye",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Vita Construye — Vigueta y Bovedilla" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vita Construye — Vigueta y Bovedilla",
    description: "Especialistas en Vigueta y Bovedilla en Estado de México. Cotización gratis.",
    images: ["/og-image.png"],
  },
};

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ utm?: string }> }) {
  const params = await searchParams;
  const config = await prisma.configuracion.findUnique({ where: { id: "global" } });

  return (
    <LandingClient
      utm={params.utm}
      nombreNegocio={config?.nombreNegocio || "Vita Construye"}
      colorMarca={config?.colorMarca || "#e8965a"}
    />
  );
}
