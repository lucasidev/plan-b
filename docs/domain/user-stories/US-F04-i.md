# US-F04-i: CI baseline GitHub Actions

**Status**: Done
**Sprint**: S0 (pre-sprint)
**Epic**: [EPIC-00: Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: High
**Effort**: M
**UC**: 
**ADR refs**: ADR-0024, ADR-0026, ADR-0027

## Como dev, quiero CI verde como gate para que ningún PR mergee sin tests + lint + build

Como solo-dev defendiendo el `main`, quiero GitHub Actions corriendo en cada PR las mismas gates que `just ci`: lint (Biome + dotnet format), build (dotnet + bun), tests (unit + integration con Postgres + Mailpit como services), para que el branch `main` se mantenga estable sin disciplina manual.

## Acceptance Criteria

- [x] Workflow `.github/workflows/ci.yml` corre en cada PR a `main`.
- [x] Job backend: `dotnet build` + `dotnet test` con Postgres + Mailpit como GitHub Actions services.
- [x] Job frontend: `bun install` + `bun lint` + `bun test` + `bun build`.
- [x] Cache de paquetes (NuGet + bun) configurado.
- [x] Required check en branch protection: PR no puede mergear si CI no está verde.
- [x] Tiempo total < 8 min en path optimista.

## Sub-tasks

- [x] Escribir workflow YAML con jobs paralelos
- [x] Configurar services (postgres con pgvector, mailpit)
- [x] Setup caching (NuGet + bun)
- [x] Configurar branch protection en GitHub

## Notas de implementación

- **Postgres y Mailpit como GitHub Actions services**: corren al lado del job, mismos puertos que en local. ADR-0027 pide DB real en integration tests, no testcontainers ni mocks. Más fidelidad, menos magia.
- **Branch protection con required check**: ADR-0026 no permite push directo a `main`. Sin CI verde, GitHub no permite mergear. La gate es estructural, no convenida.
- **Cache de NuGet + bun**: el path crítico de CI es restore + build de .NET. Cache hit típico baja a < 8 min total. Si crece más, separar el job en restore vs test podría ahorrar.

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- Use Case: ninguno.
- ADRs: [ADR-0024](../../decisions/0024-dev-tooling-stack.md), [ADR-0026](../../decisions/0026-git-workflow-github-flow-con-rebase.md), [ADR-0027](../../decisions/0027-integration-tests-shared-postgres.md)
