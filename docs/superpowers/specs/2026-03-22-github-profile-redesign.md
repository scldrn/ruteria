# GitHub Profile & powERP README — Diseño

**Fecha:** 2026-03-22
**Autor:** Samuel Calderón (`scldrn`)
**Estado:** Aprobado por el usuario

---

## Objetivo

Hacer el perfil de GitHub y el repositorio `powERP` visualmente atractivos y profesionales para recruiters y otros desarrolladores. Actualmente ninguno tiene README, descripción, ni topics.

## Entregables

### 1. Perfil de GitHub — `scldrn/scldrn`

Crear el repositorio especial `scldrn/scldrn` con un `README.md` que se muestre en la página principal de GitHub del usuario.

**Estilo:** Dark Tech — fondo `#0d1117`, acentos azul `#58a6ff`, monospace.
**Audiencia primaria:** Recruiters.
**Layout:** Terminal interactivo simulado con comandos y respuestas.

**Estructura del README:**

```
[Terminal window]
❯ whoami           → nombre, rol, ubicación, "open to work"
❯ cat about.txt    → 3 líneas de descripción personal
❯ skills --verbose → badges de tecnologías con shields.io
❯ ls projects/     → lista de repos con descripción corta
❯ cat contact.md   → email, Twitter/X
❯ [cursor parpadeante simulado]

[GitHub Stats Cards — fila de 2-3 tarjetas dinámicas]
- github-readme-stats: stats generales (commits, PRs, stars)
- github-readme-stats: top languages
- shields.io badge "Open to work" verde
```

**Tecnologías de badges:**
- TypeScript, Next.js, React, Supabase, PostgreSQL, TailwindCSS, Zustand, Playwright
- Fuente: shields.io con estilo `flat-square` y colores alineados al tema dark

**GitHub Stats:**
- API: `github-readme-stats.vercel.app` (Anuradhak27)
- Tema: `github_dark` o `tokyonight`
- Cards: stats + top-langs

---

### 2. README del repo `powERP`

Crear `README.md` en la raíz del repo `erp-vitrinas/` (o raíz del monorepo) con la siguiente estructura.

**Estilo:** Dark Tech — mismos colores que el perfil.

**Secciones:**

#### Header / Banner
- Título `⚡ powERP` en grande, monospace bold
- Subtítulo: `ERP · CRM · Field Operations Platform`
- Línea decorativa gradiente `transparent → #58a6ff → #d2a8ff → transparent`
- Fila de badges shields.io: Next.js, TypeScript, React, Supabase, TailwindCSS, PostgreSQL, MIT, PRs Welcome

#### Descripción (bloque destacado)
Párrafo con borde izquierdo azul:
> Sistema ERP-CRM para gestionar vitrinas de accesorios electrónicos en consignación. Digitaliza el proceso completo: rutas de campo, conteo de inventario, cobros y reportes — reemplazando un proceso 100% manual para 200+ puntos de venta.

#### Características (grid 2×2)
| Icono | Título | Descripción |
|-------|--------|-------------|
| 📱 | App de Campo (PWA) | Ruta del día, inicio de visita, conteo de inventario y cálculo automático de ventas. Mobile-first. |
| 🖥️ | Panel Administrativo | Dashboard en tiempo real, gestión de rutas, vitrinas, productos y KPIs. |
| 📦 | Inventario Doble | Inventario central + por vitrina. Movimientos inmutables, stock desnormalizado por triggers. |
| 🔐 | Auth + RLS | 5 roles (admin, colaboradora, supervisor, analista, compras) con RLS por tabla. |

#### Stack técnico
Tabla con categorías: Frontend, Estado, Backend, Testing, Deploy.

#### Instalación local
```bash
git clone + cd + npm install + supabase start + supabase db reset + npm run dev
```
Con variables de entorno documentadas.

#### Estructura del proyecto
Árbol de directorios con descripción de carpetas principales.

#### Contribuir
Guía breve: fork → feature branch → PR → revisión.

#### Licencia
MIT

---

### 3. Configuración del repo `powERP` en GitHub

- **Descripción:** `ERP-CRM para gestionar vitrinas de accesorios electrónicos en 200+ puntos de venta — Next.js · Supabase · TypeScript`
- **Topics:** `erp`, `crm`, `nextjs`, `supabase`, `typescript`, `react`, `postgresql`, `field-operations`
- **Licencia:** Añadir MIT license
- **Homepage:** (dejar vacío por ahora, se añade cuando haya deploy)

---

## Restricciones técnicas

- Los READMEs usan markdown estándar de GitHub (GFM) — sin HTML complejo salvo lo que GitHub renderiza
- Las tarjetas de GitHub Stats son imágenes externas — funcionan si el repo es público
- El cursor parpadeante del terminal **no** es posible en markdown puro — se simula visualmente con formato de texto
- Las tablas de features en markdown no tienen estilos de color — se usan emojis para compensar

## Archivos a crear / modificar

| Archivo | Acción |
|---------|--------|
| `README.md` (raíz del monorepo) | Crear — README de powERP |
| Repo nuevo `scldrn/scldrn` en GitHub | Crear via `gh repo create` |
| `scldrn/scldrn/README.md` | Crear y pushear |
| Descripción + topics de `powERP` | Actualizar via `gh repo edit` |
