# Vita Construye CRM — Notas del Proyecto

## ¿Cómo arrancar el proyecto en tu computadora?

### Primera vez (instalar todo)
```bash
cd vita-construye-crm
npm install
npm run seed
npm run dev
```
Abre http://localhost:3000 en tu navegador.

### Entrar al sistema
| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin@vitaconstruye.com | VitaAdmin2026! | Administrador |
| ana@vitaconstruye.com | Vendedor123! | Vendedor |
| carlos@vitaconstruye.com | Vendedor456! | Vendedor |

---

## Variables de entorno

Copia `.env.example` como `.env` y llena los valores:

```
DATABASE_URL="file:./dev.db"          ← Para desarrollo local (ya funciona)
AUTH_SECRET="cambia-esto"             ← Cámbialo por un texto largo y secreto
ANTHROPIC_API_KEY=""                  ← Opcional: para el asistente IA
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Cómo subir a Vercel (producción)

### 1. Crear base de datos Neon (gratis)
1. Ve a https://neon.tech y crea una cuenta gratuita
2. Crea un proyecto llamado "vita-construye"
3. Copia la URL de conexión (algo como `postgresql://...@ep-xxxx.neon.tech/neondb?sslmode=require`)

### 2. Subir a Vercel
1. Ve a https://vercel.com y crea cuenta gratuita con GitHub
2. Sube el proyecto a GitHub primero
3. Importa el proyecto en Vercel
4. En las Variables de entorno de Vercel agrega:
   - `DATABASE_URL` = la URL de Neon
   - `AUTH_SECRET` = un texto largo secreto (puedes usar https://generate-secret.now.sh/32)
   - `ANTHROPIC_API_KEY` = tu key de Claude (opcional)
   - `NEXT_PUBLIC_APP_URL` = https://tu-dominio.vercel.app

### 3. Migrar la base de datos en Neon
En la terminal, con la URL de Neon en `.env`:
```bash
npx prisma migrate deploy
npm run seed
```

---

## Tecnologías usadas

| Para qué | Qué usamos |
|---------|-----------|
| Frontend | Next.js 16 + React |
| Base de datos | SQLite (local) / PostgreSQL Neon (producción) |
| ORM | Prisma 7 |
| Estilos | Tailwind CSS v4 |
| Autenticación | JWT con jose (cookies httpOnly) |
| IA | Claude API de Anthropic |
| Íconos | Lucide React |
| Gráficas | Recharts |
| Drag & drop | dnd-kit |
| Animaciones | Framer Motion |
| Hosting | Vercel (gratis) |

---

## Estructura de carpetas principales

```
vita-construye-crm/
├── src/
│   ├── app/
│   │   ├── (auth)/login/     ← Página de login
│   │   ├── (crm)/            ← Todas las páginas del CRM
│   │   │   ├── dashboard/    ← Dashboard con KPIs
│   │   │   ├── clientes/     ← Lista y expedientes de clientes
│   │   │   ├── embudo/       ← Kanban drag-and-drop
│   │   │   ├── seguimiento/  ← "Hoy te toca"
│   │   │   ├── pagos/        ← Registro de pagos
│   │   │   ├── equipo/       ← Ranking del equipo
│   │   │   └── admin/        ← Panel de administración
│   │   ├── agenda/           ← Landing pública (captura de leads)
│   │   └── api/              ← API Routes (servidor)
│   ├── components/
│   │   ├── ui/               ← Componentes reutilizables
│   │   └── layout/           ← Sidebar, TopBar, BottomNav
│   └── lib/
│       ├── auth.ts           ← Sesiones JWT
│       ├── db.ts             ← Conexión a la base de datos
│       └── utils.ts          ← Funciones de utilidad
├── prisma/
│   ├── schema.prisma         ← Estructura de la base de datos
│   └── seed.ts               ← Datos de ejemplo
└── .env                      ← Variables secretas (NO subir a GitHub)
```

---

## Funciones del CRM

1. **Dashboard** — KPIs, meta mensual, gráfica 6 meses, alertas de leads fríos
2. **Clientes** — Lista con búsqueda, filtros, temperatura, acciones vencidas
3. **Expediente de cliente** — Historial, pagos, archivos, asistente IA
4. **Embudo Kanban** — Drag-and-drop entre etapas
5. **Hoy te toca** — Acciones vencidas y agenda del día
6. **Ganados / Perdidos / Archivados** — Historial y reactivación
7. **Pagos** — Registro con folio automático
8. **Equipo** — Ranking de vendedores (solo admin)
9. **Compartir** — Links con UTM por canal + QR
10. **Landing pública** — Captura leads que entran al CRM automáticamente
11. **Asistente IA** — 5 funciones (mensaje, temperatura, acción, resumen, objeción)
12. **Admin** — Usuarios + bitácora de actividad

---

## Notas técnicas importantes

- **Contraseñas**: Se guardan con bcrypt (no se pueden leer)
- **Sesiones**: Duran 7 días, se guardan en cookie httpOnly
- **Soft delete**: Los clientes eliminados no se borran realmente (quedan con `eliminadoEn`)
- **Auditoría**: Todas las acciones importantes quedan registradas
- **IA**: Si no tienes `ANTHROPIC_API_KEY`, funciona con plantillas locales
- **Base de datos**: SQLite para desarrollo, PostgreSQL (Neon) para producción
