import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { ToastProvider } from "@/components/ui/Toast";
import { prisma } from "@/lib/db";

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const notificaciones = await prisma.notificacion.count({
    where: { usuarioId: usuario.id, leida: false },
  });

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar rol={usuario.rol} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar usuario={usuario} notificacionesNoLeidas={notificaciones} />
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0 page-transition">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
