# Design reference (vendored mockup)

Este directorio es la **fuente de verdad visual** del proyecto. Lo que está acá no se edita: es el mockup original que define el lenguaje de diseño de plan-b (paleta, tipografía, primitivas, layouts macro). Todo lo que se construye en `frontend/` debe ser fiel a esta referencia.

## Archivos

| Archivo | Qué define |
|---|---|
| `plan-b.html` | Shell HTML del mockup. Carga fonts (Geist, Instrument Serif, Instrument Sans, IBM Plex Mono, IBM Plex Sans), monta el `App` React, y configura los tokens dinámicos por tweaks (densidad, tono de fondo, fuente, acento). |
| `styles.css` | **Contrato del design system**: todos los tokens (`--color-*`, `--st-*-bg/fg`, `--font-*`, `--pad-*`, `--radius-*`) y todas las clases compuestas (`.btn.accent`, `.h-display`, `.eyebrow`, `.lede`, `.card`, `.drawer`, `.cal`, `.review`, `.verified-badge`, etc.). |
| `components/ui.jsx` | Primitivas atómicas: `Logo`, `DiffDots`, `Meter`, `Stat`, `VerifiedBadge`, `Pill`, `RatingHist`. |
| `components/shell.jsx` | Sidebar agrupada por sección, topbar con breadcrumbs + search, dropdown de cuenta. |
| `components/screens.jsx` | Auth (signup/login con tabs), Onboarding 3 pasos, WriteReview drawer, Home con decision cards, lista de materias. |
| `components/details.jsx` | SubjectDetail drawer (stats + comisiones + reseñas), ProfessorDetail drawer (resumen colectivo + reseñas con respuesta del docente). |
| `components/plan.jsx` | PlanGrid (heatmap del plan de estudios por año/cuatrimestre) y PlanGraph (correlativas como SVG). |
| `components/simulator.jsx` | SimulatorView (calendar semanal + selección de materias + comparación de comisiones + insights crowd-sourced). |

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
