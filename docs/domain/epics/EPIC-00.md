# EPIC-00: Foundations & DevEx

**Status**: Done
**BCs involved**: all (cross-cutting)

## Capability

Trabajo fundacional pre-feature: scaffolding del modular monolith backend, scaffolding del frontend Next.js, tooling local (Justfile, Lefthook, Conventional Commits), infra local (Docker Postgres pgvector + Mailpit), CI baseline en GitHub Actions, documentación de decisiones (ADRs base 0001-0033) y formalización del modelo DDD (estratégico + táctico + epics + user stories).

Es la base sobre la que se construyen todas las demás epics. Sin esto, no hay repo en el que mergear features ni gates que validen calidad.

## User Stories

- [US-F01-b](../user-stories/US-F01-b.md): Scaffolding modular monolith backend
- [US-F01-f](../user-stories/US-F01-f.md): Scaffolding frontend Next.js
- [US-F02-t](../user-stories/US-F02-t.md): Tooling: Justfile, Lefthook, Conventional Commits
- [US-F03-i](../user-stories/US-F03-i.md): Infra local: Docker Postgres pgvector + Mailpit
- [US-F04-i](../user-stories/US-F04-i.md): CI baseline GitHub Actions
- [US-F05](../user-stories/US-F05.md): ADRs base 0001-0033
- [US-F06](../user-stories/US-F06.md): DDD formalization (strategic + tactical + epics + user stories)

## Decisiones que la condicionan

- [ADR-0014](../../decisions/0014-arquitectura-modular-monolith.md): arquitectura modular monolith
- [ADR-0015](../../decisions/0015-wolverine-como-mediator-y-message-bus.md): Wolverine como mediator
- [ADR-0016](../../decisions/0016-carter-para-endpoints-http.md): Carter para endpoints HTTP
- [ADR-0017](../../decisions/0017-persistence-ignorance.md): persistence ignorance
- [ADR-0018](../../decisions/0018-ef-core-writes-dapper-reads.md): EF Core writes, Dapper reads
- [ADR-0019](../../decisions/0019-single-nextjs-app-con-route-groups.md): single Next.js app con route groups
- [ADR-0020](../../decisions/0020-features-alineadas-con-modulos-backend.md): features alineadas con módulos backend
- [ADR-0024](../../decisions/0024-dev-tooling-stack.md): dev tooling stack
- [ADR-0025](../../decisions/0025-dotnet-10-como-runtime-target.md): .NET 10 como runtime target
- [ADR-0026](../../decisions/0026-git-workflow-github-flow-con-rebase.md): git workflow GitHub Flow con rebase
- [ADR-0027](../../decisions/0027-integration-tests-shared-postgres.md): integration tests shared Postgres
