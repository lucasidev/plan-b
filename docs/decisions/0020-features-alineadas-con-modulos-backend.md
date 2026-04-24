# ADR-0020: Features del frontend alineadas 1:1 con módulos del backend

- **Estado**: aceptado
- **Fecha**: 2026-04-23

## Contexto

Next.js 15 App Router organiza **rutas** con file-based routing. Pero las rutas solo describen URLs, no la lógica de negocio. La lógica (Server Actions, hooks, schemas de validación, componentes específicos de un dominio) necesita su propio lugar.

Tres patrones comunes de organización del código de features:

1. **Por tipo técnico**: `src/hooks/`, `src/components/`, `src/lib/` a raíz. Todo mezclado por tipo, no por dominio.
2. **Por ruta**: todo lo que concierne a `/reviews/*` vive junto a la ruta, dentro de `app/`.
3. **Por feature alineada a bounded contexts del backend**: `src/features/<bounded-context>/`.

## Decisión

**Opción 3**: features alineadas 1:1 con los módulos del backend definidos en ADR-0014.

```
src/features/
├── identity/       espeja modules/identity/       (auth, profiles)
├── academic/       espeja modules/academic/       (catalog browsing)
├── enrollments/    espeja modules/enrollments/    (historial, simulator)
├── reviews/        espeja modules/reviews/        (publish, read, respond)
└── moderation/     espeja modules/moderation/     (queue, resolve, audit)
```

Cada feature interna:

```
src/features/reviews/
├── actions.ts      Server Actions (publish, edit, delete, respond)
├── api.ts          queryOptions de TanStack Query, funciones fetch del backend
├── schemas/        Zod schemas compartidos entre cliente y Server Actions
├── hooks/          useSuspenseQuery wrappers, useOptimistic, client-only helpers
├── components/     ReviewCard, ReviewForm, ReviewList, específicos de este feature
├── types.ts        DTOs locales derivados de API + tipos de dominio
└── index.ts        barrel export
```

Las rutas (`src/app/(member)/reviews/page.tsx`) importan de `features/reviews` y son thin wrappers: leen params, llaman al feature, renderizan.

## Alternativas consideradas

### A. Por tipo técnico (flat)

Patrón "clásico" React pre-2020: `hooks/useReviews.ts`, `components/ReviewCard.tsx`, `lib/api.ts` todos a raíz.

Descartada porque:

- No escala. Con 50+ componentes, el directorio `components/` se vuelve inmanejable.
- No refleja el dominio. Alguien nuevo al proyecto no tiene pista de que los reviews son un bounded context.
- Cambios de dominio tocan archivos distribuidos por tipo — refactoring pesado.

### B. Por ruta (todo en `app/`)

Colocar `actions.ts`, `components/`, `schemas/` dentro de `app/(member)/reviews/`. Next.js soporta esto con route segments.

Descartada porque:

- Atado al shape de las rutas. Si una feature tiene múltiples rutas (reviews se renderizan en página de materia, página de docente, dashboard del alumno), hay que duplicar o cross-referenciar.
- Las Server Actions en `app/` tienen que ser accesibles desde cualquier ruta, no solo la que las define. Ponerlas en `features/` evita confusión.
- Rutas son un concern de UI (URL → página). Features son concern de dominio (qué hace el sistema). Mezclarlos acopla cosas que deberían variar independientemente.

## Consecuencias

**Positivas:**

- Mental model simétrico: "estoy trabajando en Reviews" significa `modules/reviews/` en backend y `src/features/reviews/` en frontend.
- Cuando se agrega un feature al backend, el lugar donde va en frontend es obvio.
- Componentes específicos de un dominio viven junto a su feature, no desparramados en `components/`.
- `components/` a raíz queda solo para primitives realmente cross-feature (shadcn/ui, layout compartido, iconos).

**Negativas:**

- Si frontend y backend divergen en sus bounded contexts (ej. una feature cliente que el backend no refleja, como analytics del cliente-side), hay que crear features frontend que no tienen gemelas backend. Posible pero rompe el 1:1.
- Algunos componentes no son fáciles de asignar a un feature. Ej: un `DashboardCard` genérico. Va a `components/ui/` o `components/dashboard/` (feature común), no a `features/reviews/`.

**Regla pragmática:**

- Si un componente/hook/schema se usa solo dentro de un dominio: va al `features/<domain>/`.
- Si es transversal (ui primitives, layout, utilities de formato): va a `components/` o `lib/` a raíz.

**Cross-feature communication:**

- Si `features/reviews/` necesita datos de `features/academic/` (ej. mostrar el nombre de la materia en una reseña), **no** importa internals de academic. Usa el mismo patrón de backend: feature academic expone hooks/api que reviews consume.
- Evitar dependencias circulares entre features.

**Cuándo revisitar:**

- Si aparece una feature puramente de frontend (ej. editor visual, tema UI) que no espeja ningún módulo de backend, agregar como feature propia no alineada es aceptable.
