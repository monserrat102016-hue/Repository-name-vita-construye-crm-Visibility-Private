"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { RefreshCw } from "lucide-react";

export default function ReactivarBtn({ clienteId }: { clienteId: string }) {
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const reactivar = async () => {
    setCargando(true);
    await fetch(`/api/clientes/${clienteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "reactivar" }),
    });
    setCargando(false);
    router.refresh();
  };

  return (
    <Button
      variante="outline"
      tamaño="sm"
      cargando={cargando}
      icono={<RefreshCw className="h-3.5 w-3.5" />}
      onClick={reactivar}
    >
      Reactivar
    </Button>
  );
}
