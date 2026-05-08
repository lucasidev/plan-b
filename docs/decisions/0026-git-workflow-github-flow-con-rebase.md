# ADR-0026: Git workflow (GitHub Flow con Rebase/Squash; OneFlow diferido)

- **Estado**: aceptado
- **Fecha**: 2026-04-24

## Contexto

El proyecto vive en GitHub como repositorio único. El flow de desarrollo necesita definir tres cosas:

1. Estrategia de branching.
2. Estrategia de merge al integrar PRs.
3. Cuándo migrar a un flow más pesado, si corresponde.

Los patrones relevantes considerados:

- **GitHub Flow**: un branch `main` long-lived, feature branches cortos, PRs, merge vía rebase o squash. Pensado para trunk-based dev con deploys continuos.
- **OneFlow** (Adam Ruka): `main` long-lived + feature/release/hotfix branches. Merge con `--no-ff` después de rebase local. Buena trazabilidad de feature-as-a-unit.
- **GitFlow** (Vincent Driessen): `main` + `develop` long-lived + feature/release/hotfix. Pensado para releases formales versionados con QA en `develop`.

## Decisión

**GitHub Flow durante Fases 1-5 del cronograma.** **Migrar a OneFlow al entrar en Fases 6-7** (focus group cerrado + lanzamiento público con releases formales).

### Merge strategy actual

- **Rebase and merge** por default. Historia lineal, cada commit del PR queda en `main` con hash nuevo. Ideal para PRs con commits atómicos bien escritos.
- **Squash and merge** cuando el PR tiene commits WIP (ej. muchos "fix", "wip", "try again") que no vale la pena preservar.
- **No usar "Create a merge commit"** en esta fase. PRs son chicos; el merge commit wrapper suma ruido sin ganancia de trazabilidad.

### Convención de branch naming

Formato: `<type>/<scope>-<short-description>` alineado con Conventional Commits.

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Ejemplos válidos:
- `feat/identity-register`
- `fix/moderation-cascade-bug`
- `docs/adr-git-workflow`
- `chore/bump-wolverine`

**No incluir US numbers en el branch name.** El branch name describe el cambio técnico (scope); las US se referencian en el commit body y/o PR body. `feat/us033-forgot-password` o `feat/t04-architecture-tests` son inválidos: el reemplazo es `feat/identity-forgot-password`, `feat/backend-architecture-tests`. Ver `docs/operations/git-workflow.md` para tabla de anti-patterns y la bitácora operacional completa.

### Convención de commit message

Conventional Commits (`type(scope): descripción`), enforceado por lefthook commit-msg hook (`scripts/check-commit-msg.ts`). Ver [ADR-0024](0024-dev-tooling-stack.md).

`pr-title.yml` enforce el subject pattern `^(?![A-Z]).+$`: el subject empieza en minúscula. Si el primer token sería un nombre propio (`Playwright`, `NetArchTest`, `React`), reformular la frase. No es overhead arbitrario: si se squashea, el PR title pasa a ser el commit en `main` y alimenta el CHANGELOG.

### Cuándo migrar a OneFlow

Al entrar en fase de release formal (Fase 6-7 del cronograma):

- Aparecen `release/<version>` branches cuando se prepara un lanzamiento.
- Aparecen `hotfix/<issue>` branches desde tags de release para arreglos urgentes en prod.
- Merge strategy cambia a **"Create a merge commit"** en GitHub (con pre-rebase local de la rama sobre `main`), porque ahí sí vale la pena preservar la topología: saber qué PR introdujo qué cambio en qué release es operativamente útil cuando hay usuarios reales.

La migración será un ADR nuevo que supersede este.

## Alternativas consideradas

### A. OneFlow desde el inicio

Tiene ventajas reales: trazabilidad de feature via merge commit, revert atómico con `git revert -m 1 <merge>`, bisect con `--first-parent` para aislar PRs problemáticos.

Descartada para MVP porque:

- **Solo-dev.** La metadata "qué commits fueron un PR" vale menos cuando una sola persona escribe todo y el contexto está fresco.
- **Sin releases formales aún.** Los conceptos de `release/*` y `hotfix/*` son overhead sin uso.
- **PRs son chicos.** Un PR de 1-3 commits no se beneficia lo suficiente del merge commit wrapper. La diferencia entre revertir un merge commit vs revertir 3 commits es trivial en ese volumen.

### B. GitFlow

Dos branches long-lived (`main` + `develop`) + release + hotfix + feature. Pensado para equipos con QA dedicado y releases planificados.

Descartada por overkill. Un `develop` branch duplicado no aporta en MVP de un proyecto solo-dev. Históricamente Vincent Driessen (su autor) incluso retractó su recomendación para proyectos con deploy continuo.

### C. Squash siempre

Algunos equipos squashean todo PR a un solo commit uniformemente. Simple, regla única.

Descartada porque PRs con commits atómicos significativos (ej. el PR que introdujo los CLAUDE.md con rename + style tweaks separados) pierden granularidad. Rebase preserva la intención del autor cuando la separación fue deliberada.

### D. Merge commit siempre (default de GitHub)

Patrón default de la UI de GitHub. Preserva "la rama existió" pero duplica entries en `git log` plano y deja zigzags cuando hay divergencia con `main`.

Descartada: lo más ruidoso sin upside en un proyecto chico. Útil en teams grandes con feature branches long-lived, no acá.

## Consecuencias

**Positivas:**

- Historia lineal, legible en `git log` sin `--graph`.
- Regla simple y memorizable: rebase por default, squash si el PR es WIP, nunca merge commit.
- Migración futura a OneFlow es gradual: se agregan `release/*` y `hotfix/*`, se cambia el merge strategy. No hay que reescribir historia.

**Negativas:**

- Sin merge commits, no hay "marcador visible" en la topología de qué commits fueron parte de qué PR. El número del PR queda en el commit message (patrón `(#N)` que agrega GitHub) como único rastro.
- `git revert` de un PR entero requiere identificar los commits específicos involucrados, más laborioso que `git revert -m 1 <merge-commit>`. Aceptable en MVP, donde reverts son raros y los PRs son chicos.
- Si alguien mergea con "Create a merge commit" por accidente, se introduce ruido en la historia. Mitigación: convención documentada acá + educación; si pasa, se puede fixear con un rebase+force-push mientras no haya branch protection.

**Cuándo revisitar:**

- Al arrancar Fase 6 (focus group cerrado) o Fase 7 (lanzamiento público), se escribe ADR nuevo que supersede este con:
  - Adopción de `release/<version>` branches al preparar lanzamiento.
  - Adopción de `hotfix/<issue>` branches desde tags de release.
  - Cambio de merge strategy a "Create a merge commit" para preservar topología de releases.
  - Tags semver formales.

Relacionados: [ADR-0024](0024-dev-tooling-stack.md) (tooling incluye Conventional Commits via lefthook).

**Operacional:** [`docs/operations/git-workflow.md`](../operations/git-workflow.md) es la bitácora paso a paso del flow (commit / branch / conflict / merge). El ADR define la decisión + rationale; el doc operacional define el cómo. Si el doc se contradice con este ADR, gana el ADR; el doc se actualiza.
