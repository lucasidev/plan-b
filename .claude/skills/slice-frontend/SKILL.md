---
name: slice-frontend
description: Scaffoldea un feature slice nuevo en el frontend de planb (Next.js 15 App Router: un feature flat por caso de uso con api/actions/schema/types/components/index). Usalo cuando haya que agregar una pantalla o interacción nueva que consume el backend (un form que envía, un listado que fetchea, una mutación), aunque no se diga "feature slice". Las server actions que mutan son puras (ADR-0046). La UI se arma desde el mockup del canvas, no inventada.
---

Scaffoldeás un feature frontend siguiendo el flat slice por caso de uso. El patrón completo vive en [`frontend/CLAUDE.md`](../../../frontend/CLAUDE.md); este skill es el procedimiento + los ejemplos canónicos a copiar. No reinventes de memoria: copiá la forma de un feature real.

## Estructura flat (un feature = un folder)

`frontend/src/features/<nombre>/`:

- **`api.server.ts`**: fetchers server-only para RSC prefetch. Si el feature es solo un form cliente que dispara una mutación, en cambio lleva **`api.ts`** con un client fetcher (`apiFetch`). Ejemplo simple y completo de la estructura: `frontend/src/features/sign-in/`.
- **`actions.ts`**: Server Actions con `'use server'` al tope. **PURAS** si mutan (ADR-0046, ver abajo).
- **`schema.ts`**: schemas Zod para validar inputs.
- **`types.ts`**: tipos del feature (form state, payloads, DTOs de respuesta).
- **`components/`**: los componentes (client o server según necesiten interactividad).
- **`index.ts`**: barrel que re-exporta lo público del feature.
- **tests**: `actions.test.ts`, `schema.test.ts` (el action se testea como función pura).

## Server actions puras (ADR-0046, no negociable)

Un `revalidatePath`/`redirect()` adentro de un action que muta causó un cuelgue intermitente en prod (falla de ~12% a 81% según la variante). La regla:

- El action **hace el write y devuelve `{ status: 'success' | 'error' | 'idle', ... }`**. NO llama `revalidatePath` ni `redirect()` adentro.
- El **cliente** maneja las consecuencias al ver `status: 'success'`: invalida las queries de TanStack afectadas y navega con `router.push`.

Ejemplo canónico que el ADR bendice: `frontend/src/features/write-review/actions.ts` (el action puro) + `write-review/components/review-editor.tsx` (el `useEffect` que reacciona al success). Copiá ese patrón, no inventes uno.

## Reglas de forma

- **Imports con `@/`** (alias absoluto), no relativos largos.
- **Data fetching**: RSC prefetch + `HydrationBoundary`, consumo con TanStack Query (ADR-0021). No fetchees en client component lo que se puede prefetchear en el server.
- **UI en español rioplatense**, desde el mockup del canvas (`docs/design/design-system.md` + los screenshots). El diseño va primero: si falta backend, se mantiene el visual con stub + TODO, no se vacía la vista.
- **NUNCA em-dashes** (U+2014): dos puntos, comas, paréntesis.

## Al terminar

- Verificá con `bun run lint` + `bunx tsc --noEmit` (o delegá al subagente `test-runner`). Si tocaste rutas reales, verificá el flujo end-to-end antes de pedir OK (spec headless o recorrido en browser); la suite E2E corre en CI en cada PR y gatea el merge.
- No commitees vos: el commit lo hace el flujo de `ship`.
