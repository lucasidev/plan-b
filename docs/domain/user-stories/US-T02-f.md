# US-T02-f: Frontend E2E infra (Playwright)

**Status**: Done (shipped en branch `feat/t02-playwright-e2e-infra`)
**Sprint**: S1 (junto con la institucionalización de testing)
**Epic**: [EPIC-00 — Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: High
**Effort**: M
**UC**: —
**ADR refs**: [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md)
**Blocked by**: [US-T01-f](US-T01-f.md) (Done)

## Como dev, quiero infra de tests E2E permanente en frontend para que los user flows críticos no dependan de QA manual

Durante US-033 escribí un Playwright spec ad-hoc, lo corrí, lo borré. Probó que el feature anduvo en ese momento; no protege a la próxima persona que lo cambie. [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md) institucionaliza Playwright como capa E2E. Este US monta config permanente, helpers reutilizables, primer spec real (migrado de US-033) + un sample sign-in, y CI job on-demand.

## Acceptance Criteria

- [x] `frontend/playwright.config.ts` permanente:
  - [x] `testDir: './e2e'`, `testMatch: /.*\.spec\.ts/`.
  - [x] `baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'`.
  - [x] `headless: true` por default; `headed` opt-in via env var.
  - [x] `screenshot: 'only-on-failure'`, `trace: 'retain-on-failure'`, `video: 'retain-on-failure'`.
  - [x] Browsers: chromium siempre. Firefox/Webkit como matrix opcional via `PLAYWRIGHT_ALL_BROWSERS=1`.
  - [x] Timeouts: 60s por test, 10s para auto-wait de locators.
  - [x] CI: `forbidOnly: true`, `retries: 1`, `workers: 1`, reporters `github` + `html`. Local: `retries: 0`, `list` reporter.
- [x] `frontend/e2e/helpers/` con helpers reutilizables:
  - [x] `personas.ts` — exporta `LUCIA`, `MATEO`, `PAULA`, `MARTIN` con email + password tomados del seed (`backend/host/Planb.Api/seed-data/personas.json`).
  - [x] `mailpit.ts` — `listMessages`, `waitForMail`, `getMessage`, `extractTokenFromLatestMail`, `clearAllMessages`.
  - [x] `redis.ts` — `clearForgotPasswordRateLimits`, `clearAllIdentityRateLimits`. Skip automático en CI (donde Redis es service container sin nombre `planb-redis`).
- [x] `frontend/e2e/auth/forgot-password.spec.ts` — migración del spec ad-hoc de US-033, ahora reusando helpers, con assertions estables (no relying on auto-wait timing). Cubre happy path + 3 edge cases (anti-enum, garbage token, sin token).
- [x] `frontend/e2e/auth/sign-in.spec.ts` — sample con 4 cases: happy path Lucía, Martín no verificado, Paula deshabilitada, credenciales inválidas (anti-enum).
- [x] `package.json` script `test:e2e` ya existía (`playwright test`); funcional contra el config permanente.
- [x] `Justfile` recipe `frontend-test-e2e` ya existía; funcional sin cambios.
- [x] `vitest.config.ts` actualizado con `exclude: ['e2e/**', ...]` para que vitest no intente correr los specs de Playwright.
- [x] `.github/workflows/e2e.yml`:
  - [x] Job nuevo con services postgres + redis + mailpit (igual que ci.yml).
  - [x] Steps: build backend Release + start in background con `dotnet run` (host hace ResourceAutoCreate=CreateOrUpdate en Dev → migra y seedea automáticamente al primer startup).
  - [x] Cache de browsers Playwright (`~/.cache/ms-playwright`) para no re-bajar en cada run.
  - [x] Trigger on-demand: `pull_request` con label `e2e`, `push:main`, o `workflow_dispatch`.
  - [x] On failure: upload `playwright-report` + `backend.log` como artifacts.

## Sub-tasks

- [x] Crear `playwright.config.ts` con la config base.
- [x] Crear `e2e/helpers/personas.ts` extrayendo del seed.
- [x] Crear `e2e/helpers/mailpit.ts` con la lógica de `extractTokenFromLatestMail` que ya escribí en el throwaway.
- [x] Crear `e2e/helpers/redis.ts` con `clearForgotPasswordRateLimits`. Skip en CI (sin podman).
- [x] Migrar el spec de forgot-password al nuevo layout, reusando helpers.
- [x] Escribir spec sign-in (happy + 3 edge cases) como sample.
- [x] Crear `e2e.yml` job en CI con services + on-demand trigger + cache de browsers + artifacts.
- [x] Update `vitest.config.ts` excluyendo `e2e/**`.
- [x] Update `frontend/CLAUDE.md` reflejando que E2E aterrizó.
- [x] Commit: `feat(test): Playwright e2e infra + auth flows (US-T02)`.

### Pendiente de la primera ejecución (post-merge a main)

- [ ] Confirmar que el job `e2e.yml` corre en CI on push:main + agregando label `e2e` a un PR.
- [ ] Si el spec de forgot-password falla en CI por timing (mailpit polling, etc.), iterar.
- [ ] Si los specs de sign-in fallan porque el seed no llegó a tiempo, ajustar el `wait-for-backend` step.

## Notas de implementación

- **El spec de forgot-password ya estaba escrito** en mi cabeza desde US-033. El skeleton se baja directo del archivo `_smoke-us033.spec.ts` que escribí + borré durante US-033. Locators correctos, helpers refactorizados.
- **CI on-demand**: `if:` job-level chequea `contains(github.event.pull_request.labels.*.name, 'e2e')`, `github.ref == 'refs/heads/main'`, o `workflow_dispatch`. PRs sin label aparecen "Skipped" en el merge UI, no failed.
- **Browser cache en CI**: `actions/cache@v5` con key `playwright-${{ runner.os }}-${{ hashFiles('frontend/bun.lock') }}`. Baja runtime de ~5min cold a ~30s con cache hit.
- **Backend en CI**: arranca con `nohup dotnet run --no-build --configuration Release` en background. Espera healthcheck en :5000 hasta 30s. En Development env el host migra + seedea automáticamente vía Wolverine ResourceAutoCreate + DevSeedHostedService.
- **Frontend en CI**: production build + `bun next start` (no Turbopack dev mode). Más estable para CI.
- **Restore de pw**: el spec de forgot-password modifica la pw de Lucía. Al final llama `restoreLuciaPassword()` que pega contra el backend directo (forgot + reset con el mail). Si el spec crashea sin restaurar, el siguiente run arranca con pw rota — tradeoff aceptado para mantener simple.
- **redis.ts skip en CI**: En CI, Redis es un service container sin nombre `planb-redis`. El helper detecta `process.env.CI === 'true'` y skipea las llamadas. Como el service container es ephemeral por run, los rate-limit buckets arrancan vacíos sin necesidad de limpiar.

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- ADRs: [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md)
- Convenciones: [docs/testing/conventions.md](../../testing/conventions.md)
- Depende de: [US-T01-f](US-T01-f.md)
- Migra el throwaway de: [US-033-i](US-033-i.md)
