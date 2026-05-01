# US-T03-b: Backend unit test layer split

**Status**: Done (shipped en branch `feat/t03-backend-unit-test-split`)
**Sprint**: S1
**Epic**: [EPIC-00 — Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: Medium
**Effort**: M (parcial: cubierto identity; otros módulos cuando tengan tests)
**UC**: —
**ADR refs**: [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md), [ADR-0027](../../decisions/0027-integration-tests-shared-postgres.md)

## Como dev, quiero un layer de unit tests separado del integration en backend para que el feedback loop del dominio no tenga el costo de Postgres

[ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md) define la pirámide con domain unit y handler unit como capas separadas. Este US asegura que la separación esté implementada para identity, con cobertura de los nuevos handlers que aterrizaron en US-033.

## Estado al aterrizar (re-scope post-exploración)

Cuando arrancamos el US descubrimos que **el split estructural ya estaba**: el proyecto `Planb.Identity.Tests` (sin sufijo "Unit") ya existía con xUnit + Shouldly + NSubstitute, ProjectReferences a Domain/Application/Infrastructure, sin `Microsoft.AspNetCore.Mvc.Testing` ni `WebApplicationFactory`. Cubría:
- `Domain/Users/UserTests.cs` (Register, VerifyEmail, IssueVerificationToken, Disable, Restore, Authenticate)
- `Domain/Users/EmailAddressTests.cs`
- `Domain/Users/FixedClock.cs` (helper test-only)
- `Security/BCryptPasswordHasherTests.cs`
- `Security/RandomTokenGeneratorTests.cs`
- `Features/RegisterUserValidatorTests.cs`

El delta real fue **expandir cobertura** para los handlers + domain methods nuevos de US-033, no crear el proyecto.

## Acceptance Criteria

### Estructura

- [x] Proyecto separado `Planb.Identity.Tests` (existente) con stack xUnit + Shouldly + NSubstitute, sin dependencias de hosting/EF runtime.
- [x] Layout `Domain/<Aggregate>/`, `Features/<UseCase>/`, `Security/`.
- [x] **No se crea un nuevo proyecto** — el existente cumple el spirit del US (separación de unit/integration). Naming convención actualizada en `docs/testing/conventions.md` para reflejar `Planb.<M>.Tests` como válido (en lugar de exigir `<M>.UnitTests`).

### Cobertura para identity

- [x] `User.RequestPasswordReset` — 3 cases en `UserTests`: token issue + 30min TTL + PasswordReset purpose; invalidación de token previo activo; succeeds aún para disabled (handler decide).
- [x] `User.ResetPassword` — 9 cases en `UserTests`: happy path (consume + replace hash + raise event); fails con TokenInvalid / WrongPurpose / AlreadyConsumed / Expired / AccountDisabled / PasswordTooWeak / TokenRequired (blank).
- [x] `RequestPasswordResetCommandHandlerTests`: 5 cases. Anti-enum (malformed email, no user, unverified, disabled) + happy path con verify de mocks (UoW commit + mail enviado).
- [x] `ResetPasswordCommandHandlerTests`: 4 cases. Token no encontrado, error del aggregate (PasswordTooWeak, WrongPurpose), happy path con `Received.InOrder` validando que SaveChanges precede a RevokeAllForUserAsync.

### Verificación

- [x] `dotnet test modules/identity/tests/Planb.Identity.Tests/...` corre 72/72 verde.
- [x] `dotnet test` global del solution sigue verde (incluye Integration sin cambios).
- [x] CI sin cambios — los nuevos tests entran al `dotnet test` existente del workflow.

## Sub-tasks

- [x] Explorar estructura — descubrir que existía proyecto + algunos tests.
- [x] Re-scope al delta real (handlers nuevos de US-033 + naming convention update).
- [x] Agregar 12 domain unit tests para `User.RequestPasswordReset` + `User.ResetPassword`.
- [x] Crear `Features/RequestPasswordResetCommandHandlerTests.cs` (5 cases).
- [x] Crear `Features/ResetPasswordCommandHandlerTests.cs` (4 cases).
- [x] Update `docs/testing/conventions.md` con naming real (`Planb.<M>.Tests`).
- [x] Update `backend/CLAUDE.md` si menciona algo obsoleto.
- [x] Commit: `test(identity): handler + domain unit tests para US-033 (US-T03)`.

### Pendiente para futuro (no este US)

- [ ] Más coverage de handlers existentes (RegisterUser, SignIn, VerifyEmail, Refresh, SignOut). El patrón está demostrado con los 2 nuevos. Cuando refactor o cambio relevante toque uno de esos handlers, se le agrega test entonces.
- [ ] Replicar la estructura `Planb.<M>.Tests` para academic, reviews, moderation, enrollments cuando esos módulos empiecen a tener tests reales. Sin features ahí todavía, sería sobre-engineer.

## Notas de implementación

- **Naming `Tests` vs `UnitTests`**: el spec original del US decía `Planb.<M>.UnitTests`. Lucas ya tenía el proyecto con nombre `Planb.<M>.Tests` (sin sufijo). Mantener el nombre existente evita renombrar archivos + sln + obj/ caches; el sufijo no agrega información (todo lo que vive en `tests/` con el sufijo `Tests` es por construcción "unit + handler unit", separado de `tests/Planb.IntegrationTests/` que es la integration suite). Convención formal actualizada en conventions.md.
- **`FixedClock`**: Lucas ya tenía un `FixedClock.cs` en `Users/`. Lo reusamos en los handler tests via `using Planb.Identity.Tests.Users;`. Es un fake, no un mock — más legible que NSubstitute para `IDateTimeProvider` que sólo necesita `UtcNow`.
- **`Received.InOrder` para SaveChanges → RevokeAllForUserAsync**: el orden importa per la doc del handler ("Revoke after persistence so we don't kill sessions for a write that ended up rolled back"). El test lo verifica explícito.
- **Anti-enum testing en handler unit**: el aggregate-level `RequestPasswordReset` no chequea estado de user (succeeds for disabled), porque la decisión de "enviar mail o no" es del handler. Los 4 cases del handler test cubren la matriz: malformed email, no user, unverified, disabled (todos silent no-op) + happy path.

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- ADRs: [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md), [ADR-0027](../../decisions/0027-integration-tests-shared-postgres.md)
- Convenciones: [docs/testing/conventions.md](../../testing/conventions.md)
- Origen del scope expandido: [US-033-i](US-033-i.md) (cuyos handlers eran lo que faltaba testear).
