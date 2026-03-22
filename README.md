<div align="center">

<h1>⚡ powERP</h1>
<p><em>ERP · CRM · Field Operations Platform</em></p>

---

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat-square&logo=playwright&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

</div>

---

> Sistema ERP-CRM para gestionar vitrinas de accesorios electrónicos en consignación. Digitaliza el proceso completo: rutas de campo, conteo de inventario, cobros y reportes — reemplazando un proceso 100% manual para **200+ puntos de venta**.

---

## ✦ Características

| | Característica | Descripción |
|---|---|---|
| 📱 | **App de Campo (PWA)** | Ruta del día, inicio de visita, conteo de inventario y cálculo automático de ventas. Mobile-first. |
| 🖥️ | **Panel Administrativo** | Dashboard en tiempo real, gestión de rutas, vitrinas, productos y KPIs por colaboradora. |
| 📦 | **Inventario Doble** | Inventario central + por vitrina. Movimientos inmutables con stock desnormalizado via triggers PostgreSQL. |
| 🔐 | **Auth + RLS** | 5 roles (admin, colaboradora, supervisor, analista, compras) con políticas Row Level Security por tabla. |

---

## ✦ Stack

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | Next.js 16 App Router · React 19 · TailwindCSS v4 · shadcn/ui |
| **Estado** | Zustand · TanStack React Query v5 |
| **Backend** | Supabase · PostgreSQL · Edge Functions (Deno) · Realtime websockets |
| **Auth** | Supabase Auth · JWT · Row Level Security |
| **Testing** | Playwright (e2e) |
| **Deploy** | Vercel · Supabase Cloud |

---

## ✦ Instalación local

### Prerequisitos

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Docker (para Supabase local)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/scldrn/powERP.git
cd powERP

# 2. Instalar dependencias
cd erp-vitrinas
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# 4. Iniciar Supabase local
supabase start
supabase db reset   # Aplica todas las migraciones

# 5. Iniciar el servidor de desarrollo
npm run dev
```

La app estará disponible en `http://localhost:3000`.

| Servicio | URL |
|----------|-----|
| App | `http://localhost:3000` |
| Supabase Studio | `http://localhost:54323` |
| Supabase API | `http://localhost:54321` |

### Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
STORAGE_BUCKET_FOTOS=visitas-fotos
```

---

## ✦ Estructura del proyecto

```
powERP/
├── erp-vitrinas/              # Next.js app
│   ├── app/
│   │   ├── (admin)/admin/     # Panel administrativo → /admin/*
│   │   ├── (campo)/campo/     # App de campo (móvil) → /campo/*
│   │   └── login/             # Página de login pública
│   ├── components/
│   │   ├── ui/                # Componentes base (shadcn/ui)
│   │   ├── admin/             # Componentes del panel admin
│   │   └── campo/             # Componentes de la app de campo
│   ├── lib/
│   │   ├── supabase/          # Clientes Supabase + tipos generados
│   │   ├── hooks/             # Custom hooks (toda la lógica de datos)
│   │   └── validations/       # Schemas Zod
│   ├── supabase/
│   │   ├── migrations/        # Migraciones SQL versionadas
│   │   └── functions/         # Edge Functions (Deno)
│   └── tests/                 # Tests Playwright e2e
└── docs/                      # Documentación y planes de sprint
```

---

## ✦ Contribuir

1. Fork del repositorio
2. Crear rama: `git checkout -b feature/mi-mejora`
3. Commit con convención semántica: `feat:`, `fix:`, `chore:`, `docs:`
4. Push y abrir Pull Request hacia `main`

---

## ✦ Licencia

Distribuido bajo licencia [MIT](LICENSE).
