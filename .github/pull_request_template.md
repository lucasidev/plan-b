<!--
PR title: debe seguir Conventional Commits — el título es el commit message si mergeás con Squash, y release-please lo usa para generar el CHANGELOG.

  Formato: <type>(<scope>): <descripción>
  Types:   feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
  Scope:   identity, academic, reviews, moderation, enrollments, frontend, infra, etc.

  Ejemplos:
    feat(identity): forgot-password backend (US-033-i)
    fix(frontend): banner reset success no se descarta en mobile
    docs: ADR-0036 testing pyramid

Rebase and merge es el default (ADR-0026). Squash and merge sólo si tu PR tiene commits WIP que no aportan al history.
-->

## Resumen

<!-- 1-3 oraciones explicando qué cambia y por qué. Si el PR cierra una US, link directo a la US. -->

Closes US-NNN-x.

## Cambios principales

<!-- Bullets concretos. Si tu cambio toca varias capas, agrupá por capa. -->

-

## Tests

<!--
Tildá lo que aplica al PR. Si no aplica, dejalo unchecked y explicá por qué en "Notas".
Si una capa relevante NO tiene test, eso debe estar explícito acá — no lo escondas.
Convenciones: docs/testing/conventions.md.
-->

### Backend

- [ ] **Domain unit** (xUnit + Shouldly) — entidades / VOs / errors tocados
- [ ] **Handler unit** (xUnit + NSubstitute) — handler / validator / command / query nuevo o modificado
- [ ] **Integration** (xUnit + WebAppFactory) — endpoint / repo EF / Dapper query / DI wiring
- [ ] **Architecture** (NetArchTest) — regla de boundary nueva o modificada
- [ ] No aplica (cambio puramente de docs / config / cosmético)

### Frontend

- [ ] **Utils / Schemas** (vitest) — helper en `lib/` / Zod schema
- [ ] **Server Action** (vitest + fetch mockeado) — action nuevo o modificado
- [ ] **Component** (vitest + Testing Library) — componente cliente / hook / formulario
- [ ] **E2E** (Playwright) — user flow nuevo o crítico
- [ ] No aplica (cambio puramente de docs / config / cosmético)

## Probado manualmente end-to-end

<!--
Honestidad antes que aparentar — la regla de no merguear cosas untested aplica especialmente
al frontend, donde el coverage automatizado todavía está en construcción (US-T01, T02).
-->

- [ ] Sí, levanté el feature (`just dev` + browser) y verifiqué los acceptance criteria de la US.
- [ ] No (build/lint verdes ≠ "funciona"). Detallar qué falta probar abajo.

**Detalle**:

<!-- e.g. "probé el happy path con Lucía; los error states los cubre el integration test pero no los eyeballeé en browser" -->

## Breaking changes / migraciones

<!--
Si hay breaking, agregar línea `BREAKING CHANGE: descripción` en el body del primer commit relevante.
El marker se conserva en el CHANGELOG con un tag **(BREAKING)** (ADR-0037).
Versioning (semver/calver/...) está deferred hasta primer deploy / Fase 6, así que un BREAKING
hoy no bumpea versión: marca el cambio para que el reviewer y el changelog lo vean explícito.
-->

- [ ] Sin breaking changes.
- [ ] Tiene breaking changes (detallar abajo).
- [ ] Tiene migraciones EF Core nuevas (run `just migrate` antes de mergear / al deploy).

**Detalle**:

## Notas para el reviewer

<!--
Cualquier contexto que ayude a leer el diff: por dónde empezar, qué archivo es el "core"
del cambio, decisiones que ameritan discutir, deuda técnica que se asume.

Si abriste deuda técnica nueva (TODO, FIXME, "esto se arregla en US-XYZ"), linkear acá.
-->

-

## Pre-merge checklist

- [ ] CI verde
- [ ] Tests del PR pasan localmente (`just ci`)
- [ ] Conventional Commit format en cada commit (Lefthook lo enforcea local; CI lo enforcea en PR title si es Squash)
- [ ] ADRs nuevos / actualizados linkeados desde la US relevante o este PR
- [ ] No commiteé secrets, archivos de IDE, ni `.env`

<!--
Después del merge, un workflow GHA appendea el commit a la sección [Unreleased] del CHANGELOG.md
a partir del Conventional Commit. No edites CHANGELOG.md a mano (ADR-0037).
-->
