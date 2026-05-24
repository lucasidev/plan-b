using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Identity.Domain.Users.Events;

/// <summary>
/// Emitted when a user deactivates their own account (ADR-0044, soft delete con anonimización).
/// El aggregate sobrevive en la tabla con la PII anonimizada; otros BCs deben suscribir al
/// integration event counterpart (<see cref="Planb.Identity.Application.IntegrationEvents.UserAccountDeactivatedIntegrationEvent"/>)
/// para anonimizar las referencias al user (preservar contenido, blank PII relacionada).
///
/// <para>
/// Distinto de <see cref="UserAccountDeletedDomainEvent"/>: el "deleted" se reserva al hard
/// delete interno (tests/scripts/admin futuro). El user-facing flow es deactivate.
/// </para>
/// </summary>
public sealed record UserAccountDeactivatedDomainEvent(
    UserId UserId,
    DateTimeOffset OccurredAt) : IDomainEvent;
