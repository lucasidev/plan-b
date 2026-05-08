# US-T06-i: Tier 1 CI workflows (Dependabot + all-commits CC + docs-links)

**Status**: Done (shipped en branch `ci/workflow-improvements`)
**Sprint**: S1 (junto con la institucionalización de testing)
**Epic**: [EPIC-00: Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: Medium
**Effort**: S
**UC**: 
**ADR refs**: [ADR-0026](../../decisions/0026-git-workflow-github-flow-con-rebase.md), [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md), [ADR-0037](../../decisions/0037-changelog-automation-auto-append.md)

## Como dev, quiero workflows base que mantengan el repo sano sin esfuerzo manual

US-T05 dejó tres workflows core (`ci.yml` existente, `changelog.yml`, `pr-title.yml`). Hay tres cosas más que ya nos están costando o nos van a costar pronto:

1. **Deps stale**: vamos a estar 4-6 meses tocando este repo. Sin Dependabot, las deps se acumulan y la actualización de golpe es dolorosa + riesgosa.
2. **Commits malos en main**: lefthook commit-msg corre local pero alguien con `--no-verify` puede meterlos. `pr-title.yml` cubre Squash; falta cubrir cada commit del PR para Rebase.
3. **Links rotos en docs**: tenemos ~40 docs entre ADRs, user-stories, EPIC, conventions, CLAUDE.md con cross-refs. Cuando se renombra un archivo (e.g. ADR-0037 cambió de release-please a auto-append en este mismo sprint) los links quedan colgados sin que nadie se entere.

## Acceptance Criteria

- [x] **Dependabot config** (`.github/dependabot.yml`):
  - [x] Cuatro ecosistemas: `nuget` (`/backend`), `npm` (`/frontend`), `github-actions` (`/`), `docker` (`/`).
  - [x] Schedule: weekly, lunes 08:00 ART.
  - [x] Open-PR limits: 5 backend, 5 frontend, 3 actions, 3 docker.
  - [x] Conventional Commits prefix: `build` para backend/frontend/docker, `ci` para github-actions. Para que cada PR pase `pr-title.yml` y alimente changelog correctamente.
  - [x] Labels por ecosistema (`dependencies`, `backend`/`frontend`/`ci`/`infra`).
  - [x] Agrupación minor+patch en backend y frontend para reducir ruido.
- [x] **All-commits Conventional Commits validator** (`.github/workflows/commits.yml`):
  - [x] Trigger: `pull_request` (opened, edited, synchronize, reopened).
  - [x] Itera `git rev-list --reverse <base>..<head>` y valida cada commit con `bun scripts/check-commit-msg.ts` (mismo regex que Lefthook local).
  - [x] Falla con `::error::` annotations específicas por commit incumpliente.
  - [x] No instala tools extras (sólo bun + el script existente).
- [x] **Markdown link checker** (`.github/workflows/docs-links.yml` + `.github/lychee.toml`):
  - [x] Trigger: `pull_request` y `push:main` filtrado por paths que tocan `*.md` o el config.
  - [x] Usa `lycheeverse/lychee-action@v2` con `actions/cache` para no pegar a externos cada run.
  - [x] Config en `.github/lychee.toml`: timeouts cortos, accept 200/206/304, exclude `node_modules` + GitHub commit/blob/tree URLs (rate-limit friendly).
  - [x] Falla en links internos rotos; tolera flakes externos vía exclude list.

## Sub-tasks

- [x] Crear `.github/dependabot.yml`.
- [x] Crear `.github/workflows/commits.yml` reusando `scripts/check-commit-msg.ts`.
- [x] Crear `.github/workflows/docs-links.yml` + `.github/lychee.toml`.
- [x] Documentar en US y EPIC-00 (sin ADR aparte; estos workflows son tooling estándar, no decisiones con alternativas reales).
- [x] Commit: `ci: dependabot + all-commits CC + markdown link checker (US-T06)`.

### Pendiente de la primera ejecución (post-merge a main)

- [ ] Confirmar que `commits.yml` corre en el primer PR posterior y valida.
- [ ] Confirmar que `docs-links.yml` corre y no falsa-positiviza en los docs actuales (si lo hace, ajustar `.github/lychee.toml`).
- [ ] Confirmar que Dependabot abre el primer batch de PRs el lunes próximo (o forzar manualmente desde Insights → Dependency graph → Dependabot).

## Notas de implementación

- **Dependabot + bun.lock**: GitHub Dependabot soporta `bun.lock` (formato texto) desde 2025. Si por alguna razón no detecta deps de `frontend/`, el fallback es agregar manualmente updates en otra US o usar Renovate.
- **Sin ADR**: estos tres workflows son tooling estándar (Dependabot oficial, lychee oficial, regex propio reusado). No hay alternativas que ameriten ADR según los criterios de `docs/decisions/README.md`. Si alguno se vuelve restrictivo (ej. Dependabot inundando de PRs), eso sí amerita decisión documentada.
- **Lychee tolera externos flaky**: la convención es "internos rotos = error, externos = warning". Si alguna vez queremos enforce strict externos, ajustamos `.github/lychee.toml`.
- **Commits validator es CI-only**: localmente Lefthook ya hace el check. El gap real está en `--no-verify` o branches viejas; este workflow es la red de seguridad.

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- ADRs: [ADR-0026](../../decisions/0026-git-workflow-github-flow-con-rebase.md), [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md), [ADR-0037](../../decisions/0037-changelog-automation-auto-append.md)
- Convenciones: [docs/testing/conventions.md](../../testing/conventions.md)
- Dependabot: https://docs.github.com/en/code-security/dependabot
- Lychee: https://github.com/lycheeverse/lychee
- amannn/action-semantic-pull-request (alternativa rechazada para commits.yml por no usar nuestro regex): https://github.com/amannn/action-semantic-pull-request
