# ADR-0022: Forms — React 19 primitives + TanStack Form para complejos

- **Estado**: aceptado
- **Fecha**: 2026-04-23

## Contexto

Planb tiene forms de complejidad variable:

- **Simples (1-3 campos)**: login, sign-up, verify-email, report review, confirm dialog.
- **Medios (4-8 campos)**: publicar reseña (rating, 2 textos, select docente, grade), crear TeacherProfile (subir evidencia + metadata).
- **Complejos (multi-step, conditional fields, arrays)**: admin CRUD del catálogo académico (crear Commission con docentes múltiples, crear CareerPlan con sus Subjects), wizard de import de historial.

En React 19.1 + Next.js 15, hay primitives nativos que reemplazan mucha de la ceremonia que antes requería librerías:

- `<form action={serverAction}>` con progressive enhancement.
- `useActionState` — state + action dispatcher integrado.
- `useFormStatus` — estado pending de un form para componentes nested.
- `useOptimistic` — updates optimistas antes del server response.

Y para forms complejos, **TanStack Form** (2026) ha ganado tracción sobre react-hook-form por type-safety de primer nivel y framework-agnostic design, con integración específica con shadcn/ui vía `shadcn-tanstack-form`.

## Decisión

**Dos patrones según complejidad:**

### Forms simples → React 19 primitives nativos

- `<form action={serverAction}>` con Server Action definida en `features/<feature>/actions.ts`.
- `useActionState` para el state devuelto por el action.
- `useFormStatus` en el submit button nested.
- Zod para validar el input del Server Action (server-side authoritative).

```tsx
// features/identity/actions.ts
'use server'
export async function signIn(prevState, formData) {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.flatten() }
  // ... call backend
}

// features/identity/components/sign-in-form.tsx
'use client'
export function SignInForm() {
  const [state, action] = useActionState(signIn, initialState)
  return (
    <form action={action}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      {state?.error && <ErrorMessage />}
      <SubmitButton />
    </form>
  )
}
```

### Forms complejos → TanStack Form + Zod + Server Actions

- TanStack Form maneja state, validation, field arrays, conditional rendering.
- Zod schemas compartidos entre client (TanStack Form resolver) y server (Server Action validation).
- Submit final via Server Action.
- `shadcn-tanstack-form` provee components UI integrados.

### Mutations con feedback inmediato → `useOptimistic`

- Al publicar una reseña, aparece en la lista instantáneamente marcada como "enviando".
- Al confirmar server-side, se reemplaza con la real.
- Si falla, se rollback + error.

## Alternativas consideradas

### A. react-hook-form para todos los forms

El estándar de 2020-2024. Librería madura, buen DX. Descartada porque:

- Para forms simples, el overhead vs React 19 primitives no se justifica.
- TypeScript support es bueno pero no tan fino como TanStack Form (que es TypeScript-first por diseño).
- shadcn-tanstack-form ofrece mejor integración con los components UI que usamos.
- La dirección del ecosistema en 2026 se inclina hacia TanStack Form para casos complejos.

### B. React 19 primitives para todos los forms

Simpler si funciona. Descartada porque:

- Forms con >4 fields y especialmente con arrays/conditionals se vuelven tortuosos con FormData + useActionState plano.
- Falta de real-time validation (no "email inválido" mientras el user tipea) en solo-primitives.
- El admin CRUD del catálogo tiene forms genuinamente complejos (crear Commission = Subject + Term + varios Teachers con roles).

### C. Formik

Predecesor de react-hook-form, ahora fuera del radar. Descartada de plano.

## Consecuencias

**Positivas:**

- Forms simples sin dependencia extra, aprovechando las capabilities nativas de React 19.
- Forms complejos con type-safety end-to-end (schema → client validation → server validation → response type).
- Zod como lenguaje único de validación, compartido entre front y Server Actions. Si el schema cambia, ambos lados se actualizan.
- Progressive enhancement gratis: los forms simples funcionan sin JS (trabajo del Server Action + HTML nativo).
- `useOptimistic` elimina la razón principal por la que antes se necesitaba Zustand o client state global.

**Negativas:**

- Dos patrones coexisten. Devs tienen que elegir cuál usar según la complejidad del form.
- El "umbral" entre simple y complejo es subjetivo. Guía: si aparece array de items, conditional fields, multi-step, o necesitás validación en vivo sofisticada → TanStack Form.

**Regla pragmática:**

> Default al patrón simple (React 19). Upgrade a TanStack Form solo si el simple se está torciendo.

**Cuándo revisitar:**

- Si TanStack Form pierde tracción y react-hook-form se estabiliza como estándar.
- Si React introduce primitives que cubran los casos complejos sin necesidad de librería externa.
