# US-T05-i: Changelog auto-append + PR title validator

**Status**: Done (shipped en branch `docs/testing-strategy-cross-stack`)
**Sprint**: S1 (junto con la institucionalización de testing)
**Epic**: [EPIC-00: Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: Medium
**Effort**: S
**UC**: 
**ADR refs**: [ADR-0037](../../decisions/0037-changelog-automation-auto-append.md), [ADR-0038](../../decisions/0038-release-and-versioning-policy.md), [ADR-0026](../../decisions/0026-git-workflow-github-flow-con-rebase.md)

## Como dev, quiero que `CHANGELOG.md` se actualice solo a partir de Conventional Commits para que mantener el changelog no dependa de memoria humana

`CHANGELOG.md` existe pero nadie lo edita en cada PR. Lefthook ya enforcea Conventional Commits, así que el input estructurado está disponible. Falta la pipa que lo convierta en bullets del CHANGELOG. [ADR-0037](../../decisions/0037-changelog-automation-auto-append.md) elige un workflow GHA con script TS que appendea el último commit a `[Unreleased]`. **Sin version bump, sin tag, sin GitHub Release**: la política de versioning está cubierta por separado en [ADR-0038](../../decisions/0038-release-and-versioning-policy.md) (pre-deploy = no hay versiones).

## Acceptance Criteria

- [x] `scripts/append-changelog.ts`:
  - [x] Lee `git log -1` para sha, short sha, subject, body.
  - [x] Parsea el subject como Conventional Commit usando el mismo regex de `scripts/check-commit-msg.ts`.
  - [x] Mapea tipos a secciones de Keep-a-Changelog: `feat` → "Added", `perf`/`refactor` → "Changed", `fix` → "Fixed", `revert` → "Removed". Tipos `docs`/`style`/`test`/`build`/`ci`/`chore` → skip (exit 0 sin cambios).
  - [x] Construye el bullet: `- <descripción> (<scope>): [<short-sha>](<repo>/commit/<sha>)`.
  - [x] Si el subject tiene `!:` o el body contiene `BREAKING CHANGE:`, agrega marker `**(BREAKING)**` al bullet.
  - [x] Inserta el bullet en `CHANGELOG.md` bajo `## [Unreleased]` → `### <sección>`, creando el subheader si no existe.
  - [x] Si el commit ya fue procesado (sha presente en el changelog), exit 0 sin cambios. Idempotente.
  - [x] Skip si el body contiene `[skip changelog]`.
  - [x] Funciones puras exportadas para testing (`parseSubject`, `buildBullet`, `insertBullet`).
  - [x] Tests embebidos en `scripts/_test-append-changelog.ts` (26 cases: parseo CC, build con/sin scope/BREAKING/repo, insert con/sin sección existente, idempotencia, preservación de secciones versionadas). Se portará a vitest cuando aterrice US-T01.
- [x] `.github/workflows/changelog.yml`:
  - [x] Trigger: `push` a `main`. Filtro: `if: !startsWith(...'docs(changelog):')` para no entrar en loop con sus propios commits (belt-and-suspenders sobre la protección nativa de GITHUB_TOKEN).
  - [x] Steps: checkout, setup-bun, ejecutar el script, commit+push back con `stefanzweifel/git-auto-commit-action@v5`.
  - [x] Permissions: `contents: write`.
  - [x] El commit msg del bot: `docs(changelog): auto-update from <sha>`.
  - [x] `concurrency` group para evitar runs paralelos.
- [x] `.github/workflows/pr-title.yml`:
  - [x] Trigger: `pull_request` (opened, edited, synchronize, reopened).
  - [x] Usa `amannn/action-semantic-pull-request@v5`.
  - [x] Catalogue de tipos: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert (igual que Lefthook).
  - [x] Permissions: `pull-requests: read`.
- [x] PR template (`.github/pull_request_template.md`):
  - [x] Sección "Breaking changes" reescrita: marker se conserva en el changelog con `**(BREAKING)**`, versioning policy es deferred (link a ADR-0038).
  - [x] Footer comment: refleja el flujo nuevo (auto-append on merge, no editar a mano).
- [x] `docs/testing/conventions.md` sección "Changelog automation": describe el flujo, qué tipos aparecen, opt-out con `[skip changelog]`, link a ADR-0037 y ADR-0038.
- [x] `CLAUDE.md` (root): nota del flujo + link a ADR-0038 para versioning.
- [x] `CHANGELOG.md` limpiado (Opción A): bullets narrativos viejos borrados, queda sólo el header, ready para que el auto-append lo llene.
- [x] Verificación local: dry-run del script contra commits reales del repo (feat con scope, fix, BREAKING simulado), tests embebidos pasan 26/26.

### Pendiente de la primera ejecución (post-merge a main)

- [ ] Confirmar que el workflow `changelog.yml` corre en CI al primer push a main, appendea correctamente, y el commit del bot aparece sin disparar loop.
- [ ] Confirmar que `pr-title.yml` corre en cada PR y bloquea cuando el title está mal formado.

## Sub-tasks

- [x] Escribir `scripts/append-changelog.ts`.
- [x] Escribir `scripts/_test-append-changelog.ts` (26 tests embebidos, portear a vitest en US-T01).
- [x] Crear `.github/workflows/changelog.yml`.
- [x] Crear `.github/workflows/pr-title.yml`.
- [x] Update `docs/testing/conventions.md`.
- [x] Update `CLAUDE.md` (root).
- [x] Update `.github/pull_request_template.md` (sección breaking + footer).
- [x] Limpiar `CHANGELOG.md` (Opción A).
- [x] Commit: `ci: changelog auto-append + PR title validator (US-T05)`.
- [ ] Post-merge a main: validar primera ejecución, iterar si hay sorpresas.

## Notas de implementación

- **Loop prevention**: el workflow `changelog.yml` ignora sus propios commits con `if: !startsWith(github.event.head_commit.message, 'docs(changelog):')`. GITHUB_TOKEN ya tiene una protección nativa (commits hechos con él no disparan workflows), pero el filtro `if` es belt-and-suspenders + visibilidad ("este run se skipeó porque…").
- **Squash and merge**: cuando se mergea con Squash, el único commit en main es el título del PR. Si el título no es Conventional Commit, el script falla al parsear o mapea mal. `pr-title.yml` es la red de seguridad.
- **Rebase and merge** (default per [ADR-0026](../../decisions/0026-git-workflow-github-flow-con-rebase.md)): preserva commits individuales. El workflow corre por cada commit pusheado a main individualmente: como cada uno es CC válido y el script es idempotente, no hay duplicación.
- **Tests embebidos vs vitest**: el archivo `scripts/_test-append-changelog.ts` usa `bun` directo sin vitest API porque vitest todavía no está configurado para `scripts/` (esa setup vive en US-T01-f). Cuando aterrice US-T01, el archivo se renombra a `scripts/append-changelog.test.ts` y se reescribe con `describe`/`it`/`expect`.
- **`CHANGELOG.md` limpio**: la sección `[Unreleased]` quedó vacía (sólo header). El script crea subsecciones `### Added` / `### Changed` / etc. on-demand cuando aterriza el primer bullet de cada tipo.
- **Identidad del bot**: por defecto `github-actions[bot]`. Si querés que aparezca como vos, setear `commit_user_name` + `commit_user_email` en el step. No relevante para nuestro caso.
- **Detached HEAD durante checkout 0 fetch-depth**: la action checkoutea el SHA específico del head_commit, no el branch. `git rev-parse HEAD` y `git log -1` funcionan igual. `git remote get-url origin` no funciona en ese estado, pero el script usa `GITHUB_SERVER_URL`/`GITHUB_REPOSITORY` env vars de GHA, así que el fallback no se necesita en CI.

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- ADRs: [ADR-0037](../../decisions/0037-changelog-automation-auto-append.md), [ADR-0038](../../decisions/0038-release-and-versioning-policy.md), [ADR-0026](../../decisions/0026-git-workflow-github-flow-con-rebase.md)
- Convenciones: [docs/testing/conventions.md](../../testing/conventions.md)
- PR title validator: https://github.com/amannn/action-semantic-pull-request
- git-auto-commit-action: https://github.com/stefanzweifel/git-auto-commit-action
- Keep a Changelog: https://keepachangelog.com/en/1.1.0/
