"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { ArchiveRestore } from "lucide-react";

export default function RestaurarBtn({ clienteId }: { clienteId: string }) {
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const restaurar = async () => {
    setCargando(true);
    await fetch(`/api/clientes/${clienteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "restaurar" }),
    });
    setCargando(false);
    router.refresh();
  };

  return (
    <Button variante="outline" tamaño="sm" cargando={cargando} icono={<ArchiveRestore className="h-3.5 w-3.5" />} onClick={restaurar}>
      Restaurar
    </Button>
  );
}
