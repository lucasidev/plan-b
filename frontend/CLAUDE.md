# Frontend — planb

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
    ├── features/             1:1 con módulos del backend
    │   ├── identity/
    │   ├── academic/
    │   ├── enrollments/
    │   ├── reviews/
    │   └── moderation/
    ├── components/
    │   ├── ui/               shadcn primitives
    │   └── layout/           sidebar, header, footer
    └── lib/
        ├── env.ts            zod-validated env
        ├── session.ts        getSession() RSC helper (JWT cookie)
        ├── api-client.ts     fetch wrapper
        └── utils.ts          cn() helper
```

## Route groups + auth guards

Cada route group tiene su propio `layout.tsx` que hace el guard server-side usando `getSession()`:

- `(public)`: sin guard.
- `(auth)`: redirige a `/dashboard` si YA hay sesión (evita re-login).
- `(member)`: redirige a `/sign-in` si no hay sesión o rol no es `member`.
- `(teacher)`: además chequea `session.teacherVerified`.
- `(staff)`: rol en `{moderator, admin, university_staff}`.

La autorización real se hace en el backend. El guard del frontend existe para UX y evitar requests rechazados. Ver [ADR-0019](../docs/decisions/0019-single-nextjs-app-con-route-groups.md) y [ADR-0023](../docs/decisions/0023-auth-flow-jwt-cookie-layout-guards.md).

## Features: vertical slice por dominio

Cada feature espeja 1:1 un módulo del backend. Estructura interna:

```
features/<feature>/
├── actions.ts        Server Actions ('use server')
├── api.ts            queryOptions helpers (TanStack Query) + fetch fns
├── schemas/          Zod schemas compartidos client + server actions
├── hooks/            useSuspenseQuery wrappers, useOptimistic
├── components/       componentes específicos del dominio
├── types.ts          DTOs locales derivados de API
└── index.ts          barrel export
```

Las rutas (`src/app/(member)/reviews/page.tsx`) son thin wrappers que importan del feature.

Ver [ADR-0020](../docs/decisions/0020-features-alineadas-con-modulos-backend.md).

## Data fetching — patrón unificado

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
// features/reviews/components/review-list.tsx
'use client';
export function ReviewList({ subjectId }) {
  const { data } = useSuspenseQuery(reviewQueries.forSubject(subjectId));
  // data disponible inmediatamente — cache hidratada del server
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

5. **Mutations via Server Actions**. Después del action, invalidar desde el cliente:
```tsx
await queryClient.invalidateQueries({ queryKey: ['reviews', 'subject', subjectId] });
```
O desde el action con `revalidatePath`/`revalidateTag`.

Ver [ADR-0021](../docs/decisions/0021-data-fetching-rsc-tanstack-query.md).

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

## Stack

| Categoría | Paquetes |
|---|---|
| Framework | `next@15.1+`, `react@19.1+` |
| Data fetching | `@tanstack/react-query`, `@tanstack/react-query-next-experimental` |
| Forms | `@tanstack/react-form`, `zod` |
| URL state | `nuqs` |
| UI | shadcn/ui (no package, se instalan con `bunx shadcn@latest add <x>`), `lucide-react`, `class-variance-authority`, `tailwind-merge`, `clsx` |
| Auth | `jose`, `iron-session` |
| Tests | `vitest`, `@playwright/test`, `happy-dom` |
| Tooling | `@biomejs/biome`, `typescript`, `bun` |

## Convenciones

- **Imports con alias `@/`**. Nunca `../../../foo`.
- **Strings de UI en español rioplatense**. Error messages y logs en inglés.
- **Zod schemas** en `features/<feature>/schemas/`, compartidos entre client (TanStack Form) y server actions.
- **`'use client'` solo donde hace falta**. Default es Server Component.
- **`'use server'` al tope del archivo** para Server Actions (no por función suelta).
- **No imports cross-feature directos**. Si `reviews` necesita `academic`, consume su `api.ts` / `hooks/`, no componentes internos.

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
- **No** tocar `globals.css` para agregar clases arbitrarias. Usar Tailwind utilities o `@theme` si es variable de diseño.
- **No** saltear el guard del backend confiando solo en el guard del frontend. El layout guard es UX, no seguridad.
