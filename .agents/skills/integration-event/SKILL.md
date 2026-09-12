---
name: integration-event
description: Guía para emitir y consumir un evento de integración cross-módulo en el backend de planb (Wolverine outbox durable). Usalo cuando una acción en un módulo tenga que disparar un efecto en OTRO módulo (ej. moderación resuelve un reporte y reviews borra la reseña) sin acoplarlos con una llamada directa. Patrón owned-by-receiver (ADR-0045). No confundir con un command dentro del mismo módulo: para eso usá slice-backend.
---

Emitís o consumís un evento de integración entre bounded contexts. El transporte es el outbox durable de Wolverine: el evento se persiste en la misma transacción que el write y se entrega after-commit (at-least-once). El detalle y las alternativas están en ADR-0045; este skill es el procedimiento + el ejemplo canónico.

## Ejemplo canónico

Moderación resuelve un reporte (uphold) y Reviews debe borrar la reseña en cascada:

- **El evento lo define el módulo RECEPTOR** (owned-by-receiver, ADR-0045): `ReviewRemovalRequestedIntegrationEvent` vive en `reviews`, no en `moderation`, aunque moderation es quien lo publica.
  `backend/modules/reviews/src/Planb.Reviews.Application/IntegrationEvents/ReviewRemovalRequestedIntegrationEvent.cs`:
  ```csharp
  public sealed record ReviewRemovalRequestedIntegrationEvent(
      Guid EventId, Guid ReviewId, Guid ModeratorUserId,
      string? ResolutionNote, DateTimeOffset OccurredAt) : IIntegrationEvent;
  ```
- **Se publica** desde el handler del emisor con `bus.PublishAsync(...)` (misma transacción del command, va al outbox):
  `moderation/.../Features/ResolveReport/UpholdReportCommandHandler.cs`.
- **Se consume** con un handler estático en el módulo receptor, descubierto por Wolverine por convención:
  `reviews/.../IntegrationEvents/ReviewRemovalRequestedHandler.cs` con `public static async Task Handle(TheEvent message, deps..., ct)`.

## Por qué owned-by-receiver

El receptor define el contrato al que está dispuesto a reaccionar, así el emisor depende del contrato del receptor (no al revés) y no se filtra el modelo interno del emisor cruzando el borde. Un módulo publica un evento que "le pertenece" a quien lo consume. Rationale completo en ADR-0045.

## Reglas

- El evento es un `record` inmutable con datos primitivos (ids, strings, timestamps), nunca aggregates ni entidades EF: cruza un borde, tiene que ser un DTO plano (persistence ignorance, ADR-0017).
- `IIntegrationEvent` marca el contrato. `EventId` para idempotencia y traza; `OccurredAt` con `IDateTimeProvider.UtcNow`, nunca `DateTime.UtcNow`.
- El handler del receptor es idempotente donde importa: el outbox garantiza at-least-once, o sea puede reintentarse.
- No hagas una llamada directa cross-módulo para esto: rompería el aislamiento. El evento ES el desacople.

## Al terminar

Verificá con `dotnet build Planb.sln` + `dotnet test Planb.sln` (o delegá al subagente `test-runner`). El flujo emisor, outbox y receptor conviene cubrirlo con un integration test.
