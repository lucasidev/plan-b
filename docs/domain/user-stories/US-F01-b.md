# US-F01-b: Scaffolding modular monolith backend

**Status**: Done
**Sprint**: S0 (pre-sprint)
**Epic**: [EPIC-00: Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: High
**Effort**: L
**UC**: 
**ADR refs**: ADR-0014, ADR-0015, ADR-0016, ADR-0017, ADR-0018, ADR-0025

## Como dev, quiero el scaffolding del modular monolith para tener base sobre la que implementar features

Como tech lead solo-dev, quiero el scaffolding completo del backend (.NET 10, modular monolith con 5 módulos, Wolverine, Carter, EF Core, Dapper, shared-kernel) para que cada feature posterior se monte sobre una base consistente y persistencia-ignorant.

## Acceptance Criteria

- [x] Solution `Planb.sln` con proyectos organizados en `host/`, `libs/`, `modules/`, `tests/`.
- [x] 5 módulos creados (`identity`, `academic`, `enrollments`, `reviews`, `moderation`) con la estructura interna por capa (Domain, Application, Infrastructure, Endpoints).
- [x] Shared kernel (`Planb.SharedKernel`) con `Result<T>`, `Error`, abstracciones base.
- [x] Wolverine configurado como mediator + outbox durable.
- [x] Carter configurado para endpoints HTTP, compose en `Program.cs`.
- [x] EF Core 10 configurado para writes, Dapper para reads complejos.
- [x] Persistence ignorance respetada: dominio no referencia EF (ADR-0017).
- [x] Compila limpio con .NET 10 sin warnings.

## Sub-tasks

- [x] Crear solution y proyectos base
- [x] Configurar DI compose en `Program.cs`
- [x] Wirear Wolverine + Carter
- [x] Setear EF Core DbContext per-module + Dapper connection factory
- [x] Implementar `Result<T>` y `Error` en shared kernel
- [x] Setup project references respetando boundaries

## Notas de implementación

- **Modular monolith, no microservicios**: ADR-0014 elige un solo proceso .NET con módulos aislados por carpeta y schema Postgres. Cero overhead de network entre BCs, deploy simple, módulos extraíbles si en el futuro algún BC justifica un servicio aparte.
- **Wolverine como mediator + outbox**: cubre dos roles (handler dispatch in-process y outbox durable para integration events cross-BC). Evita el combo MediatR + biblioteca outbox separada.
- **Project references respetando boundaries**: `Planb.<Module>.Application` referencia `Planb.<Module>.Domain`, no aggregates de otros módulos. Cualquier acoplamiento cross-module pasa por `PublicContracts`.

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- Use Case: 
- ADRs: [ADR-0014](../../decisions/0014-arquitectura-modular-monolith.md), [ADR-0015](../../decisions/0015-wolverine-como-mediator-y-message-bus.md), [ADR-0016](../../decisions/0016-carter-para-endpoints-http.md), [ADR-0017](../../decisions/0017-persistence-ignorance.md), [ADR-0018](../../decisions/0018-ef-core-writes-dapper-reads.md), [ADR-0025](../../decisions/0025-dotnet-10-como-runtime-target.md)
