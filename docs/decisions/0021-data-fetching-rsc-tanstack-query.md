# ADR-0021: Data fetching — RSC prefetch + TanStack Query hydration

- **Estado**: aceptado
- **Fecha**: 2026-04-23

## Contexto

Next.js 15 App Router + React 19.1 + TanStack Query v5 ofrecen patrones que en versiones anteriores parecían mutuamente exclusivos:

- **RSC + Server Actions**: data fetching server-side, sin cliente. Bueno para SEO y first paint; limitado para interactividad rica.
- **Client-side con TanStack Query**: caching, stale-while-revalidate, optimistic updates, polling. Bueno para UIs ricas; sacrifica SEO y first paint.

En 2023-2024 la elección era binaria. En 2026, TanStack Query v5 documenta oficialmente el patrón **unificado**: RSC prefetchea la data en la cache de TanStack Query, la serializa vía `HydrationBoundary`, y los client components la consumen con `useSuspenseQuery` sobre el mismo `queryKey`. La cache está disponible inmediatamente.

## Decisión

**Patrón unificado**. Un solo enfoque para data fetching que cubre ambos extremos:

1. **Server Component de la ruta** prefetchea los datos iniciales:

```tsx
// app/(public)/subjects/[id]/page.tsx (RSC)
export default async function SubjectPage({ params }) {
  const { id } = await params
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery(subjectQueries.byId(id))
  await queryClient.prefetchQuery(reviewQueries.forSubject(id))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SubjectDetail id={id} />
      <ReviewList subjectId={id} />
    </HydrationBoundary>
  )
}
```

2. **Client Components consumen con `useSuspenseQuery`** usando el mismo `queryKey`:

```tsx
// features/reviews/components/review-list.tsx
'use client'
export function ReviewList({ subjectId }) {
  const { data } = useSuspenseQuery(reviewQueries.forSubject(subjectId))
  // data está disponible inmediatamente — hidratada desde el server
}
```

3. **`queryOptions` helpers co-localizados en `api.ts`** del feature:

```tsx
// features/reviews/api.ts
export const reviewQueries = {
  forSubject: (subjectId: string) => queryOptions({
    queryKey: ['reviews', 'subject', subjectId],
    queryFn: () => fetchReviewsForSubject(subjectId),
  }),
  forTeacher: (teacherId: string) => queryOptions({ ... }),
}
```

4. **`ReactQueryStreamedHydration` en providers** para que las queries que suspenden hagan streaming server-side:

```tsx
// app/providers.tsx (client boundary)
'use client'
export function Providers({ children }) {
  const queryClient = getQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryStreamedHydration>
        {children}
      </ReactQueryStreamedHydration>
    </QueryClientProvider>
  )
}
```

5. **Mutations via Server Actions invalidan cache cliente**:

```tsx
// features/reviews/actions.ts
'use server'
export async function publishReview(input) {
  await api.reviews.publish(input)
  revalidatePath('/subjects/' + input.subjectId)
  // alternativamente desde el cliente después del action:
  // queryClient.invalidateQueries({ queryKey: ['reviews', 'subject', subjectId] })
}
```

## Alternativas consideradas

### A. RSC + Server Actions puros (sin TanStack Query)

Todo server-side. Cada interacción = round-trip al servidor, cada render = re-fetch. Simple, pero las UIs interactivas (simulator, dashboard) se vuelven tortuosas.

Descartada porque el simulator específicamente necesita estado cliente rápido — ajustar selección de materias y ver métricas debe ser instantáneo, no con round-trip.

### B. Client-side exclusivo con TanStack Query

Sin RSC prefetch. Todas las páginas renderizan el shell, luego el cliente fetchea. Descartada por SEO (las páginas públicas de materia y docente necesitan SSR) y por first paint (contenido aparece tarde).

### C. Dos patrones paralelos ("RSC para páginas públicas, TanStack Query para admin")

Parece razonable pero introduce inconsistencia: mismo feature, distinto patrón según quién lo consume. Descartada en favor del unificado.

## Consecuencias

**Positivas:**

- Un solo mental model para data fetching en todo el frontend.
- SEO funciona (RSC genera HTML con data).
- First paint rápido (data server-side).
- Interactividad rica (cliente con cache, optimistic updates, polling, stale-while-revalidate).
- Cache compartida entre vistas (página de materia y página del docente comparten reviews si el `queryKey` matchea).

**Negativas:**

- Curva de aprendizaje mayor. Hay que entender prefetch/dehydrate/HydrationBoundary/useSuspenseQuery/ReactQueryStreamedHydration.
- Dos renderings por primer request (RSC + hydration del cliente). Next.js 15 mitiga con streaming, pero el bundle del cliente sigue siendo un costo.

**Invariantes:**

- Todo `queryKey` debe ser consistente entre RSC prefetch y client `useSuspenseQuery`. El helper `queryOptions` en `api.ts` es la fuente de verdad — todos lo importan desde ahí, nadie escribe keys sueltos.
- Server Actions que mutan data llaman `revalidatePath` o `revalidateTag` para invalidar la cache de RSC, y opcionalmente `queryClient.invalidateQueries` desde el client side para coherencia.

**Cuándo revisitar:**

- Si Next.js o TanStack Query introducen un patrón mejor (ej. React Cache nativo con integración directa con Query).
- Si aparece overhead mensurable (unlikely en MVP).
