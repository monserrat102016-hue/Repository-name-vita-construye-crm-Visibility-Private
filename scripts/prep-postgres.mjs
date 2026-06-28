// Cambia el motor de base de datos a PostgreSQL para publicar en Vercel.
// Se ejecuta SOLO durante el build de Vercel (no afecta tu versión local).
import fs from "node:fs";
const ruta = "prisma/schema.prisma";
let s = fs.readFileSync(ruta, "utf8");
if (s.includes('provider = "sqlite"')) {
  s = s.replace('provider = "sqlite"', 'provider = "postgresql"');
  fs.writeFileSync(ruta, s);
  console.log("✅ Base de datos cambiada a PostgreSQL para producción.");
} else {
  console.log("ℹ️ El esquema ya estaba en PostgreSQL.");
}
