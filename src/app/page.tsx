import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";

export default async function HomePage() {
  const sesion = await obtenerSesion();
  if (sesion) redirect("/dashboard");
  redirect("/login");
}
