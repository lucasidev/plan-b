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

## Revisión 2026-08-01: `router.push` tampoco alcanza, y faltaban doce actions

Dos cosas que este ADR daba por resueltas y no lo estaban.

**Primera: el patrón estaba escrito pero no aplicado.** Un barrido encontró **once sitios en diez
features** que seguían redirigiendo o revalidando adentro del action: alta de cursada, importar
historial, onboarding, sign-in, sign-up, sign-out, forgot-password, reset-password,
change-password, deactivate-account (tres caminos) y los `revalidatePath` de settings y
my-profile. Todos migrados. `settings` y `my-profile` quedaron sin reemplazo: sus páginas son
`force-dynamic`, así que la invalidación no compraba nada.

**Segunda, y más importante: `router.push` no es un canal seguro.** Este ADR afirmaba que el
flight GET "nunca presentó el problema". Es falso, y ahora está medido. Corriendo el E2E veinte
veces contra un build de producción:

| variante | alta de cursada | edición de cursada |
|---|---|---|
| `redirect()` adentro del action | 50% falla | - |
| `router.push` desde el efecto | 5% | 25% |
| idem + `<Suspense>` en la tab del destino | 0/20 | 10% |
| `location.assign` | 0/20 | 0/20 |

El trace del fallo es inequívoco: el POST del action vuelve 200 en 14ms, el GET del payload RSC del
destino vuelve 200 en 3ms, y después no pasa nada durante treinta segundos. El contenido estaba;
lo que no ocurría era el commit. `router.push` es una transición de React, y React difiere el
commit de una transición hasta que el árbol nuevo esté listo: mientras tanto la URL no cambia y la
pantalla sigue siendo el formulario, o sea que el usuario ve su cambio como si no hubiera pasado.

De ahí salen dos correcciones a la decisión original:

1. **La navegación que cierra un formulario va por `navigateAfterMutation`**
   (`frontend/src/lib/navigate-after-mutation.ts`), que hace `location.assign`. Cambia la URL de
   forma sincrónica y saca a React de la ecuación. El precio es un reload completo, barato en un
   flujo que ya está saliendo de la página. **No** es el default para navegar en la app: para
   moverse entre pantallas sigue siendo `router.push`.
2. **Una ruta dinámica que hace fetch necesita su `<Suspense>`.** Sin boundary, la navegación
   entera espera a que el render del servidor cierre el stream. Bajó el fallo del alta de 50% a 0
   por sí solo, y vale igual con la navegación dura: es lo que hace que la pantalla aparezca
   enseguida en vez de quedarse en blanco.

Lo que **no** cambia: el action sigue siendo una mutación pura. Lo que cambia es cómo el cliente
ejecuta la consecuencia.

## Refs

- Medición de 2026-08-01: `bun scripts/run-e2e.ts --build <spec> --repeat-each=20 --retries=0`.
  El spec tuvo que volverse repetible primero (alumno descartable en vez de una persona
  compartida): un test cuyo primer paso persiste no se puede reintentar, y su reintento moría con
  un 409 que tapaba el fallo original.
- PR #147: fix del cuelgue + guarda `clientApiFetch`. Diagnóstico con repro estadístico en `next start --repeat-each`.
- `frontend/src/features/write-review/actions.ts`, `frontend/src/features/edit-review/actions.ts`, `frontend/src/features/delete-review/`: actions que aplican el patrón (comentario inline en el branch del 201/200).
- `frontend/src/features/write-review/components/review-editor.tsx`: el `useEffect` que reacciona al `status: 'success'`.
- [ADR-0021](0021-data-fetching-rsc-tanstack-query.md): data fetching con RSC + TanStack Query (el patrón de invalidación cliente se apoya en esto).
- [ADR-0022](0022-forms-react19-primitives-tanstack-form.md): forms con React 19 primitives (`useActionState`/`useFormStatus`), que son los que quedaban colgados.
