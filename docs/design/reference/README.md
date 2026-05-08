# Design reference (vendored mockup)

Este directorio es la **fuente de verdad visual** del proyecto. Lo que está acá no se edita: es el mockup original que define el lenguaje de diseño de plan-b (paleta, tipografía, primitivas, layouts macro). Todo lo que se construye en `frontend/` debe ser fiel a esta referencia.

Hay **dos generaciones** de mockup conviviendo en este directorio:

- **v1** (Apr 2026): `plan-b.html` + `styles.css` + `components/*.jsx`. Es el mockup que guió el trabajo de S0 y S1 (auth slice + AppShell + home placeholder).
- **v2** (May 2026): `plan-b-direcciones.html` + `canvas-mocks/*.jsx` + `canvas-tokens.css` + `design-canvas.jsx` + `tweaks-panel.jsx` + `data.jsx`. Es la iteración de claude-design del 2026-05-02 que define el rediseño completo (Auth a 4 rutas, Onboarding, Mi carrera consolidada, Planificar 2 tabs, Reseñas 3 tabs + editor, Rankings, Búsqueda global, Notifications, Cuenta split, Soporte).

**El v2 es el target a futuro**. El v1 queda como referencia histórica de lo que ya está shipped (con divergencias documentadas más abajo). Para detalles del rediseño y plan de migración, ver [ADR-0041](../../decisions/0041-rediseño-ux-post-claude-design.md).

## Archivos del v1 (mockup original)

| Archivo | Qué define |
|---|---|
| `plan-b.html` | Shell HTML del mockup v1. Carga fonts (Geist, Instrument Serif, Instrument Sans, IBM Plex Mono, IBM Plex Sans), monta el `App` React, y configura los tokens dinámicos por tweaks (densidad, tono de fondo, fuente, acento). |
| `styles.css` | **Contrato del design system**: todos los tokens (`--color-*`, `--st-*-bg/fg`, `--font-*`, `--pad-*`, `--radius-*`) y todas las clases compuestas (`.btn.accent`, `.h-display`, `.eyebrow`, `.lede`, `.card`, `.drawer`, `.cal`, `.review`, `.verified-badge`, etc.). |
| `components/ui.jsx` | Primitivas atómicas: `Logo`, `DiffDots`, `Meter`, `Stat`, `VerifiedBadge`, `Pill`, `RatingHist`. |
| `components/shell.jsx` | Sidebar agrupada por sección, topbar con breadcrumbs + search, dropdown de cuenta. |
| `components/screens.jsx` | Auth (signup/login con tabs), Onboarding 3 pasos, WriteReview drawer, Home con decision cards, lista de materias. |
| `components/details.jsx` | SubjectDetail drawer (stats + comisiones + reseñas), ProfessorDetail drawer (resumen colectivo + reseñas con respuesta del docente). |
| `components/plan.jsx` | PlanGrid (heatmap del plan de estudios por año/cuatrimestre) y PlanGraph (correlativas como SVG). |
| `components/simulator.jsx` | SimulatorView (calendar semanal + selección de materias + comparación de comisiones + insights crowd-sourced). |

## Archivos del v2 (rediseño claude-design 2026-05-02)

| Archivo | Qué define |
|---|---|
| `plan-b-direcciones.html` | Design canvas con 12 secciones organizadas: ⓪ Design System · ① Landing · ② Auth · ③ Onboarding · ④ Inicio · ⑤ Mi carrera · ⑥ Planificar · ⑦ Reseñas · ⑧ Rankings · ⑨ Búsqueda global · ⑩ Cuenta · ⑪ Soporte. |
| `design-canvas.jsx` | Componente `<DesignCanvas>` que renderiza secciones + artboards con grid + zoom + pan. Es el chrome del canvas. |
| `tweaks-panel.jsx` | Panel lateral del canvas para tunear tokens en runtime (densidad, acento, fuente). Sin equivalente en `frontend/`: es del canvas. |
| `data.jsx` | Mock data compartido entre todos los artboards (alumno demo, materias demo, etc.). |
| `canvas-tokens.css` | Tokens del shell del canvas (no del producto). Sin equivalente en `frontend/`. |
| `canvas-mocks/design-system.jsx` | Artboard con todas las primitivas + tokens visibles. |
| `canvas-mocks/landing.jsx` | Landing pública. Antes de `/auth`. |
| `canvas-mocks/auth.jsx` | 4 vistas separadas: `Signup`, `Login`, `Forgot`, `ForgotSent`. **Sin tabs**: diferencia clave con v1. |
| `canvas-mocks/onboarding.jsx` | 4 pasos: `Welcome`, `Career`, `History`, `Done`. |
| `canvas-mocks/main.jsx` | Probablemente entry point con sidebar v1 + topbar v1, pre-rediseño. |
| `canvas-mocks/v2-shell.jsx` | **Sidebar v2** (Producto / Otros + avatar menu) y **Topbar v2** (período + búsqueda + campanita + CTA). |
| `canvas-mocks/v2-screens.jsx` | Inicio v2 con pregunta dominante, Mi carrera (5 tabs base), Planificar (2 tabs base). |
| `canvas-mocks/v2-screens-2.jsx` | Reseñas (3 tabs), Rankings, Cuenta (Mi perfil + Ajustes), Soporte (Ayuda + Sobre). |
| `canvas-mocks/v2-screens-3.jsx` | Materia detalle drawer, Docente detalle drawer, Mi carrera · Historial. |
| `canvas-mocks/v2-screens-4.jsx` | Editor de reseña 6-pasos + Búsqueda global dropdown. |

## Voz

Rioplatense informal: "vos", "che", "pediste", "buscá", "andá". Errores y logs internos en inglés. Microcopy con tono cálido pero específico ("Empezá en 30 segundos", "verificado que cursó", "cursable con trabajo"). Nada de corporate ni neutralizado.

## Cómo se traslada esto a `frontend/`

1. **Tokens** del `:root` en `styles.css` van al bloque `@theme` de Tailwind 4 en `frontend/src/app/globals.css`, prefijados al estilo de Tailwind (`--color-bg`, `--color-st-approved-bg`, `--font-display`, etc.).
2. **Fonts** se cargan vía `next/font/google` en `frontend/src/lib/fonts.ts`, no via `<link>` en el HTML.
3. **Clases compuestas** se traducen en dos sabores:
   - **Brand vocabulary** (`.h-display`, `.eyebrow`, `.lede`, `.h1`, `.h2`) → primitivas React en `frontend/src/components/ui/`. Cada una usa Tailwind utilities adentro pero expone una API limpia.
   - **Layouts macro** (`.auth`, `.sidebar`, `.topbar`, `.drawer`, `.plan-grid`, `.cal`, `.review`) → componentes de layout en `frontend/src/components/layout/`, construidos sobre las primitivas de arriba.
4. **Primitivas** (`Logo`, `Pill`, `Stat`, `VerifiedBadge`, `DiffDots`, `Meter`) se rehacen 1:1 en `frontend/src/components/ui/` como React components.
5. **Vistas grandes** (Plan, Simulator, Drawers de subject/professor, WriteReview) **NO se construyen acá**. Cada una se aterriza en el slice de su feature cuando llegue su US: `features/academic/`, `features/enrollments/`, `features/reviews/`, `features/planning/`.

Ver [ADR-0020](../../decisions/0020-features-alineadas-con-modulos-backend.md) sobre features espejadas con módulos backend, y [ADR-0019](../../decisions/0019-single-nextjs-app-con-route-groups.md) sobre route groups + auth guards.

## Por qué quedan acá los `.jsx`

El mockup está construido con Babel-in-browser + JSX plano. Los archivos `.jsx` no son ejecutables por el resto del repo y no se importan desde `frontend/`. Sirven como referencia para portar comportamiento + look y como prueba de que las decisiones de UX existían antes del código.

Cuando portás algo a Next, **vení primero acá**: copiá los className, leé los strings de copy, mirá los layouts. Después lo traducís a Tailwind utilities + componentes shadcn-style. No inventes nada que no esté acá sin discutirlo primero.

## Diferencias intencionales con el mockup

El mockup es la fuente de verdad **visual**, no funcional. Hay decisiones del producto que el mockup ilustra pero que el código no replica. Lo que sigue es el catálogo de divergencias deliberadas, con la US donde se decidió. Si encontrás algo divergente que no está acá, abrí un issue antes de "alinear con el mockup".

### Auth (`screens.jsx` → AuthView, sign-up, sign-in)

- **Gate `email.endsWith('@unsta.edu.ar')` no se replica** (US-010-f). plan-b es multi-universidad por ADR-0001. Cualquier email válido se acepta. La verificación de afiliación institucional se hace después, fuera del registro.
- **Botón "Continuar con Google" no se incluye**. OAuth está fuera del MVP (ADR-0023 explícitamente).
- **Campo "name" en sign-up no se incluye** (US-010-f). El backend `RegisterUser` toma solo email + password; el display name pertenece a `StudentProfile` (F3+).
- **Checkbox "acepto términos" no se incluye**. No hay términos publicados todavía.
- **Email hint inline ("Email UNSTA verificado" / "Tiene que terminar en @unsta.edu.ar") no se incluye**. Atado al gate descartado.
- **"¿Olvidaste tu contraseña?" se incluye como link a `/forgot-password`** pero la ruta no existe todavía (404). El visual del mockup va primero, el feature de password reset (frontend + endpoints backend) llega como US separada después de sign-out (US-029-i). Cuando aterrice, el link queda funcional sin tocar el sign-in form.
- **Password floor**: el mockup muestra "Mínimo 6 caracteres". El backend exige ≥12 (RegisterUser validator). El frontend valida ≥12 para alinear con el backend.
