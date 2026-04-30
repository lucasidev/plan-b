# US-T01-f: Frontend unit/component testing infra

**Status**: Backlog
**Sprint**: TBD
**Epic**: [EPIC-00 — Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: High
**Effort**: M
**UC**: —
**ADR refs**: [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md)

## Como dev, quiero infra de tests unit/component en el frontend para que cada feature pueda testearse sin browser

Hoy `vitest.config.ts` existe pero con `passWithNoTests: true` y cero tests escritos. El frontend está descubierto: cada US frontend depende de QA manual en browser, lo cual no escala (visible al aterrizar US-033). [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md) define la pirámide; este US la implementa para las capas de utils, schemas, server actions y componentes.

## Acceptance Criteria

- [ ] `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `@testing-library/jest-dom` agregadas a `frontend/package.json` como devDependencies.
- [ ] `frontend/test-setup.ts` creado: importa `@testing-library/jest-dom/vitest` y configura cualquier helper global.
- [ ] `frontend/vitest.config.ts` actualizado: `setupFiles: ['./test-setup.ts']`, `passWithNoTests: false` (cuando haya al menos un test), aliases para coverage.
- [ ] Sample test por capa, todos passing:
  - [ ] `src/lib/utils.test.ts` — test del helper `cn`.
  - [ ] `src/features/sign-in/schema.test.ts` — test del Zod schema `signInSchema`.
  - [ ] `src/features/sign-in/actions.test.ts` — test del server action `signInAction` con `apiFetch` mockeado.
  - [ ] `src/features/sign-in/components/sign-in-form.test.tsx` — test del componente con un user event happy path + un error state.
- [ ] `bun run test` en frontend corre los tests sample y reporta passed.
- [ ] `bun run test` agregado al `pre-push` hook de Lefthook (junto al lint + typecheck existentes).
- [ ] `frontend-test` en Justfile ya existe; queda funcional sin cambios.
- [ ] CI (`.github/workflows/ci.yml`) sigue corriendo `bun run test`; ahora que hay tests reales, pasa por buena fe en lugar de trivialmente.
- [ ] `docs/testing/conventions.md` actualizado si se descubre algún detalle no previsto.

## Sub-tasks

- [ ] Decidir versión exacta de `@testing-library/*` compatible con React 19.1 + vitest 2.1.
- [ ] Agregar deps + correr `bun install`, verificar que el lockfile queda determinístico.
- [ ] Escribir `test-setup.ts` minimalista.
- [ ] Actualizar `vitest.config.ts` con setupFiles + (opcional) coverage config.
- [ ] Escribir el sample test de `cn` (lib/utils).
- [ ] Escribir el sample test del Zod schema sign-in.
- [ ] Escribir el sample test del action sign-in con fetch mockeado.
- [ ] Escribir el sample test del componente sign-in con `user-event`.
- [ ] Update `lefthook.yml`: agregar `frontend-test` al `pre-push`.
- [ ] Verificar que `just ci` corre los tests nuevos.
- [ ] Commit con mensaje `test(frontend): vitest + Testing Library setup + sample tests (US-T01)`.

## Notas de implementación

- **No conviene mockear todo el server action**: lo testeamos como caja gris. `apiFetch` (de `lib/api-client.ts`) sí mockeable, lo demás (Zod, FormData parsing, redirect) corre real.
- **`redirect` de Next**: en tests, `redirect()` lanza una excepción especial. Usar `expect(() => action(...)).toThrow(/NEXT_REDIRECT/)` o capturar la URL del thrown error. Patrón a estabilizar en este US.
- **No agregamos coverage gates** ([ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md)). Sí podemos generar reports a artifact en CI, pero sin gate.
- **Un test por capa, no más**, en este US. La idea es habilitar el patrón, no llenar el repo. Cada feature US futura agrega los suyos.

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- ADRs: [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md)
- Convenciones: [docs/testing/conventions.md](../../testing/conventions.md)
- Bloqueante para: [US-T02-f](US-T02-f.md)
