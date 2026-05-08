# Backend: planb

.NET 10 modular monolith. 5 módulos (bounded contexts) + SharedKernel + Host.

Ver también [`../CLAUDE.md`](../CLAUDE.md) para contexto general y [`../docs/decisions/`](../docs/decisions/) para ADRs.

## Layout

```
backend/
├── Planb.sln                              24 csprojs
├── Directory.Build.props                  target net10.0, nullable, Minimal analysis
├── Directory.Packages.props               Central Package Management
├── global.json                            SDK 10.0.201
├── libs/shared-kernel/
│   └── src/Planb.SharedKernel/
│       ├── Primitives/                    Result<T>, Error, PagedResult
│       └── Abstractions/
│           ├── Clock/IDateTimeProvider    SystemDateTimeProvider
│           └── Messaging/IIntegrationEvent
├── host/Planb.Api/                        Program.cs con Wolverine + Carter + Serilog
└── modules/<module>/
    ├── src/
    │   ├── Planb.<Module>.Domain/         Entidades, VOs, errors, repositorios (interfaces)
    │   ├── Planb.<Module>.Application/    Features/, Contracts/, IntegrationEvents/
    │   └── Planb.<Module>.Infrastructure/ DbContext, EF configs, repos, QueryServices (Dapper)
    └── tests/Planb.<Module>.Tests/
```

## Patrón vertical slice (un feature = 6 archivos)

Cada use case en `Planb.<Module>.Application/Features/<UseCase>/`:

```
CreateReviewCommand.cs           public sealed record : ICommand<TResponse>
CreateReviewCommandHandler.cs    static methods (Wolverine). Maneja dominio.
CreateReviewValidator.cs         internal sealed class : AbstractValidator<>
CreateReviewEndpoint.cs          public sealed class : ICarterModule. Sabe HTTP.
CreateReviewRequest.cs           public sealed record (HTTP body)
CreateReviewResponse.cs          public sealed record (HTTP response)
```

Separación estricta: **endpoint sabe HTTP; handler sabe dominio**. Handler no referencia `Microsoft.AspNetCore.*`. Ver [ADR-0016](../docs/decisions/0016-carter-para-endpoints-http.md).

## Convenciones core

- **Nunca throw** para fallas de negocio: usar `Result<T>` y `Error`. Ver [ADR-0015](../docs/decisions/0015-wolverine-como-mediator-y-message-bus.md).
- **Nunca inyectar `DbContext`** en endpoints: solo `IMessageBus` de Wolverine. El endpoint dispara un command/query; el handler hace el trabajo.
- **`IDateTimeProvider.UtcNow`**, nunca `DateTime.UtcNow`. El dominio es testeable time-independiente.
- **Columnas DB en `snake_case`**. EF Core config define esto per-column.
- **Rutas API**: `/api/<modulo>/<recurso>` (ej. `/api/reviews`, `/api/identity/users`).
- **Nombres de endpoint Carter**: `<Modulo>_<UseCase>` (ej. `Reviews_CreateReview`).

## Modular monolith: reglas físicas

- **DbContext por módulo**: `IdentityDbContext`, `AcademicDbContext`, etc. Cada uno con schema propio (`identity`, `academic`, `enrollments`, `reviews`, `moderation`). Misma connection string, schemas distintos.
- **No EF navigation cross-module**: un `Review` no tiene `.Subject` cargado con JOIN. Si necesita data de Subject, el handler pide `IAcademicQueryService.GetSubjectByIdAsync(subjectId)` (de `Planb.Academic.Application.Contracts`).
- **No FKs cross-schema**: las referencias son UUIDs sin constraint. La validación se hace en el application layer. Ver [ADR-0017](../docs/decisions/0017-persistence-ignorance.md).
- **Cross-module communication**:
  - **Reads síncronos** → `Contracts/` folder con `I<Module>QueryService` interfaces (types `public sealed`).
  - **Writes async** → Wolverine integration events en `IntegrationEvents/` folder. Outbox durable nativo.
- **El host (`Planb.Api`) es el único que referencia todos los módulos** (para DI wiring).

## EF Core + Dapper split

- **Writes**: repositorios (EF Core) con aggregates. Wolverine's `[Transactional]` middleware commit automático. `IReviewRepository.AddAsync(review)` + `SaveChanges` lo hace el middleware.
- **Reads complejos**: query services con Dapper. Devuelven DTOs planos, no aggregates. `IReviewQueryService.GetForSubjectAsync(subjectId, paging)` → `ReadOnlyList<ReviewListItem>`.

Ambos viven en `Infrastructure/` del módulo. Ver [ADR-0018](../docs/decisions/0018-ef-core-writes-dapper-reads.md).

## Redis (cache + ephemeral state)

- **Source of truth siempre Postgres**. Redis es solo derivación o ephemeral.
- **Toda key tiene TTL explícito**. Convención: ≤ 30 días.
- **Casos canónicos** ([ADR-0034](../docs/decisions/0034-redis-como-cache-y-ephemeral-state.md)): refresh token revocation list, rate limiting (sliding window), idempotency keys (SETNX), hot reads cache (cache-aside), crowd insights cache. Patrones concretos (key shape, TTL, comandos, fallback) en [`docs/architecture/redis-key-patterns.md`](../docs/architecture/redis-key-patterns.md).
- **No usar Redis raw** en handlers. Cada módulo expone abstracciones específicas (`IRefreshTokenStore`, `IRateLimiter`, `ISubjectCache`) que internamente usan `IRedisConnection` de SharedKernel.
- **Degradación**: si Redis no responde, los handlers degradan (cache miss → DB; rate limiter no disponible → fail open con warning; refresh tokens no validables → 401 y user se relogea). No fallan completamente.
- **Out of scope**: pub/sub (Wolverine outbox cubre messaging), vector search (pgvector), source of truth de cualquier dato persistente.

## Tests

Convenciones detalladas en [`docs/testing/conventions.md`](../docs/testing/conventions.md). Resumen para backend:

- **Domain unit** (xUnit + Shouldly): entidades / VOs / errors. Sin mocks, sin I/O. Vive en `modules/<m>/tests/Planb.<M>.Tests/Domain/`.
- **Handler unit** (xUnit + NSubstitute + Shouldly): Wolverine handler + FluentValidation, deps mockeadas. Vive en `modules/<m>/tests/Planb.<M>.Tests/Features/<UseCase>/`.
- **Integration** (xUnit + WebApplicationFactory + Postgres/Redis/Mailpit reales): endpoints, repos EF, Dapper queries. `Planb.IntegrationTests` corre contra el Postgres compartido que levanta `just infra-up`. Cada test class crea un database propio con nombre random (`planb_<label>_<guid>`) y lo dropea al terminar: isolation real sin el costo de un container por test. Ver [ADR-0027](../docs/decisions/0027-integration-tests-shared-postgres.md).
- **Architecture** (NetArchTest, llega con US-T04): reglas de boundary cross-módulo. Falla en CI si alguien rompe la convención (e.g. endpoint inyectando `DbContext`).

Pirámide formal: [ADR-0036](../docs/decisions/0036-testing-pyramid-cross-stack.md). Regla dura: **subir un nivel sólo si el inferior no alcanza**. Una regla del dominio que se puede testear sin EF va al unit del dominio, no a integration.

Naming: archivo `<TypeUnderTest>Tests.cs`, método `Method_Scenario_ExpectedOutcome`. Ej: `Handle_EmailNotVerified_ReturnsSuccessWithoutSendingMail`.

## Stack de paquetes (central en `Directory.Packages.props`)

| Categoría | Paquetes |
|---|---|
| Messaging | `WolverineFx`, `WolverineFx.Postgresql`, `WolverineFx.EntityFrameworkCore` |
| Endpoints | `Carter` |
| Validación | `FluentValidation`, `FluentValidation.DependencyInjectionExtensions` |
| EF Core | `Microsoft.EntityFrameworkCore`, `Npgsql.EntityFrameworkCore.PostgreSQL`, `Pgvector.EntityFrameworkCore` |
| Dapper | `Dapper` |
| Cache | `StackExchange.Redis` (ADR-0034) |
| Auth | `BCrypt.Net-Next`, `System.IdentityModel.Tokens.Jwt`, `Microsoft.AspNetCore.Authentication.JwtBearer` |
| Logging | `Serilog.AspNetCore`, `Serilog.Sinks.Console` |
| Testing | `xunit`, `xunit.runner.visualstudio`, `Shouldly`, `NSubstitute`, `Microsoft.AspNetCore.Mvc.Testing`, `NetArchTest.Rules` (US-T04) |

Bumps importantes: Wolverine **5.32+** (compatible con .NET 10), `System.Security.Cryptography.Xml` pinned a **10.0.7** por CVE transitivo.

## Comandos backend-specific

```
cd backend
dotnet restore                          Restore solution
dotnet build Planb.sln                  Build
dotnet format Planb.sln                 Format
dotnet test Planb.sln                   Tests
dotnet ef migrations add <Name> --project modules/<m>/src/Planb.<M>.Infrastructure --startup-project host/Planb.Api
```

Desde root:
```
just backend-build / backend-test / backend-lint / migrate
```

## Boundaries backend

- **No** usar `throw` para business failures. `Result<T>`.
- **No** usar `DateTime.UtcNow` directo. `IDateTimeProvider.UtcNow`.
- **No** cargar EF navigation cross-module.
- **No** crear FKs cross-schema.
- **No** usar `ConfigureAwait(false)`: ASP.NET Core no tiene sync context, no hace falta.
- **No** agregar paquetes sin actualizar `Directory.Packages.props`.
