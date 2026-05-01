# US-T04-b: Backend architecture tests con NetArchTest

**Status**: Done (shipped en branch `feat/t04-backend-architecture-tests`)
**Sprint**: S1
**Epic**: [EPIC-00 — Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: Medium
**Effort**: S
**UC**: —
**ADR refs**: [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md), [ADR-0014](../../decisions/0014-arquitectura-modular-monolith.md), [ADR-0017](../../decisions/0017-persistence-ignorance.md)

## Como dev, quiero tests de arquitectura que enforcen los boundaries del modular monolith para que las reglas de ADRs no dependan de memoria humana

Las reglas duras del modular monolith vivían sólo en CLAUDE.md y ADRs. Si alguien (humano o agente) rompía una, dependíamos de code review para atraparlo. NetArchTest convierte cada regla en un test que falla en CI.

## Acceptance Criteria

- [x] Nuevo proyecto `backend/tests/Planb.ArchitectureTests/Planb.ArchitectureTests.csproj` con xUnit + Shouldly + NetArchTest.Rules.
- [x] Package `NetArchTest.Rules` v1.3.2 agregado a `Directory.Packages.props`.
- [x] `Planb.sln` incluye el proyecto.
- [x] 7 tests cubriendo:
  - [x] `Identity_Domain_does_not_reference_EntityFrameworkCore` — persistence ignorance (ADR-0017).
  - [x] `Identity_Domain_does_not_reference_AspNetCore` — domain no sabe HTTP.
  - [x] `Identity_Domain_does_not_reference_Wolverine` — domain no sabe del bus.
  - [x] `Identity_handlers_do_not_reference_EntityFrameworkCore` — handlers usan repos/UoW, no DbContext directo.
  - [x] `Identity_endpoints_do_not_reference_EntityFrameworkCore` — endpoints son thin (ADR-0016).
  - [x] `Identity_assemblies_do_not_reference_other_module_internals` — forward-looking: cuando aterricen academic/reviews/etc, atrapamos acoplamiento accidental.
  - [x] `Identity_Domain_aggregates_and_VOs_are_sealed` — convención del dominio.
- [x] Cada test, al fallar, imprime los tipos infractores via helper `FailureMessage`.
- [x] `dotnet test` global corre Architecture (no necesita filter especial).
- [x] CI sin cambios — los tests entran al `dotnet test` existente del workflow.
- [x] 7/7 verde local: `dotnet test tests/Planb.ArchitectureTests/...` → 7/7.

### Out of scope (intencional)

- [ ] **`DateTime.UtcNow` direct usage**: necesita inspección de method bodies, no posible con NetArchTest puro. Queda como nota en `docs/testing/conventions.md` + se chequea en review hasta que tengamos un Roslyn analyzer custom.
- [ ] **Result/Result<T> return types en aggregates**: parecido al anterior, requiere semantic analysis. Convención por code review.
- [ ] **Forward-looking modules** (academic, reviews, moderation, enrollments): cuando esos módulos tengan código real, replicar las mismas reglas con `Planb.<M>.*` assemblies. Por ahora sólo identity tiene código.

## Sub-tasks

- [x] Crear `Planb.ArchitectureTests.csproj` con references al Domain + Application + Infrastructure de identity + Host.
- [x] Agregar `NetArchTest.Rules` a `Directory.Packages.props` (v1.3.2; latest disponible).
- [x] Implementar 7 tests en `ModuleBoundariesTests.cs`.
- [x] Helper `FailureMessage(TestResult, explanation)` que imprime los tipos infractores claramente.
- [x] Verificar que el código actual pasa todos los tests.
- [x] Update `Planb.sln`.
- [x] Commit: `test(backend): NetArchTest rules para boundaries del modular monolith (US-T04)`.

## Notas de implementación

- **NetArchTest no inspecciona bodies**: puede ver dependencias, herencia, namespaces. Las reglas que requieren body inspection (DateTime.UtcNow direct calls, throw vs Result, etc.) se documentan en conventions.md como "se chequea en review" hasta que justifiquemos el costo de un Roslyn analyzer custom.
- **Carter + Microsoft.AspNetCore en Application**: los endpoints Carter SÍ referencian `Microsoft.AspNetCore.Routing`. Por eso la regla "Application no referencia AspNetCore" sería falsa-positiva. La rule fina es "endpoints no inyectan DbContext", que sí captura el bug que nos importa.
- **Forward-looking cross-module test**: itera sobre prefixes `Planb.Academic`, `Planb.Reviews`, etc. (que hoy no existen como código real). El test pasa porque no hay deps. Cuando aterrice el primer módulo, cualquier import accidental cross-module se atrapa de entrada sin requerir actualización del test.
- **Aggregate sealed convention**: Domain types públicos en `Planb.Identity.Domain.Users` que sean clases no abstractas deben ser sealed. Esto es la convención DDD estándar (aggregates encapsulan invariantes; herencia los rompe). Si un caso genuinamente legítimo aparece, la nota en el código indica cómo manejar la excepción.
- **Versión NetArchTest**: 1.3.2 es la última disponible en NuGet. Inicialmente puse 1.4.4 (lo que el CHANGELOG del repo upstream menciona como WIP) pero nuget.org no la tiene. Ajustado.

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- ADRs: [ADR-0014](../../decisions/0014-arquitectura-modular-monolith.md), [ADR-0015](../../decisions/0015-wolverine-como-mediator-y-message-bus.md), [ADR-0017](../../decisions/0017-persistence-ignorance.md), [ADR-0030](../../decisions/0030-cross-bc-consistency-via-wolverine-outbox.md), [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md)
- Convenciones: [docs/testing/conventions.md](../../testing/conventions.md)
- NetArchTest: https://github.com/BenMorris/NetArchTest
