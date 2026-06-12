# US-T07-b: Architecture tests para los 5 modulos del monolito (Academic, Reviews, Moderation, Enrollments)

**Status**: Sprint Backlog
**Sprint**: S6
**Epic**: [EPIC-00: Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: Medium
**Effort**: S
**UC**:
**ADR refs**: [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md), [ADR-0014](../../decisions/0014-arquitectura-modular-monolith.md), [ADR-0017](../../decisions/0017-persistence-ignorance.md)

## Como dev, quiero architecture tests que cubran los 5 modulos del monolito para que los boundaries del ADR-0014 fallen en CI cuando se rompan, sin depender de code review

US-T04-b introdujo `Planb.ArchitectureTests` con 7 reglas para el modulo Identity. Los otros 4 modulos (Academic, Reviews, Moderation, Enrollments) ya tienen codigo real desde los slices de S2-S5 y no tienen coverage de reglas de arquitectura: un endpoint que inyecte `DbContext` directamente, o un handler que referencie `Microsoft.AspNetCore.*`, pasaria CI sin ninguna alarma.

El costo de replicar las 7 reglas por modulo es bajo (NetArchTest es declarativo) y el beneficio es permanente: cada nuevo modulo que se agregue puede copiar el patron.

## Acceptance Criteria

- [ ] `Planb.ArchitectureTests.csproj` agrega referencias a Domain + Application + Infrastructure de los 4 modulos nuevos (Academic, Reviews, Moderation, Enrollments). Hoy solo referencia Identity + Host.
- [ ] Por cada uno de los 4 modulos, 7 tests en verde:
  - [ ] `<Module>_Domain_does_not_reference_EntityFrameworkCore`
  - [ ] `<Module>_Domain_does_not_reference_AspNetCore`
  - [ ] `<Module>_Domain_does_not_reference_Wolverine`
  - [ ] `<Module>_Handlers_do_not_reference_EntityFrameworkCore`
  - [ ] `<Module>_Endpoints_do_not_reference_EntityFrameworkCore`
  - [ ] `<Module>_Assemblies_do_not_reference_other_module_internals`
  - [ ] `<Module>_Domain_aggregates_and_VOs_are_sealed`
- [ ] Total tests tras este US: 35 (7 existentes de Identity + 28 nuevos). Todos en verde en `dotnet test`.
- [ ] Si un test revela una violacion existente del modulo en cuestion, se abre como deuda separada (no se corrige en este US para no ampliar scope) y el test se marca con `Skip` temporal con un comentario que referencia la deuda.
- [ ] CI sin cambios de config: los nuevos tests entran al `dotnet test` existente.

### Out of scope (intencional)

- [ ] Corregir violaciones que aparezcan: este US solo agrega los tests y registra lo que encuentra. Cada violacion real es su propio fix.
- [ ] Reglas que requieran body inspection (`DateTime.UtcNow` directo, `throw` en vez de `Result<T>`): NetArchTest no puede inspeccionar bodies de metodos. Quedan en conventions.md como "se chequea en review", igual que en US-T04-b.

## Sub-tasks

- [ ] Editar `Planb.ArchitectureTests.csproj`: agregar 12 `ProjectReference` (Domain + Application + Infrastructure por cada uno de los 4 modulos).
- [ ] Implementar los 28 tests nuevos. Opciones de organizacion (a criterio de implementacion):
  - Un archivo por modulo (`AcademicModuleBoundariesTests.cs`, etc.)
  - Parametrizado: un helper `AddModuleRules(string prefix)` y 4 llamadas en el archivo existente `ModuleBoundariesTests.cs`
- [ ] Correr `dotnet test tests/Planb.ArchitectureTests/` local para verificar que todos los tests nuevos pasan (o identificar violaciones a registrar como deuda).
- [ ] Si hay violaciones: abrir issue/nota de deuda en STATUS.md y agregar `[Fact(Skip = "deuda: ...")]` temporal.

## Notas de implementacion

- **Por que replicar en vez de parametrizar**: los 7 tests de Identity estan en `ModuleBoundariesTests.cs` con nombres `Identity_*`. El approach mas simple es copiar el patron 4 veces con los prefijos de namespace correspondientes (`Planb.Academic.*`, `Planb.Reviews.*`, `Planb.Moderation.*`, `Planb.Enrollments.*`). La parametrizacion es una refactor posterior si se quiere; no es objetivo de este US.
- **Forward-looking test ya existente**: el test `Identity_Assemblies_do_not_reference_other_module_internals` ya itera los prefixes de todos los modulos (aunque no tengan codigo aun cuando se escribio en S1). Los tests nuevos agregan el test en la perspectiva del modulo nuevo como emisor de dependencias cruzadas, no solo como receptor.
- **Carter + AspNetCore en Application**: la excepcion conocida de Identity aplica igual: los endpoints Carter referencian `Microsoft.AspNetCore.Routing`. La regla correcta es `Endpoints_do_not_reference_EntityFrameworkCore`, no `Application_does_not_reference_AspNetCore`. Esto esta documentado en US-T04-b y aplica a todos los modulos.
- **Sealed aggregates en Reviews**: el aggregate `Review` usa EF Core con private constructor, properties `private set`, y el patron factory. Deberia ser `sealed`. Si no lo esta al momento de implementar este US, es la violacion a registrar como deuda (trivial de corregir).

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- US base: [US-T04-b](US-T04-b.md) (architecture tests de Identity, el patron a replicar)
- ADRs: [ADR-0014](../../decisions/0014-arquitectura-modular-monolith.md), [ADR-0015](../../decisions/0015-wolverine-como-mediator-y-message-bus.md), [ADR-0017](../../decisions/0017-persistence-ignorance.md), [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md)
- Test project: [`backend/tests/Planb.ArchitectureTests/`](../../../backend/tests/Planb.ArchitectureTests/)
- Convenciones: [docs/testing/conventions.md](../../testing/conventions.md)
