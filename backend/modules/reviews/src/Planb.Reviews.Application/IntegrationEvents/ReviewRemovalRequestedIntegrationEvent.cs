using Planb.SharedKernel.Abstractions.Messaging;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Cross-BC request para remover una reseña por decisión del moderador (US-051, uphold). Owned by
/// Reviews aunque Moderation lo publica (mismo criterio que
/// <see cref="ReviewQuarantineRequestedIntegrationEvent"/>, ADR-0045): es un contrato de "qué se le
/// puede pedir a una reseña". Consumido por <c>ReviewRemovalRequestedHandler</c>, que pasa la reseña
/// a Removed y escribe el audit log (action = ModeratorDecision).
///
/// <para>
/// <see cref="ModeratorUserId"/> es el moderador que resolvió (queda como actor en el audit).
/// <see cref="ResolutionNote"/> es la nota interna opcional, se copia al audit.
/// </para>
/// </summary>
public sealed record ReviewRemovalRequestedIntegrationEvent(
    Guid EventId,
    Guid ReviewId,
    Guid ModeratorUserId,
    string? ResolutionNote,
    DateTimeOffset OccurredAt) : IIntegrationEvent;
