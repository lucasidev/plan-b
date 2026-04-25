# Backend — planb

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

- **Nunca throw** para fallas de negocio — usar `Result<T>` y `Error`. Ver [ADR-0015](../docs/decisions/0015-wolverine-como-mediator-y-message-bus.md).
- **Nunca inyectar `DbContext`** en endpoints — solo `IMessageBus` de Wolverine. El endpoint dispara un command/query; el handler hace el trabajo.
- **`IDateTimeProvider.UtcNow`**, nunca `DateTime.UtcNow`. El dominio es testeable time-independiente.
- **Columnas DB en `snake_case`**. EF Core config define esto per-column.
- **Rutas API**: `/api/<modulo>/<recurso>` (ej. `/api/reviews`, `/api/identity/users`).
- **Nombres de endpoint Carter**: `<Modulo>_<UseCase>` (ej. `Reviews_CreateReview`).

## Modular monolith — reglas físicas

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

## Tests

- **Unit**: xUnit + NSubstitute + Shouldly. Apuntan a Domain y Application. Mockeo de repositorios y query services.
- **Integration**: `Planb.IntegrationTests` corre contra el Postgres compartido que levanta `just infra-up`. Cada test (o test class, para `WebApplicationFactory`) crea un database propio con nombre random (`planb_<label>_<guid>`) y lo dropea al terminar — isolation real sin el costo de un container por test. Ejecuta el host completo vía `WebApplicationFactory`. Ver [ADR-0027](../docs/decisions/0027-integration-tests-shared-postgres.md).

## Stack de paquetes (central en `Directory.Packages.props`)

| Categoría | Paquetes |
|---|---|
| Messaging | `WolverineFx`, `WolverineFx.Postgresql`, `WolverineFx.EntityFrameworkCore` |
| Endpoints | `Carter` |
| Validación | `FluentValidation`, `FluentValidation.DependencyInjectionExtensions` |
| EF Core | `Microsoft.EntityFrameworkCore`, `Npgsql.EntityFrameworkCore.PostgreSQL`, `Pgvector.EntityFrameworkCore` |
| Dapper | `Dapper` |
| Auth | `BCrypt.Net-Next`, `System.IdentityModel.Tokens.Jwt`, `Microsoft.AspNetCore.Authentication.JwtBearer` |
| Logging | `Serilog.AspNetCore`, `Serilog.Sinks.Console` |
| Testing | `xunit`, `xunit.runner.visualstudio`, `Shouldly`, `NSubstitute`, `Microsoft.AspNetCore.Mvc.Testing` |

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
- **No** usar `ConfigureAwait(false)` — ASP.NET Core no tiene sync context, no hace falta.
- **No** agregar paquetes sin actualizar `Directory.Packages.props`.
