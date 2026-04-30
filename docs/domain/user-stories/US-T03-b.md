# US-T03-b: Backend unit test layer split

**Status**: Backlog
**Sprint**: TBD
**Epic**: [EPIC-00 — Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: Medium
**Effort**: M (per módulo); empezar por identity
**UC**: —
**ADR refs**: [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md), [ADR-0027](../../decisions/0027-integration-tests-shared-postgres.md)

## Como dev, quiero un layer de unit tests separado del integration en backend para que el feedback loop del dominio no tenga el costo de Postgres

Hoy todo el testing backend vive en `Planb.IntegrationTests`. Lo que no debería estar ahí: lógica de dominio pura (entidades, VOs, errors) y handlers de Wolverine que se pueden testear con mocks. Sin esa separación, refactorear el dominio cuesta caro: cada cambio menor dispara la suite integration entera (que arranca DB, monta WebAppFactory, etc).

[ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md) define la pirámide con domain unit y handler unit como capas separadas. Este US implementa la separación, **un módulo a la vez**. Empezamos por identity (más maduro) y replicamos el patrón cuando los demás módulos necesiten testing.

## Acceptance Criteria

### Para identity (primer módulo a migrar)

- [ ] Nuevo proyecto `backend/modules/identity/tests/Planb.Identity.UnitTests/Planb.Identity.UnitTests.csproj`.
- [ ] Layout interno:
  - [ ] `Domain/Users/UserTests.cs` (cubre entidad `User`, VOs, métodos del aggregate)
  - [ ] `Domain/Users/EmailAddressTests.cs`
  - [ ] `Domain/Users/UserErrorsTests.cs` (si tiene lógica)
  - [ ] `Application/Features/Register/RegisterUserCommandHandlerTests.cs`
  - [ ] `Application/Features/SignIn/SignInCommandHandlerTests.cs`
  - [ ] `Application/Features/RequestPasswordReset/RequestPasswordResetCommandHandlerTests.cs`
  - [ ] `Application/Features/ResetPassword/ResetPasswordCommandHandlerTests.cs`
- [ ] Stack del proyecto: xUnit + Shouldly + NSubstitute, central en `Directory.Packages.props`.
- [ ] Tests que **no requieren** Postgres / Redis / Mailpit migran de `Planb.IntegrationTests` a `Planb.Identity.UnitTests` (no se duplican).
- [ ] Tests que **sí** los requieren se quedan en `Planb.IntegrationTests` (endpoints, repos EF, queries Dapper).
- [ ] `dotnet test` corre las tres suites (Unit + Integration + Architecture cuando exista) con un solo comando.
- [ ] `Planb.sln` incluye el proyecto nuevo.
- [ ] `Justfile` agrega recipes `backend-test-unit` y `backend-test-integration` que filtran por proyecto.
- [ ] CI sin cambios (sigue siendo `dotnet test` global).
- [ ] `backend/CLAUDE.md` actualizado con el layout nuevo (ya tiene la sección Testing apuntando a layout post-T03; verificar que cierra).

### Para los demás módulos (academic, reviews, moderation, enrollments)

- [ ] Cada módulo tiene su `Planb.<Module>.UnitTests` cuando empieza a tener tests reales. No es necesario crear el proyecto vacío de antemano.
- [ ] Cuando aterrice la primera US no trivial de un módulo, ese US se hace cargo de crear su unit project siguiendo el patrón de identity.

## Sub-tasks

- [ ] Crear `Planb.Identity.UnitTests.csproj` con references al Domain + Application del módulo.
- [ ] Mover de `Planb.IntegrationTests` los tests que son puramente domain/handler unit. Identificar candidatos:
  - [ ] Tests de `User` que no levantan DbContext.
  - [ ] Tests de validators que no necesitan FluentValidation pipeline real.
  - [ ] Tests de tokens/passwords/policies del dominio.
- [ ] Escribir nuevos tests de handler unit para los 4 features actuales de identity (register, sign-in, forgot-password, reset-password) si no existen ya. Apuntar a 80% del comportamiento de cada handler.
- [ ] Update `Planb.sln`.
- [ ] Update `Directory.Packages.props` si hace falta agregar packages.
- [ ] Update `Justfile`: `backend-test-unit` filtra `--filter Category=Unit` o por proyecto.
- [ ] Verificar `just ci` y CI siguen verdes.
- [ ] Update `backend/CLAUDE.md` y `docs/testing/conventions.md` con cualquier detalle no previsto.
- [ ] Commit: `test(identity): split unit tests from integration (US-T03)`.

## Notas de implementación

- **La regla "no mockees lo que no posees"** ([ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md)): los unit tests no mockean Postgres ni HttpContext. Eso queda para integration. Los unit tests sí mockean `IUserRepository`, `IRefreshTokenStore`, `IRateLimiter`, `IDateTimeProvider`, etc.
- **`IDateTimeProvider`**: para domain tests, usar un `FakeClock` simple en vez de NSubstitute. Más legible. Reutilizable cross-test.
- **`Microsoft.AspNetCore.Mvc.Testing` no se incluye** en `Planb.Identity.UnitTests` — es para integration.
- **Categorías xUnit**: opcionalmente `[Trait("Category", "Unit")]` y `[Trait("Category", "Integration")]` para que `dotnet test --filter Category=Unit` funcione transparente. La separación por proyecto ya cumple lo mismo, las categorías son alternativa.
- **Para mover tests existentes**, primero validar que no acceden a `WebApplicationFactory` ni a `DbContext`. Si lo hacen, refactor primero (extraer la lógica testeable) o quedan en integration.

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- ADRs: [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md), [ADR-0027](../../decisions/0027-integration-tests-shared-postgres.md)
- Convenciones: [docs/testing/conventions.md](../../testing/conventions.md)
