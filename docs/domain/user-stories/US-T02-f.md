# US-T02-f: Frontend E2E infra (Playwright)

**Status**: Backlog
**Sprint**: TBD
**Epic**: [EPIC-00 — Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: High
**Effort**: M
**UC**: —
**ADR refs**: [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md)
**Blocked by**: [US-T01-f](US-T01-f.md)

## Como dev, quiero infra de tests E2E permanente en frontend para que los user flows críticos no dependan de QA manual

Durante US-033 escribí un Playwright spec ad-hoc, lo corrí, lo borré. Probó que el feature anduvo en ese momento; no protege a la próxima persona que lo cambie. [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md) institucionaliza Playwright como capa E2E. Este US monta config permanente, helpers reutilizables, primer spec real (migrado de US-033) y CI job on-demand.

## Acceptance Criteria

- [ ] `frontend/playwright.config.ts` permanente:
  - [ ] `testDir: './e2e'`
  - [ ] `baseURL: 'http://localhost:3000'`
  - [ ] `headless: true` por default; `headed` opt-in via env var.
  - [ ] `screenshot: 'only-on-failure'`, `trace: 'retain-on-failure'`.
  - [ ] Browsers: chromium siempre. Firefox/Webkit como matrix opcional en CI.
- [ ] `frontend/e2e/helpers/` con helpers reutilizables:
  - [ ] `personas.ts` — exporta constantes `LUCIA`, `MATEO`, `PAULA`, `MARTIN` con email + password tomados del seed.
  - [ ] `mailpit.ts` — exporta `extractTokenFromLatestMail(recipient)`, `clearAllMessages()`.
  - [ ] `redis.ts` — exporta `clearForgotPasswordRateLimits()` y otros wrappers que se necesiten.
- [ ] `frontend/e2e/auth/forgot-password.spec.ts` — migración del spec ad-hoc de US-033, ahora reusando helpers, con assertions estables (no relying on auto-wait timing).
- [ ] `frontend/e2e/auth/sign-in.spec.ts` — happy path de sign-in (Lucía signin → /home). Sirve como sample para futuros specs.
- [ ] `package.json` script `test:e2e` ya existe (`playwright test`); queda funcional contra el config permanente.
- [ ] `Justfile` recipe `frontend-test-e2e` ya existe; verificada.
- [ ] `.github/workflows/ci.yml` actualizado:
  - [ ] Job nuevo `frontend-e2e` que arranca postgres + redis + mailpit + backend dev en background, instala browsers de Playwright (cache), corre `bunx playwright test`.
  - [ ] **Trigger on-demand**: dispara cuando el PR tiene label `e2e` o cuando el push es a `main`. NO en cada push.
  - [ ] On failure: upload trace zips como artifact.
- [ ] Documentación:
  - [ ] `docs/testing/conventions.md` actualizado con el patrón "personas vs ad-hoc users", "cómo correr E2E local".
  - [ ] `frontend/CLAUDE.md` ya menciona el layout (de US-T01); verificar que el patrón cierra.

## Sub-tasks

- [ ] Crear `playwright.config.ts` con la config base.
- [ ] Crear `e2e/helpers/personas.ts` extrayendo del seed (`backend/host/Planb.Api/seed-data/personas.json`).
- [ ] Crear `e2e/helpers/mailpit.ts` con la lógica de `getLatestResetToken` que ya escribí en el throwaway.
- [ ] Crear `e2e/helpers/redis.ts` con `clearForgotPasswordRateLimits`.
- [ ] Migrar el spec de forgot-password al nuevo layout, reusando helpers.
- [ ] Escribir spec sign-in happy path.
- [ ] Crear `frontend-e2e` job en CI con services + label trigger.
- [ ] Cache de browsers: `actions/cache` con key basada en versión de Playwright.
- [ ] Update Justfile recipe (probar local end-to-end).
- [ ] Update `docs/testing/conventions.md` con detalles operacionales.
- [ ] Commit: `test(frontend): Playwright e2e infra + auth flows (US-T02)`.

## Notas de implementación

- **El spec de forgot-password ya está escrito** (en mi cabeza, después de hacerlo throwaway). El skeleton se baja directo del archivo `_smoke-us033.spec.ts` que escribí + borré durante US-033. Ese código tiene los locators correctos para los strings reales del frontend.
- **CI on-demand**: triggering by label es estándar (`if: contains(github.event.pull_request.labels.*.name, 'e2e')`). Para push a main: `if: github.ref == 'refs/heads/main'`.
- **Browser cache en CI**: `~/.cache/ms-playwright` ocupa ~111MB chromium-headless-shell + ~150MB chromium full. Cachearlo con key `playwright-${{ hashFiles('frontend/package.json') }}` baja runtime de 5min a ~30s.
- **Backend en CI**: el job arranca el backend con `dotnet run --project backend/host/Planb.Api &` y espera healthcheck. El frontend con `bun next start` (no dev mode, para evitar inestabilidad de Turbopack en CI).
- **Flake mitigation**: `expect.toBeVisible()` antes de cada screenshot para no capturar pantallas en blanco. Default test timeout 60s, expect timeout 10s.
- **Datos**: la suite asume seed corrido. Si Lucía no existe, los tests fallan con error claro. NO crear usuarios desde el spec — eso ensucia datos compartidos y crea acoplamiento entre tests.
- **Limpieza al final**: cada test que modifica password de una persona seed la restaura. Patrón documentado en `conventions.md`.

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- ADRs: [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md)
- Convenciones: [docs/testing/conventions.md](../../testing/conventions.md)
- Depende de: [US-T01-f](US-T01-f.md)
- Migra el throwaway de: [US-033-i](US-033-i.md)
