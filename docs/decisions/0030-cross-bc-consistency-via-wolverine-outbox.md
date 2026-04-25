# ADR-0030: Cross-BC consistency vía Wolverine outbox

- **Estado**: aceptado
- **Fecha**: 2026-04-25

## Contexto

Discovery del dominio identificó múltiples flujos cross-BC donde un cambio en un BC debe propagarse a otro:

- Edit destructive de `EnrollmentRecord` (Enrollments) debe invalidar la `Review` correspondiente (Reviews) — ver [ADR-0032](0032-edit-destructive-enrollment-invalida-review.md).
- `UserDisabled` (Identity) debe soft-flag las reviews del usuario para presentación (Reviews) y registrarse en el audit log (Moderation).
- `TeacherProfileVerified` (Identity) debe habilitar la capability `review:respond` (Reviews).
- `ReportUpheld` (Moderation) debe disparar `RemoveReview` (Reviews).
- `ReviewPublished`/`ReviewQuarantined`/`ReviewEdited`/`ReviewRemoved`/`ReviewRestored`/`TeacherResponsePublished`/`TeacherResponseEdited` (Reviews) deben alimentar el `ReviewAuditLog` (Moderation).

Sin un patrón unificado, cada caso se cablea ad-hoc: handlers que llaman directamente al otro BC, transacciones que abarcan múltiples DbContexts, etc. Eso no escala.

[ADR-0015](0015-wolverine-como-mediator-y-message-bus.md) ya estableció Wolverine como mediator + message bus + outbox durable. Falta formalizar **cómo** se usa para cross-BC consistency.

## Decisión

**Toda comunicación cross-BC pasa por integration events publicados al outbox de Wolverine.**

Concretamente:

1. **Domain events** (`IDomainEvent`) son emitidos por aggregates dentro de su BC. Se persisten en el outbox de Wolverine en la misma transacción que el SaveChanges que los produjo (vía `AddDbContextWithWolverineIntegration`).

2. **Integration events** (`IIntegrationEvent`) son una clase distinta — los emite un handler local del BC origen, escuchando un domain event y traduciendo a un evento que cruza BCs. La distinción fuerza separación de concerns: el dominio no sabe quién consume sus events; un handler-bridge decide qué publicar afuera.

3. **Wolverine despacha** los integration events al(los) BC(s) consumer(s) asincrónicamente vía el outbox. **At-least-once delivery** garantizada.

4. **Eventual consistency** entre BCs es la regla. No hay transacciones distribuidas. Si un consumer falla, Wolverine reintenta hasta confirmar.

5. **Reads cross-BC** sí pueden ser síncronos (vía `I<BC>QueryService` interfaces en `Application/Contracts/`). La regla del outbox es para **writes** que cambian estado.

### Patrón de implementación

```csharp
// 1. Aggregate emite domain event (intra-BC).
public sealed class User : Entity<UserId>, IAggregateRoot
{
    public Result Disable(...)
    {
        // ... validaciones + state change ...
        Raise(new UserDisabledDomainEvent(...));  // domain event
        return Result.Success();
    }
}

// 2. Handler local del BC origen traduce domain event a integration event.
// Vive en {BC}.Application/EventHandlers/.
public static class UserDisabledTranslator
{
    public static UserDisabledIntegrationEvent Handle(UserDisabledDomainEvent @event)
        => new(@event.UserId, @event.Reason, @event.OccurredAt);
    // Wolverine ve que esta función devuelve un IntegrationEvent y lo cascadea al outbox.
}

// 3. Handler en BC consumer escucha el integration event.
// Vive en {ConsumerBC}.Application/EventHandlers/.
public static class SoftFlagReviewsOnUserDisabled
{
    public static async Task HandleAsync(
        UserDisabledIntegrationEvent @event,
        IReviewRepository reviews,
        IIdentityUnitOfWork uow,
        CancellationToken ct)
    {
        var userReviews = await reviews.FindByAuthorAsync(@event.UserId, ct);
        foreach (var review in userReviews) review.MarkAuthorDisabled(...);
        await uow.SaveChangesAsync(ct);
    }
}
```

### Atomicidad write+publish

Cuando un handler en BC origen ejecuta:

1. Modifica el aggregate (en memoria).
2. Llama a `DomainEventDispatcher.DispatchAsync(...)` que enrolla los domain events al outbox.
3. SaveChangesAsync persiste el aggregate + las filas del outbox en la misma transacción Postgres.

Si la transacción rollback-ea, los events nunca salen. Si la transacción commit-ea, los events están durables y Wolverine los despachará.

## Alternativas consideradas

### Llamadas directas cross-BC

Handler de BC A llama directamente a un application service del BC B. Pros: simple, síncrono. Contras (decisivos):
- Acopla los BCs en código (Reviews referencia Identity.Application directamente).
- Pierde durabilidad: si el call al BC B falla, el cambio de A queda inconsistente (no hay outbox que reintente).
- Imposible auditar qué events viajaron entre BCs (no hay registro persistente).

### Transacciones distribuidas (2PC)

Atomic write across BCs vía 2PC. Pros: consistencia fuerte. Contras (decisivos):
- Complejidad operativa enorme (locks distribuidos, coordinator).
- Postgres no soporta 2PC entre databases distintos sin extensiones.
- Overkill: nuestros BCs viven en el mismo Postgres con schemas distintos. La mayoría de las consistency rules toleran eventual.

### Messaging síncrono (RPC entre BCs)

Como los BCs viven en el mismo proceso, podríamos hacer comunicación in-process síncrona vía Wolverine también. Pros: respuesta inmediata. Contras: pierde el desacoplamiento — el caller espera al callee. Si el callee es lento o falla, el caller falla.

### Outbox + integration events (elegido)

Pros: durable, async, audit-friendly, desacoplado, escala si en futuro splittedmos a microservicios.
Contras: eventual consistency es más mental load para el dev. Pero está alineado con la realidad del producto (la mayoría de las consequences son tolerables a unos ms de delay).

## Consecuencias

**Positivas**:

- Resilencia: si un BC consumer está temporalmente broken, los events quedan en el outbox y se procesan cuando se recupera.
- Auditabilidad: el outbox registra qué events viajaron, cuándo, a quién. Útil para debugging y para el ReviewAuditLog projection.
- Desacople: BCs no se referencian en código. Solo conocen los integration events que emiten/consumen.
- Escalabilidad futura: si splittedmos a microservicios, el patrón ya está y solo cambiamos el transport (de in-process a Rabbit/Kafka/etc.).

**Negativas**:

- Eventual consistency: el dev tiene que diseñar pensando "esto va a converger en milisegundos, no instantáneamente". Para writes sensibles (ej. authorization), validar siempre con read síncrono al BC autoritativo.
- Más infrastructure: Wolverine schema en Postgres, durability worker corriendo, polling del outbox. Aceptable — ya lo tenemos instalado desde slice B.
- Tests integration tienen que esperar (con timeout) a que el outbox procese events. Patrón estándar en CI.

## Implementación actual

- **En slice B** ya wireamos el outbox plumbing (`PersistMessagesWithPostgresql`, `AddDbContextWithWolverineIntegration`, `RunWolverineInSoloMode` en tests, `CritterStackDefaults` para dev/prod split).
- **Aún no usamos** el patrón end-to-end — slice B envía email síncronamente desde el handler en vez de via outbox-driven dispatch. Es deuda explícita, marcada como TODO en el código y en este ADR.
- **Slice C arranca a usar el patrón en serio**: cuando se refactorea VerificationToken como child entity, el flow de "email verification consumed → mark user verified" debe ser eventually consistent.

## Cuándo revisitar

- Si el delay del outbox se vuelve user-visible (ej. user verifica email pero la UI no refleja por > 5s), evaluar tuning del polling interval o transport sync para casos críticos.
- Si los integration events crecen a > 50 tipos, evaluar versioning explícito (V1 / V2 / etc.).
- Si los BCs salen a microservicios, el outbox sigue siendo válido pero el transport cambia — Wolverine soporta Rabbit, Azure Service Bus, etc.

Refs: [ADR-0014](0014-arquitectura-modular-monolith.md), [ADR-0015](0015-wolverine-como-mediator-y-message-bus.md), [ADR-0017](0017-persistence-ignorance.md).
