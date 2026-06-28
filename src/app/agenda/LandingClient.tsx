"use client";
import { useState, useEffect } from "react";
import { CheckCircle, MessageCircle, Star, Award, ExternalLink, Download, Truck, ShieldCheck, Clock } from "lucide-react";
import VitaLogo from "@/components/VitaLogo";
import { WHATSAPP_NEGOCIO } from "@/lib/utils";

interface LandingClientProps {
  utm?: string;
  nombreNegocio: string;
  colorMarca: string;
}

// Sitio oficial y recursos
const SITIO_OFICIAL = "https://vitaconstruye.com/";
const CATALOGO_URL = "/catalogo/catalogo-vita-construye.pdf";

// Calificación y enlace reales de Google (Perfil de Negocio de Vita Construye)
const GOOGLE_RATING = 4.9;
const GOOGLE_TOTAL = 28;
const GOOGLE_URL = "https://www.google.com/maps/place/Vita+Construye+%22Fabricamos%22+%22Vigueta+y+Bovedilla%22./@19.6758091,-99.3761184,17z/data=!4m8!3m7!1s0x85d217f9f5b1a03d:0xbdcd2d3eb005f818!8m2!3d19.6758091!4d-99.3735435!9m1!1b1!16s%2Fg%2F11w84gxp0q";

// Reseñas REALES tomadas del perfil de Google de Vita Construye
const RESENAS = [
  { nombre: "Eduardo Ramírez", texto: "Excelente servicio, trato y atención. Me enviaron varios presupuestos, siempre con buena actitud. Entrega extraordinariamente rápida y material de excelente calidad. Altamente recomendables." },
  { nombre: "Rafael Villalón", insignia: "Local Guide", texto: "Son muy amables, resolvieron mis dudas, me apoyaron con la cotización y entregaron todo en tiempo y forma. Los precios están acorde al mercado, muy recomendable 👍" },
  { nombre: "Yoni Díaz", texto: "La atención fue muy buena, respondieron a todas mis preguntas. Compré viguetas, bovedillas de poliestireno y malla electrosoldada; la entrega fue como lo acordamos y todo llegó bien." },
  { nombre: "Roberto Anaya", texto: "Excelente servicio, te dan opciones y asesoría, entregan muy rápido y a tiempo. Ampliamente recomendables." },
  { nombre: "Emmanuel Bernal", insignia: "Local Guide", texto: "Muy formales, muy buena comunicación, siempre dispuestos a aclarar todas las dudas. ¡Puntuales! Y están actualizados en métodos de pago, lo cual nos ahorró mucho tiempo." },
  { nombre: "Omar Aguilar", texto: "Muy buena atención y muy amables. La entrega de las bovedillas y viguetas llegaron en perfectas condiciones. Los recomiendo mucho." },
];

export default function LandingClient({ utm, nombreNegocio, colorMarca }: LandingClientProps) {
  const [form, setForm] = useState({ nombre: "", telefono: "", correo: "" });
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.telefono) { setError("Por favor llena tu nombre y teléfono."); return; }
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, utm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEnviado(true);
    } catch {
      setError("Hubo un problema al enviar. Inténtalo de nuevo o escríbenos por WhatsApp.");
    } finally {
      setEnviando(false);
    }
  };

  const whatsAppMsg = encodeURIComponent(`Hola, vi su página y me gustaría más información sobre Vigueta y Bovedilla.`);
  const waUrl = `https://wa.me/${WHATSAPP_NEGOCIO}?text=${whatsAppMsg}`;

  // Abre WhatsApp y, después, manda al sitio oficial de Vita Construye
  const irWhatsApp = () => {
    window.open(waUrl, "_blank");
    setTimeout(() => { window.location.href = SITIO_OFICIAL; }, 1200);
  };

  // ─── PANTALLA DE GRACIAS: redirige al sitio oficial ───
  useEffect(() => {
    if (!enviado) return;
    const t = setTimeout(() => { window.location.href = SITIO_OFICIAL; }, 5000);
    return () => clearTimeout(t);
  }, [enviado]);

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[var(--color-brand-dark)] via-[var(--color-brand)] to-[var(--color-brand-light)]">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-2xl p-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: `${colorMarca}20` }}>
            <CheckCircle className="h-10 w-10" style={{ color: colorMarca }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Listo! Te contactamos pronto 🎉</h2>
          <p className="text-gray-600 mb-6">Recibimos tu solicitud. Alguien de {nombreNegocio} te contactará en menos de 24 horas.</p>
          <a href={SITIO_OFICIAL} className="block w-full py-3 rounded-xl text-white font-bold mb-3" style={{ background: colorMarca }}>
            Conoce más en vitaconstruye.com →
          </a>
          <button onClick={irWhatsApp} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold" style={{ background: "#25d366" }}>
            <MessageCircle className="h-5 w-5" /> ¿Eres impaciente? Escríbenos ya por WhatsApp
          </button>
          <p className="text-xs text-gray-400 mt-4">Te llevaremos a nuestro sitio oficial en unos segundos…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header navy con logo real */}
      <header className="bg-[var(--color-navy)]">
        <div className="px-4 py-3 max-w-6xl mx-auto flex items-center justify-between">
          <VitaLogo tono="claro" alto="h-9" />
          <div className="flex items-center gap-2">
            <a href={CATALOGO_URL} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white px-3 py-2">
              <Download className="h-4 w-4" /> Catálogo
            </a>
            <a href={SITIO_OFICIAL} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white rounded-lg px-4 py-2" style={{ background: colorMarca }}>
              Sitio oficial <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Banner principal: trabajador Vita Construye (imagen de marca) */}
      <img src="/img/hero.png" alt="Vita Construye — asesoría profesional en obra" className="w-full block" />

      {/* HERO naranja (protagónico) + círculo navy decorativo */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-brand-dark)] via-[var(--color-brand)] to-[var(--color-brand-light)] text-white">
        {/* Círculo navy decorativo */}
        <div className="hidden lg:block absolute -right-24 top-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full opacity-20" style={{ background: "var(--color-navy)" }} />

        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 grid lg:grid-cols-2 gap-10 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4 bg-white/20">
              <Star className="h-4 w-4 fill-white text-white" /> Especialistas en Vigueta y Bovedilla
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
              Tu proyecto de construcción en <span style={{ color: "var(--color-navy)" }}>manos expertas</span>
            </h1>
            <p className="text-lg text-white/90 mb-6">
              Vigueta y Bovedilla de calidad para casa, ampliación, tercer nivel o edificio en Estado de México. Cotización gratis, entrega rápida y asesoría personalizada.
            </p>
            <a href={GOOGLE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-white hover:underline mb-6">
              <span className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-yellow-300 text-yellow-300" />)}</span>
              {GOOGLE_RATING} · {GOOGLE_TOTAL} opiniones en Google
            </a>
            <div className="flex flex-wrap gap-3">
              <a href="#formulario" className="px-5 py-3 rounded-xl font-bold bg-white shadow-lg" style={{ color: "var(--color-navy)" }}>
                Solicitar cotización gratis →
              </a>
              <a href={CATALOGO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-white/20 hover:bg-white/30">
                <Download className="h-4 w-4" /> Descargar catálogo
              </a>
            </div>
          </div>

          {/* Formulario */}
          <div id="formulario">
            <div className="bg-white rounded-2xl shadow-2xl p-6 text-gray-900">
              <h2 className="text-xl font-bold mb-1">Solicita tu cotización gratis</h2>
              <p className="text-sm text-gray-500 mb-5">Sin compromiso. Te contactamos en menos de 24 h.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Nombre completo *</label>
                  <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Tu nombre" required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">WhatsApp *</label>
                  <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="55 1234 5678" type="tel" required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20" />
                  <p className="text-xs text-gray-400 mt-1">Te contactaremos por aquí.</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Correo (opcional)</label>
                  <input value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} placeholder="tu@correo.com" type="email"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20" />
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                <button type="submit" disabled={enviando}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-all active:scale-[0.98] disabled:opacity-70" style={{ background: colorMarca }}>
                  {enviando ? "Enviando…" : "Solicitar cotización gratis →"}
                </button>

                <div className="text-center">
                  <button type="button" onClick={irWhatsApp} className="inline-flex items-center gap-2 text-sm text-green-600 hover:underline font-medium">
                    <MessageCircle className="h-4 w-4" /> O escríbenos directo por WhatsApp
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Franja de mensaje (navy sólido) */}
      <section className="relative bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy-light)] py-14 flex items-center">
        <div className="relative max-w-6xl mx-auto px-4 w-full">
          <h2 className="text-2xl md:text-3xl font-black text-white max-w-lg">Construimos contigo, desde los cimientos hasta la losa.</h2>
          <p className="text-white/70 mt-2 max-w-md">Vigueta y Bovedilla fabricada con calidad para que tu obra avance sin retrasos.</p>
        </div>
      </section>

      {/* Propuestas de valor con íconos */}
      <section className="max-w-6xl mx-auto px-4 py-14 grid sm:grid-cols-3 gap-6">
        {[
          { icono: Clock, t: "Entrega rápida", d: "Coordinamos fecha y hora de entrega en tu obra." },
          { icono: ShieldCheck, t: "Material de calidad", d: "Vigueta y Bovedilla que cumple norma para tu seguridad." },
          { icono: Truck, t: "Cobertura amplia", d: "Servicio en todo el Estado de México y CDMX." },
        ].map((b) => {
          const Icono = b.icono;
          return (
            <div key={b.t} className="text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto sm:mx-0" style={{ background: `${colorMarca}20` }}>
                <Icono className="h-6 w-6" style={{ color: colorMarca }} />
              </div>
              <p className="text-lg font-bold text-gray-900">{b.t}</p>
              <p className="text-sm text-gray-500 mt-1">{b.d}</p>
            </div>
          );
        })}
      </section>

      {/* Reseñas reales de Google */}
      <section className="max-w-6xl mx-auto px-4 py-12 border-t border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}</span>
            <span className="text-2xl font-black text-gray-900">{GOOGLE_RATING}</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Lo que dicen nuestros clientes</h2>
          <a href={GOOGLE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:underline mt-1">
            {GOOGLE_TOTAL} opiniones verificadas en Google <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RESENAS.map((r) => (
            <div key={r.nombre} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
              <div className="flex gap-0.5 mb-2">{[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div>
              <p className="text-sm text-gray-600 flex-1 leading-relaxed">&ldquo;{r.texto}&rdquo;</p>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: colorMarca }}>
                  {r.nombre.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{r.nombre}</p>
                  <p className="text-[11px] text-gray-400">{r.insignia ? `${r.insignia} · Google` : "Cliente · Google"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final → sitio oficial + catálogo */}
      <section className="bg-gradient-to-br from-[var(--color-navy-dark)] to-[var(--color-navy)] text-white">
        <div className="max-w-6xl mx-auto px-4 py-14 text-center">
          <VitaLogo tono="claro" alto="h-12" className="mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-black mb-2">¿Listo para tu próxima losa?</h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">Conoce todo lo que Vita Construye tiene para tu obra en nuestro sitio oficial, o descarga el catálogo.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={SITIO_OFICIAL} className="px-6 py-3 rounded-xl font-bold text-white shadow-lg" style={{ background: colorMarca }}>
              Ir a vitaconstruye.com →
            </a>
            <a href={CATALOGO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-white/10 hover:bg-white/20">
              <Download className="h-4 w-4" /> Descargar catálogo PDF
            </a>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10">
            <button onClick={irWhatsApp} className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
              <MessageCircle className="h-4 w-4" /> Escríbenos por WhatsApp
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
