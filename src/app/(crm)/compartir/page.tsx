import { obtenerUsuarioActual } from "@/lib/auth";
import { redirect } from "next/navigation";
import CompartirClient from "./CompartirClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Comparte y crece" };

export default async function CompartirPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");
  return <CompartirClient />;
}
