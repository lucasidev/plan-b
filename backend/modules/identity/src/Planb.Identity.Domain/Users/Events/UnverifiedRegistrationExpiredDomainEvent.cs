using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Identity.Domain.Users.Events;

/// <summary>
/// Levantado cuando un registro no verificado pasa el threshold de 7 días desde Register y el
/// scheduled job lo marca como expired (US-022). Carga el email para que un eventual handler de
/// notificación pueda enviar un "tu registro fue expirado, registrate de nuevo si todavía
/// querés". El email no es PII sensible adicional — es el mismo que el actor usó al registrarse.
/// </summary>
public sealed record UnverifiedRegistrationExpiredDomainEvent(
    UserId UserId,
    EmailAddress Email,
    DateTimeOffset OccurredAt) : IDomainEvent;
