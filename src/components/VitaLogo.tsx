/**
 * Logo oficial de Vita Construye (imágenes reales con flecha en la "I" y triángulo en la "A").
 *  <VitaLogo tono="claro" />  → letras blancas, para fondos oscuros/navy.
 *  <VitaLogo tono="oscuro" /> → letras navy, para fondos claros/blancos.
 *  <VitaMark /> → solo el símbolo (V + triángulo), para íconos chiquitos (menú contraído).
 */

export function VitaMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 48" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 8 L13 8 L20 30 L27 8 L36 8 L24 42 L16 42 Z" fill="var(--color-brand)" />
      <path d="M44 14 L53 38 L35 38 Z" fill="var(--color-brand)" />
    </svg>
  );
}

export default function VitaLogo({
  tono = "claro",
  alto = "h-9",
  className = "",
}: {
  tono?: "claro" | "oscuro";
  alto?: string;
  className?: string;
}) {
  const src = tono === "claro" ? "/img/logo-blanco.png" : "/img/logo-navy.png";
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Vita Construye" className={`${alto} w-auto block ${className}`} />;
}
