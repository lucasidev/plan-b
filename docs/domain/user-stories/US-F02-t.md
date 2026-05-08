# US-F02-t: Tooling (Justfile, Lefthook, Conventional Commits)

**Status**: Done
**Sprint**: S0 (pre-sprint)
**Epic**: [EPIC-00: Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: High
**Effort**: S
**UC**: 
**ADR refs**: ADR-0024, ADR-0026

## Como dev, quiero tooling consistente para que los comandos comunes y los git hooks sean los mismos en cada máquina

Como solo-dev y futuros colaboradores, quiero un Justfile con todas las operaciones comunes (`just dev`, `just test`, `just lint`, `just ci`, `just migrate`) y Lefthook con git hooks (commit-msg via Conventional Commits, pre-commit con lint) para no depender de memoria ni de scripts manuales.

## Acceptance Criteria

- [x] `Justfile` en raíz con tasks: `setup`, `dev`, `dev-backend`, `dev-frontend`, `test`, `lint`, `lint-fix`, `migrate`, `infra-up`, `infra-reset`, `ci`.
- [x] `lefthook.yml` con commit-msg hook que valida Conventional Commits via `bun scripts/check-commit-msg.ts`.
- [x] Pre-commit hook corre lint sobre files modificados.
- [x] Scripts en TypeScript ejecutados con bun (no bash), por consistencia.
- [x] `just setup` instala todo desde cero en una máquina nueva.
- [x] `just ci` corre las mismas gates que GitHub Actions.

## Sub-tasks

- [x] Escribir Justfile con tasks principales
- [x] Configurar lefthook con commit-msg + pre-commit
- [x] Implementar `scripts/check-commit-msg.ts` validando types y formato
- [x] Documentar tasks en `CLAUDE.md`

## Notas de implementación

- **Scripts en TypeScript, no bash**: regla cross-cutting del repo. Bun ejecuta scripts TS directo, sin compilación previa, y evita inconsistencias entre Windows / Mac / Linux que aparecen con bash. Documentado en `CLAUDE.md`.
- **Conventional Commits enforceado en commit-msg**: Lefthook corre `bun scripts/check-commit-msg.ts`. El parser valida formato `type(scope): descripción` y rechaza tipos fuera del catálogo (feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert). El feedback rápido evita rebases por mensajes mal formateados.
- **`just ci` espeja CI**: cualquier diferencia entre local y GitHub Actions es bug de configuración. Mantener paridad simplifica debug "anda en local rompe en CI".

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- Use Case: ninguno.
- ADRs: [ADR-0024](../../decisions/0024-dev-tooling-stack.md), [ADR-0026](../../decisions/0026-git-workflow-github-flow-con-rebase.md)
