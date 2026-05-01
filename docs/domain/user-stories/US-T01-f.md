# US-T01-f: Frontend unit/component testing infra

**Status**: Done (shipped en branch `feat/t01-frontend-testing-infra`)
**Sprint**: S1 (junto con la institucionalización de testing)
**Epic**: [EPIC-00 — Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: High
**Effort**: M
**UC**: —
**ADR refs**: [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md)

## Como dev, quiero infra de tests unit/component en el frontend para que cada feature pueda testearse sin browser

`vitest.config.ts` existía con `passWithNoTests: true` y cero tests. El frontend estaba descubierto: cada US frontend dependía de QA manual en browser, lo cual no escala (visible al aterrizar US-033). [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md) define la pirámide; este US la implementa para las capas de utils, schemas, server actions y componentes.

## Acceptance Criteria

- [x] `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `@testing-library/jest-dom` agregadas a `frontend/package.json` como devDependencies (versiones React-19 compatibles).
- [x] `jsdom` reemplaza a `happy-dom` (happy-dom 15 falla en React 19 form actions: `<form action={action}>` triggerea SyntaxError en BrowserFrameNavigator). Ver nota en `vitest.config.ts`.
- [x] `frontend/test-setup.ts` creado: importa `@testing-library/jest-dom/vitest` (matchers DOM-aware) y registra cleanup automático tras cada test.
- [x] `frontend/vitest.config.ts` actualizado: `setupFiles: ['./test-setup.ts']`, `passWithNoTests: false`, `include: ['src/**/*.{test,spec}.{ts,tsx}']`, `environment: 'jsdom'`.
- [x] Sample tests, todos passing:
  - [x] `src/lib/utils.test.ts` — 5 tests del helper `cn` (mergea, ignora falsy, arrays, clsx objects, dedupe Tailwind).
  - [x] `src/features/sign-in/schema.test.ts` — 5 tests del Zod schema `signInSchema` (valid, email vacío, email mal formado, password corta, type inference).
  - [x] `src/features/sign-in/actions.test.ts` — 7 tests del server action con `./api`, `next/navigation` y `@/lib/forward-set-cookies` mockeados (Zod inválido, 200→redirect, 401, 403 verified/disabled/unknown, 500).
  - [x] `src/features/sign-in/components/sign-in-form.test.tsx` — 6 tests del componente con `user-event` (render, link forgot, callback switchToSignUp, submit dispara action con FormData, alert en error, hint condicional para email_not_verified).
- [x] `bun run test` corre 23 tests verdes en ~3s.
- [x] `bun run test` agregado al `pre-push` hook de Lefthook (junto al lint + typecheck existentes).
- [x] `frontend-test` recipe del Justfile ya existía; queda funcional sin cambios.
- [x] CI (`.github/workflows/ci.yml`) sigue corriendo `bun run test`; ahora pasa por buena fe en lugar de trivialmente.
- [x] Update `docs/testing/conventions.md` y `frontend/CLAUDE.md` con jsdom en lugar de happy-dom.

## Sub-tasks

- [x] Decidir versión exacta de `@testing-library/*` compatible con React 19.1 + vitest 2.1: react@16.3.2, dom@10.4.1, user-event@14.6.1, jest-dom@6.9.1.
- [x] Agregar deps + correr `bun install`, verificar que el lockfile queda determinístico.
- [x] Inicialmente intenté con happy-dom (ya en deps); falló con SyntaxError en form actions. Migré a jsdom.
- [x] Escribir `test-setup.ts` minimalista (jest-dom matchers + cleanup).
- [x] Actualizar `vitest.config.ts` con setupFiles + jsdom + include glob explícito.
- [x] 4 sample tests cubriendo las 4 capas de la pirámide frontend.
- [x] Update `lefthook.yml`: agregar `frontend-test` al `pre-push`.
- [x] Update `docs/testing/conventions.md` y `frontend/CLAUDE.md` (jsdom replaza a happy-dom).
- [x] Commit: `feat(test): vitest + Testing Library setup + sample tests (US-T01)`.

## Notas de implementación

- **happy-dom → jsdom**: el plan original era usar happy-dom (ya estaba en `package.json`). Funcionó para utils + schemas + server actions, pero los component tests con `<form action={action}>` (patrón estándar de React 19 + `useActionState`) fallaron con `SyntaxError: Invalid or unexpected token` en `happy-dom/.../BrowserFrameNavigator.ts:79`. happy-dom 15 todavía no soporta el flow completo de form actions. jsdom es ~2× más lento al boot pero estable. La doc se actualizó en consecuencia (ADR-0036, conventions.md, CLAUDE.md).
- **`redirect()` de Next**: en tests, mockeamos `next/navigation` y hacemos que el mock tire un Error con `digest: NEXT_REDIRECT;<url>`. El test usa `await expect(...).rejects.toThrow(/NEXT_REDIRECT:\/home/)`. Patrón documentado en el sample.
- **Mocking del action en component tests**: `vi.mock('../actions', ...)`. El test del component verifica integración (form → action call → render del FormState). El detalle del action vive en `actions.test.ts`. Sin overlap.
- **No agregamos coverage gates** ([ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md)). Tracking sí (futuro CI step), gate no.
- **Un test por capa, no más**, en este US. Habilita el patrón. Cada feature US futura agrega los suyos.

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- ADRs: [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md)
- Convenciones: [docs/testing/conventions.md](../../testing/conventions.md)
- Bloqueante para: [US-T02-f](US-T02-f.md)
