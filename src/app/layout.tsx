import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = { themeColor: "#e8965a" };

export const metadata: Metadata = {
  title: { default: "Vita Construye CRM", template: "%s · Vita Construye" },
  description: "Sistema de gestión de clientes para Vita Construye — Vigueta y Bovedilla",
  openGraph: {
    title: "Vita Construye — Agenda tu cita",
    description: "Vigueta y Bovedilla para tu proyecto en Estado de México. Cotización gratis.",
    type: "website",
    locale: "es_MX",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Anti-parpadeo de tema: aplica clase antes de pintar */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const pref = localStorage.getItem('vita_tema') || 'automatico';
                if (pref === 'oscuro' || (pref === 'automatico' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
        {children}
      </body>
    </html>
  );
}
