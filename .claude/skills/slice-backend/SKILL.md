---
name: slice-backend
description: Scaffoldea un vertical slice backend nuevo en planb (un caso de uso = Command + CommandHandler + Validator + Endpoint + Request + Response en un módulo del monolito .NET). Usalo cuando haya que agregar un endpoint que escribe o muta estado (registrar, crear, resolver, cargar, actualizar, dar de baja algo) en backend/modules/*, aunque no se diga "vertical slice" ni "feature": si la tarea es "que el backend haga X" y X cambia estado, este es el patrón. Para reads complejos usá dapper-read; para emitir eventos cross-módulo, integration-event.
---

Scaffoldeás un feature backend siguiendo el vertical slice del monolito. El patrón completo vive en [`backend/CLAUDE.md`](../../../backend/CLAUDE.md) (que ya se carga cuando trabajás en `backend/`); este skill es el **procedimiento + el ejemplo canónico a copiar**. No reinventes la estructura de memoria: abrila de un slice real y espejala. El código es la verdad, no esta guía.

## Ejemplo canónico

`backend/modules/enrollments/src/Planb.Enrollments.Application/Features/RegisterEnrollment/` es el slice más limpio y completo (US-013). Al armar uno nuevo, abrilo y copiá su forma. Tiene los 6 archivos:

- **`<UseCase>Command.cs`**: `public sealed record` con los inputs del caso de uso (no del HTTP body). Es el mensaje que consume el handler.
- **`<UseCase>CommandHandler.cs`**: `public static class` con `Handle(command, deps..., CancellationToken ct)` que devuelve `Task<Result<Response>>`. Wolverine lo descubre por convención e inyecta las deps por parámetro (repos, query services, `IDateTimeProvider`). Contiene la lógica del caso de uso.
- **`<UseCase>Validator.cs`**: `internal sealed class : AbstractValidator<Command>`. Solo reglas de forma (`NotEmpty`, rangos). Las invariantes de dominio las enforca el aggregate, no el validator.
- **`<UseCase>Endpoint.cs`**: `public sealed class : ICarterModule`. Mapea la ruta, parsea enums desde string (400 si el string es inválido), extrae la identidad del JWT (no del body), invoca `bus.InvokeAsync<Result<Response>>(command)` y mapea el `Result` a status code.
- **`<UseCase>Request.cs`**: `public sealed record` espejo del body HTTP. Los datos de identidad (UserId) NO van acá: salen del token.
- **`<UseCase>Response.cs`**: `public sealed record` con lo que devolvés al cliente.

## Reglas que no se negocian

- **`Result<T>`, nunca `throw`** para fallas de negocio (validación, not found, conflict). El handler devuelve `Result.Failure(Error.X(...))`; el endpoint lo traduce a HTTP. El `throw` se reserva para bugs, no para flujo esperado.
- **Cross-BC solo por query services** (`IIdentityQueryService`, `IAcademicQueryService`, ...), nunca EF navigation cross-module ni FK cross-schema. Es persistence ignorance (ADR-0017): un módulo no conoce las tablas de otro.
- **`IDateTimeProvider.UtcNow`**, nunca `DateTime.UtcNow` directo: el tiempo es una dependencia inyectada para que los tests lo controlen.
- **El `SaveChanges` lo hace el middleware** Wolverine `[Transactional]`, no lo llames a mano en el handler.
- **Código en inglés** (clases, métodos, rutas, mensajes de error internos). La UI en español la arma el frontend.

## Variaciones reales del patrón

- **Query (read), no Command**: si el caso de uso lee y no muta, es una Query. Suele tener ~4 archivos (sin CommandHandler separado; el endpoint parsea los query params directo). Ejemplo: `BrowseReviews` en el módulo reviews. Para reads cruzados o complejos se usa Dapper, no EF: ese es otro patrón, ver el skill `dapper-read`.
- **Varios use cases en un folder**: operaciones hermanas sobre el mismo aggregate (ej. `AdminTeachers`: create/update/deactivate/reactivate) pueden compartir folder y DTOs de Response.

## Al terminar

- No registres handler/endpoint/validator a mano: Wolverine y Carter los descubren por convención al arrancar.
- Si el feature debe emitir un evento de integración hacia otro módulo, eso es otro patrón: ver el skill `integration-event`.
- Verificá con `dotnet build Planb.sln` (o delegá al subagente `test-runner`). No commitees vos: el commit lo hace el flujo de `ship`, con OK de Lucas antes del push.
