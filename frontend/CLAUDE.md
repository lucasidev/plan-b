# Frontend (planb)

Next.js 15 App Router + React 19.1 + Bun + TanStack Query + shadcn/ui + Tailwind 4.

Ver también [`../CLAUDE.md`](../CLAUDE.md) para contexto general y [`../docs/decisions/`](../docs/decisions/) para ADRs.

## Layout

```
frontend/
├── package.json              (bun)
├── next.config.ts
├── tsconfig.json             path alias "@/*" → "./src/*"
├── biome.json                linter + formatter (CSS desactivado por Tailwind 4)
├── components.json           shadcn config (new-york, baseColor neutral)
├── postcss.config.mjs        Tailwind 4 via PostCSS plugin
├── vitest.config.ts          happy-dom, passWithNoTests
├── Dockerfile
└── src/
    ├── app/
    │   ├── layout.tsx        root layout (metadata + Providers)
    │   ├── providers.tsx     QueryClient + ReactQueryStreamedHydration
    │   ├── globals.css       Tailwind import + @theme tokens
    │   ├── (public)/         landing, catálogo, reseñas, docentes (sin auth)
    │   ├── (auth)/           sign-in, sign-up, verify-email
    │   ├── (member)/         alumno autenticado (guard en layout)
    │   ├── (teacher)/        docente verificado (guard chequea teacherVerified)
    │   └── (staff)/          moderator, admin, university_staff
    ├── features/             flat: una carpeta por use case
    │   ├── sign-up/          (US-010-f)
    │   ├── sign-in/          (US-028-f)
    │   ├── verify-email/     (US-011-f)
    │   ├── sign-out/         (US-029-i)
    │   └── ...               write-review, browse-subjects, manage-teachers, etc.
    ├── components/
    │   ├── ui/               primitivas (Button, DisplayHeading, Lede, ...)
    │   └── layout/           AuthSplit + auth-hero (copy del split), sidebar, header, footer
    └── lib/
        ├── env.ts            zod-validated env (clientEnv + serverEnv())
        ├── session.ts        getSession() RSC helper, jose JWT verify
        ├── api-client.ts     fetch wrapper (apiFetch)
        ├── api-problem.ts    RFC 7807 ProblemDetails / ValidationProblemDetails
        ├── forward-set-cookies.ts  re-emite Set-Cookie del backend al user-agent
        ├── fonts.ts          next/font setup
        └── utils.ts          cn() helper
```

## Route groups + auth guards

Cada route group tiene su propio `layout.tsx` que hace el guard server-side usando `getSession()`:

- `(public)`: sin guard.
- `(auth)`: redirige a `/home` si YA hay sesión (evita re-login).
- `(member)`: redirige a `/sign-in` si no hay sesión o rol no es `member`.
- `(teacher)`: además chequea `session.teacherVerified`.
- `(staff)`: rol en `{moderator, admin, university_staff}`.

La autorización real se hace en el backend. El guard del frontend existe para UX y evitar requests rechazados. Ver [ADR-0019](../docs/decisions/0019-single-nextjs-app-con-route-groups.md) y [ADR-0023](../docs/decisions/0023-auth-flow-jwt-cookie-layout-guards.md).

### Rutas dentro de `(auth)`

El route group `(auth)` no aparece en la URL (Next.js convention). Las páginas viven todas top-level:

- `/sign-in` (login, US-036).
- `/sign-up` (registro, US-036).
- `/sign-up/check-inbox?email=` (pantalla post-registro "te mandamos un mail").
- `/forgot-password` + `/forgot-password/check-inbox` (flow forgot password, US-033).
- `/reset-password?token=` (pantalla del reset, US-033).
- `/verify-email?token=` (pantalla de verificación post-mail, US-011).

`sign-in` y `sign-up` montan `<AuthSplit>` con copy compartido (`components/layout/auth-hero.tsx`) más su heading propio. Cada flow es página separada con su layout: no hay tabs ni AuthView intermedio (deuda de S1 cerrada con US-036).

## Features: vertical slice por use case

**Feature = un use case = una carpeta atómica.** No "feature = módulo backend": la agrupación por módulo (identity, academic, reviews, etc.) tiene sentido en el backend porque cada módulo tiene su DbContext y schema Postgres propio, pero esas razones técnicas no aplican en frontend. Acá usamos **layout flat**: cada use case (sign-up, sign-in, verify-email, write-review, etc.) cuelga directo de `features/`.

Cada feature espeja 1:1 un use case del backend (en backend, `Planb.<Module>.Application/Features/<UseCase>/`). Estructura interna del feature:

```
features/<feature>/
├── actions.ts        Server Actions ('use server' al tope; solo async exports)
├── api.ts            fetchers contra el backend / queryOptions de TanStack Query
├── schema.ts         Zod schema (o `schemas/` carpeta si hay varios)
├── hooks/            useSuspenseQuery wrappers, useOptimistic
├── components/       componentes específicos del use case
├── types.ts          DTOs locales + estado del action (FormState, initialState)
└── index.ts          barrel export
```

**Reglas duras** (estas son las que rompí en mi primer intento; documentadas para no volver a romperlas):

- `'use server'` siempre al tope de `actions.ts`. Nunca por función suelta. Y por la regla de Next.js, esos archivos solo pueden exportar funciones async: los tipos del action (FormState, initialState) viven en `types.ts`.
- Nada de subcarpetas inventadas dentro de `features/<feature>/` (`actions/`, `state/`, `helpers/`, etc.). Si hace falta un helper que no es action ni component, evaluá si es genérico y va a `lib/`. Si es feature-specific y no es action, considera si realmente lo necesitás separado.
- Tipos cross-feature (ej. `ProblemDetails` para parsear errores RFC 7807, `ResponseCookie` parser) viven en `lib/`, no se duplican en cada feature.
- Las rutas (`src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/sign-up/page.tsx`, etc.) son thin wrappers que importan el form del feature. Cada flow auth tiene su propia ruta top-level (US-036); el backend mantiene endpoints separados (sign-in / register / verify-email) sin cambios.

Ver [ADR-0020](../docs/decisions/0020-features-alineadas-con-modulos-backend.md).

## Data fetching: patrón unificado

**Nunca elegir entre "RSC only" o "client only".** El patrón es **ambos al mismo tiempo** con TanStack Query v5:

1. **RSC prefetch** en la página:

```tsx
// app/(public)/subjects/[id]/page.tsx
export default async function SubjectPage({ params }) {
  const { id } = await params;
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(reviewQueries.forSubject(id));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReviewList subjectId={id} />
    </HydrationBoundary>
  );
}
```

2. **Client component** consume con el mismo `queryKey`:

```tsx
// features/browse-reviews/components/review-list.tsx
'use client';
export function ReviewList({ subjectId }) {
  const { data } = useSuspenseQuery(reviewQueries.forSubject(subjectId));
  // data disponible inmediatamente: cache hidratada del server
}
```

3. **`queryOptions` co-localizadas** en `features/<feature>/api.ts`:

```tsx
export const reviewQueries = {
  forSubject: (subjectId: string) => queryOptions({
    queryKey: ['reviews', 'subject', subjectId],
    queryFn: () => fetchReviewsForSubject(subjectId),
  }),
};
```

4. **`ReactQueryStreamedHydration`** en `providers.tsx` para streaming de suspense.

5. **Mutations via Server Actions = mutaciones puras** (regla dura, [ADR-0046](../docs/decisions/0046-server-actions-como-mutaciones-puras.md)). El action hace el write y devuelve `{ status }`; **NO** llama `revalidatePath`/`redirect()` adentro (eso embebe el re-render en el stream de la respuesta y cuelga intermitente en prod). El **cliente** reacciona al `status: 'success'` invalidando queries + `router.push`:
```tsx
useEffect(() => {
  if (state.status !== 'success') return;
  queryClient.invalidateQueries({ queryKey: ['reviews', 'subject', subjectId] });
  router.push('/destino'); // flight GET normal, nunca se cuelga
}, [state.status]);
```
Si alguien "arregla" un action agregándole `revalidatePath`, reintroduce el bug. Ver [ADR-0046](../docs/decisions/0046-server-actions-como-mutaciones-puras.md).

Ver [ADR-0021](../docs/decisions/0021-data-fetching-rsc-tanstack-query.md).

### Client fetcher vs server fetcher (regla dura)

Hay dos caminos para pegarle al backend y **no se cruzan**:

| | Path | Cookie | Dónde corre |
|---|---|---|---|
| **`api.ts`** (client fetcher) | relativo `/api/...` via `clientApiFetch` | la pega el browser (same-origin, Next rewrite) | **solo browser** |
| **`api.server.ts`** (server fetcher) | absoluto via `apiFetchAuthenticated` | forward de `planb_session` con `next/headers` | **solo server** (RSC prefetch / Server Actions) |

**Invariante: los `queryFn` de `api.ts` NUNCA corren server-side.** Un path relativo no tiene origin en Node, así que un `fetch('/api/...')` crudo durante SSR tira `TypeError: Failed to parse URL from /api/...` y rompe la RSC de la página. Esto pasa cuando un `useQuery`/`useSuspenseQuery` ejecuta su `queryFn` server-side bajo `ReactQueryStreamedHydration` porque su data **no** quedó prefetcheada+hidratada.

Cómo lo respetamos:

- **Todo fetcher client va por `clientApiFetch`** (`lib/api-client.ts`), nunca `fetch('/api...')` crudo. Si llega a correr server-side, **loguea** un error descriptivo que nombra el path y el fix, y deja que el fetch falle como siempre. No tira: ese rechazo server-side lo tolera el framework (React Query refetchea en el cliente vía `fetchOptimistic`), así que un `throw` lo escalaría a un error fatal de RSC en vez de arreglar nada.
- **Para leer la misma data en el server**, prefetcheá en la página con el `fetchXServer` de `api.server.ts` (seedeando el mismo `queryKey`) y envolvé en `<HydrationBoundary>`. Patrón en `app/(member)/reviews/page.tsx`.
- **Si la query vive fuera de cualquier `HydrationBoundary`** (ej. en un layout, como el badge del topbar), gateala con un flag `mounted` (`enabled: mounted`) para que solo corra en el cliente. Ver `components/layout/topbar.tsx`.

## Forms

- **Simples (1-3 fields)**: React 19 primitives. `<form action={serverAction}>` + `useActionState` + `useFormStatus` + `useOptimistic`.
- **Complejos** (4+, conditional, arrays): **TanStack Form** + Zod (shared schema entre client validation y server action). Integración shadcn via `shadcn-tanstack-form`.

Ver [ADR-0022](../docs/decisions/0022-forms-react19-primitives-tanstack-form.md).

## State

- **Server state** → TanStack Query (hidratada desde RSC).
- **URL state** → `nuqs` (type-safe, no parseo manual de `searchParams`).
- **Optimistic UI** → `useOptimistic` de React 19.
- **Ephemera UI** → `useState` / `useReducer`.
- **No global store** en MVP. No Zustand, no Jotai, salvo que aparezca caso genuino.

## Tests

Convenciones detalladas en [`docs/testing/conventions.md`](../docs/testing/conventions.md). Resumen para frontend:

- **Utils / Schemas** (vitest + jsdom): helpers de `lib/` y zod schemas. Test co-localizado al source: `foo.ts` + `foo.test.ts`.
- **Server Actions** (vitest, fetch / next/navigation mockeados): lógica de actions sin browser. Co-localizado: `actions.ts` + `actions.test.ts`.
- **Components** (vitest + `@testing-library/react` + `user-event` + `jest-dom`): formularios, hooks, componentes interactivos. Co-localizado: `<comp>.tsx` + `<comp>.test.tsx`. Setup global en `test-setup.ts` (cleanup automático tras cada test, matchers DOM-aware).
- **E2E** (Playwright + chromium): user flows reales (multi-página, redirects, banners temporales). Vive aparte en `frontend/e2e/<área>/<flow>.spec.ts`. Helpers en `frontend/e2e/helpers/` (personas, mailpit, redis).

Pirámide formal: [ADR-0036](../docs/decisions/0036-testing-pyramid-cross-stack.md). Regla dura: **subir un nivel sólo si el inferior no alcanza**. Una validación de Zod se testea con vitest; no se sube a component test ni a E2E si no hace falta.

Stack permanente aterrizó con US-T01 (vitest + Testing Library + jsdom + sample tests por capa) y US-T02 (Playwright config permanente + helpers en `e2e/helpers/{personas,mailpit,redis}.ts` + specs `e2e/auth/{forgot-password,sign-in}.spec.ts`). E2E corre en CI **en cada PR** como gate de merge (decisión 2026-05-23, documentada en el job `e2e` de `ci.yml`); localmente con `just frontend-test-e2e` (headless, rápido) o `just frontend-test-e2e-show` (browser visible + slowMo, para debuggear un spec mirándolo) cuando el dev stack está arriba.

Locators en componentes: priorizar `getByRole`, `getByLabelText`. Tests deben fallar cuando el ARIA cambia, no cuando agregamos un `data-testid` nuevo.

UX strings en español (la app es en español). Descriptores técnicos de `describe`/`it` en español también, salvo que sea más claro en inglés.

## Stack

| Categoría | Paquetes |
|---|---|
| Framework | `next@15.1+`, `react@19.1+` |
| Data fetching | `@tanstack/react-query`, `@tanstack/react-query-next-experimental` |
| Forms | `@tanstack/react-form`, `zod` |
| URL state | `nuqs` |
| UI | shadcn/ui (no package, se instalan con `bunx shadcn@latest add <x>`), `lucide-react`, `class-variance-authority`, `tailwind-merge`, `clsx` |
| Auth | `jose`, `iron-session` |
| Tests | `vitest`, `jsdom`, `@testing-library/react` + `user-event` + `dom` + `jest-dom`, `@playwright/test` (E2E) |
| Tooling | `@biomejs/biome`, `typescript`, `bun` |

## Convenciones

- **Imports con alias `@/`**. Nunca `../../../foo`.
- **Strings de UI en español rioplatense**. Error messages y logs en inglés.

### Code/UI split (regla dura, no negociable)

**El código va en inglés. Solo lo que ve el usuario va en español rioplatense.**

| En inglés (código) | En español (UI/UX) |
|---|---|
| Rutas: `/my-career`, `/reviews/write/[enrollmentId]` | Labels visibles: "Mi carrera", "Escribir reseña" |
| Carpetas de `app/` y `features/` | Texto en `<h1>`, `<p>`, `<button>`, placeholders |
| Filenames: `transcript-summary.ts`, `prerequisite-chip.tsx` | Strings hardcoded en JSX renderizado |
| Identificadores: `MyCareerTabId`, `MOCK_ENROLLMENT_CONTEXT`, `parseTab()` | Mensajes de error que ve el alumno |
| Type literals usados como código: `'prerequisites' \| 'catalog' \| 'teachers'` | Aria-labels que el screen reader le lee al alumno |
| Object keys: `{ students: '340', reviews: '1.247' }` | Email subjects, notification copy |
| Query param values (son código): `?tab=transcript`, `?tab=draft` | Toast / banner / modal messages |
| JSDoc + inline comments (`/** ... */`, `// ...`) | Test descriptions de `describe()` / `it()` (excepción documentada del frontend CLAUDE.md) |
| Error codes / log messages internos | |

**Test que tenés que poder pasar antes de mergear**: si grepeás `src` con palabras castellanas técnicas típicas (`está`, `cuando`, `función`, `también`, `cursada`, `reseña`, `materia`, `comisión`), los matches deben caer **solo** en strings de UI dentro de JSX, copy hardcoded de `data/content.ts`, labels de tabs o aria-labels. Si caen en docstrings, identificadores o type literals, lo arreglás antes de mergear.

```bash
# Quick check (corre en frontend/):
grep -rn "está\|cuando\|función\|también\|cursada\|reseña\|materia" src/features/<feature> \
  | grep -vE "(label|placeholder|aria-label|children|>\s*[A-ZÁ]|\".*[ñáéíóú])"
```

**Cómo me cagué con esto** (deuda histórica documentada para no repetir): durante S2-S5 mergué 7 USs con rutas, features, identifiers y docstrings en castellano. El PR de refactor pertinente vuelve todo a inglés y deja esta tabla como referencia.
- **Zod schemas** en `features/<feature>/schemas/`, compartidos entre client (TanStack Form) y server actions.
- **`'use client'` solo donde hace falta**. Default es Server Component.
- **`'use server'` al tope del archivo** para Server Actions (no por función suelta).
- **No imports cross-feature directos**. Si `write-review` necesita data del feature `view-subject`, consume su `api.ts` / `hooks/`, no componentes internos.

## Comandos frontend-specific

```
cd frontend
bun install
bun dev                        Next.js dev server con Turbopack
bun run build                  Production build
bun run lint                   Biome check
bun run lint:fix               Biome check --write
bunx tsc --noEmit              Typecheck
bun run test                   Vitest
bunx playwright test           E2E
bunx shadcn@latest add button  Instalar component de shadcn
```

Desde root:
```
just dev-frontend / frontend-build / frontend-lint / frontend-test
```

## Boundaries frontend

- **No** usar imports relativos largos. Siempre `@/` alias.
- **No** mezclar server state (TanStack Query) con ephemera UI (useState) en el mismo hook.
- **No** poner lógica de dominio en componentes. Va en `features/<feature>/` (hooks, actions, schemas).
- **No** tocar `globals.css` para agregar clases arbitrarias. Usar Tailwind utilities o `@theme` si es variable de diseño. Tokens documentados en [`docs/design/design-system.md`](../docs/design/design-system.md).
- **No** saltear el guard del backend confiando solo en el guard del frontend. El layout guard es UX, no seguridad.
- **No** improvisar visuales. Cada US frontend tiene su mockup como image embed en `## Refs > Mockup` (auto-generado del canvas). Si el código difiere de la imagen, fixear código.
