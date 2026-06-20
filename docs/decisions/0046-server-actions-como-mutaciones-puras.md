# ADR-0046: Server Actions como mutaciones puras (sin revalidatePath/redirect inline)

- **Estado**: aceptado
- **Fecha**: 2026-06-20

## Contexto

El patrón canónico de Next.js App Router para una Server Action que muta es: hacer el write, llamar `revalidatePath('/ruta')` (o `revalidateTag`) y/o `redirect('/destino')` dentro del propio action. El framework re-renderiza la ruta afectada y embebe ese resultado en la respuesta del action, así el cliente ve la data fresca sin un round-trip extra.

En este proyecto ese patrón causó un bug intermitente de producción. Las acciones de publicar / editar / borrar reseña (US-017/018/055) usaban `revalidatePath` + `redirect()`. En `next start` (build de prod), la transición del form quedaba colgada de forma intermitente (~12% de los intentos): el cliente recibía el 303 y se quedaba esperando un body chunked que nunca terminaba, dejando el `useActionState`/`useFormStatus` en pending para siempre. Sin errores en ningún lado (ni cliente, ni server, ni red). En dev mode no se reproducía.

El diagnóstico (PR #147) descartó que fuera `ReactQueryStreamedHydration`: sacarlo EMPEORÓ la falla (de ~12% a 81%). La causa es el re-render de la página embebido en el stream de la respuesta del action, que se estanca intermitentemente bajo el runtime de prod.

## Decisión

**Las Server Actions son mutaciones puras**: hacen el write y devuelven un resultado discriminado (`{ status: 'success' | 'error' | 'idle', ... }`). **No** llaman `revalidatePath` ni `redirect()` adentro.

Las consecuencias (invalidar cache, navegar) las maneja el **cliente** al recibir el `status: 'success'`:

```ts
// El componente reacciona al resultado del action.
useEffect(() => {
  if (state.status !== 'success') return;
  queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
  queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
  router.push('/reviews?tab=pending'); // flight GET normal, nunca se cuelga
}, [state.status, queryClient, router]);
```

El `router.push` dispara un flight GET normal a la página (no el stream embebido del action), que nunca presentó el problema. La invalidación de TanStack Query refetchea la data afectada.

## Alternativas consideradas

- **A. `revalidatePath` + `redirect()` inline (patrón canónico de Next.js).** Rechazada: es exactamente lo que causa el cuelgue intermitente en prod. Falsificado con repro estadístico (10/10 verde con el patrón nuevo contra una baseline de 81% de falla con el viejo en su peor variante).
- **B. Sacar `ReactQueryStreamedHydration`.** Rechazada: empeoró la falla (81%), confirmando que el hydration streaming no era la causa sino que mitigaba parcialmente.
- **C. Mutación pura + cliente invalida + `router.push` (elegida).** El cliente es dueño de las consecuencias; el action solo reporta `{status}`.

## Consecuencias

### Positivas

- No más cuelgues intermitentes en prod. Comportamiento determinístico.
- La separación es clara: el action muta y reporta; el componente decide qué hacer con el éxito (invalidar qué queries, navegar a dónde).
- Testeable: el action se testea como función pura `(prev, formData) => {status}` (ver `actions.test.ts`), sin mockear el ciclo de re-render de Next.

### Negativas

- La invalidación + navegación viven en el componente cliente, no en el action. Es un poco más de código en el cliente y el caller TIENE que cablear la reacción al `status: 'success'` (si se olvida, la mutación pasa pero la UI no refleja el cambio).
- Se renuncia al azúcar del patrón canónico de Next. Hay que documentarlo (este ADR) para que nadie "arregle" un action agregándole `revalidatePath` y reintroduzca el bug.

### A vigilar

- Si una futura versión de Next resuelve el estancamiento del stream embebido, re-evaluar. Mientras tanto, la regla aplica a toda Server Action que mute en este repo.
- El patrón asume que la data afectada está en TanStack Query (invalidable) o que un `router.push`/`router.refresh` alcanza. Para data que no está en Query y necesita refresco server-side sin navegación, evaluar `router.refresh()` (flight GET, mismo canal seguro) antes de volver a `revalidatePath`.

## Refs

- PR #147: fix del cuelgue + guarda `clientApiFetch`. Diagnóstico con repro estadístico en `next start --repeat-each`.
- `frontend/src/features/write-review/actions.ts`, `frontend/src/features/edit-review/actions.ts`, `frontend/src/features/delete-review/`: actions que aplican el patrón (comentario inline en el branch del 201/200).
- `frontend/src/features/write-review/components/review-editor.tsx`: el `useEffect` que reacciona al `status: 'success'`.
- [ADR-0021](0021-data-fetching-rsc-tanstack-query.md): data fetching con RSC + TanStack Query (el patrón de invalidación cliente se apoya en esto).
- [ADR-0022](0022-forms-react19-primitives-tanstack-form.md): forms con React 19 primitives (`useActionState`/`useFormStatus`), que son los que quedaban colgados.
