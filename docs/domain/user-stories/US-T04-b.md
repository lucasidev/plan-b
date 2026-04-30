# US-T04-b: Backend architecture tests con NetArchTest

**Status**: Backlog
**Sprint**: TBD
**Epic**: [EPIC-00 — Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: Medium
**Effort**: S
**UC**: —
**ADR refs**: [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md), [ADR-0014](../../decisions/0014-arquitectura-modular-monolith.md), [ADR-0017](../../decisions/0017-persistence-ignorance.md)

## Como dev, quiero tests de arquitectura que enforcen los boundaries del modular monolith para que las reglas de ADRs no dependan de memoria humana

Tenemos 5 reglas duras que viven sólo en CLAUDE.md y ADRs:

- Endpoints no inyectan `DbContext` (ADR-0014).
- Domain no referencia EF Core ni `Microsoft.AspNetCore.*` (ADR-0017).
- Application no referencia `Microsoft.AspNetCore.*`.
- Aggregates entre módulos viajan sólo por integration events (Wolverine), no por nav cross-module ([ADR-0030](../../decisions/0030-cross-bc-consistency-via-wolverine-outbox.md)).
- Nadie usa `DateTime.UtcNow` directo (todos vía `IDateTimeProvider`).
- Errores de negocio van por `Result<T>`, no `throw` ([ADR-0015](../../decisions/0015-wolverine-como-mediator-y-message-bus.md)).

Hoy, si un dev (o agente) rompe alguna, la atrapamos en review si miramos. Si no, queda. NetArchTest convierte cada regla en un test que falla en CI.

## Acceptance Criteria

- [ ] Nuevo proyecto `backend/tests/Planb.ArchitectureTests/Planb.ArchitectureTests.csproj`.
- [ ] Package `NetArchTest.Rules` agregado a `Directory.Packages.props`.
- [ ] Tests cubriendo:
  - [ ] `Endpoints_DoNotInjectDbContext` — clases `*Endpoint` no tienen dependency en `Microsoft.EntityFrameworkCore.DbContext`.
  - [ ] `Domain_DoesNotReferenceEFCore` — assembly `Planb.<Module>.Domain` no referencia `Microsoft.EntityFrameworkCore.*`.
  - [ ] `Domain_DoesNotReferenceAspNetCore` — assembly `Planb.<Module>.Domain` no referencia `Microsoft.AspNetCore.*`.
  - [ ] `Application_DoesNotReferenceAspNetCore` — assembly `Planb.<Module>.Application` no referencia `Microsoft.AspNetCore.*` (salvo `Microsoft.AspNetCore.Http` que Carter expone, ver TBD en notes).
  - [ ] `NoDirectDateTimeUtcNow` — código fuera de `Planb.SharedKernel.Abstractions.Clock` no contiene `DateTime.UtcNow` (regex check, no NetArchTest puro; usar `Roslyn` analyzers o test custom si hace falta).
  - [ ] `Domain_AggregateMethodsReturnResult` — métodos públicos de aggregates retornan `Result` o `Result<T>`, no `void` ni `Task<X>` directo (si esto se vuelve restrictivo, delegamos a guideline en lugar de test).
  - [ ] `CrossModule_NoNavigationProperties` — entidades de un módulo no tienen propiedades navigation a entidades de otro módulo (ADR-0017 / 0030). Esto se chequea por convención de namespace: `Planb.Identity.Domain.*` no tiene properties de tipo `Planb.Academic.*`, etc.
- [ ] Cada test, al fallar, imprime los tipos infractores claramente.
- [ ] `Planb.sln` incluye el proyecto.
- [ ] `dotnet test` global corre Architecture (no necesita filter especial).
- [ ] CI sin cambios — los tests entran al `dotnet test` existente.
- [ ] `docs/testing/conventions.md` y `backend/CLAUDE.md` actualizados con cualquier nueva regla.

## Sub-tasks

- [ ] Crear `Planb.ArchitectureTests.csproj` con references a todos los assemblies del backend.
- [ ] Agregar `NetArchTest.Rules` a `Directory.Packages.props` y al csproj.
- [ ] Implementar los 5-7 tests listados arriba.
- [ ] Si `DateTime.UtcNow` necesita un check fuera del scope de NetArchTest (porque NetArchTest no inspecciona método bodies), implementar con `Microsoft.CodeAnalysis` (Roslyn) en un test separado, o caer back a una regla manual reportada en review.
- [ ] Verificar que el código actual pasa todos los tests. Si alguno falla, **eso es un bug**: lo corregimos antes de mergear.
- [ ] Documentar cómo agregar una regla nueva en `docs/testing/conventions.md`.
- [ ] Commit: `test(backend): NetArchTest rules para boundaries del modular monolith (US-T04)`.

## Notas de implementación

- **NetArchTest no inspecciona bodies**: no puede ver "este método llama a `DateTime.UtcNow`". Inspecciona referencias, herencia, namespaces. Para reglas que requieren body inspection (DateTime.UtcNow direct calls, throw vs Result, etc.), considerar:
  - Regex-based test que escanea archivos `.cs` (rápido y suficiente para casos simples).
  - Roslyn analyzer custom (más robusto pero más infra).
  - Para arrancar, regex está bien; refactor a Roslyn si pintamos restrictivo.
- **Excepciones documentadas**: si una regla tiene una excepción legítima (e.g. un endpoint que SÍ necesita DbContext porque es un health check transaccional), se whitelistea explícitamente con un attribute custom (`[ArchitectureRuleException("razón")]`) y se chequea en el test.
- **Empezar mínimo**: 3 reglas duras al primer commit del US, las otras se agregan en sucesivos micro-PRs si emergen como problemas. No hay que enforcear todo al día uno.
- **Performance**: NetArchTest es rápido (~50-100ms por test, lee assemblies en memoria). No es un problema en CI.

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- ADRs: [ADR-0014](../../decisions/0014-arquitectura-modular-monolith.md), [ADR-0015](../../decisions/0015-wolverine-como-mediator-y-message-bus.md), [ADR-0017](../../decisions/0017-persistence-ignorance.md), [ADR-0030](../../decisions/0030-cross-bc-consistency-via-wolverine-outbox.md), [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md)
- Convenciones: [docs/testing/conventions.md](../../testing/conventions.md)
- NetArchTest: https://github.com/BenMorris/NetArchTest
