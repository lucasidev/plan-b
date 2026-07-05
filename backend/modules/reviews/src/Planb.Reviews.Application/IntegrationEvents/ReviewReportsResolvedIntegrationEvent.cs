using Planb.SharedKernel.Abstractions.Messaging;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Cross-BC señal de que se resolvió (dismiss) el último report abierto de una reseña (US-051). Owned
/// by Reviews; publicado por Moderation en el dismiss cuando ya no quedan reports Open. Consumido por
/// <c>ReviewReportsResolvedHandler</c>, que si la reseña está UnderReview la restaura a Published y
/// escribe el audit log.
///
/// <para>
/// Nota: Moderation emite este evento sin saber el estado de la reseña; Reviews decide si restaura
/// (solo si está UnderReview, ver <c>Review.RestoreFromReports</c>). Así la lógica de estado de la
/// reseña queda del lado que la owns.
/// </para>
/// </summary>
public sealed record ReviewReportsResolvedIntegrationEvent(
    Guid EventId,
    Guid ReviewId,
    Guid ModeratorUserId,
    DateTimeOffset OccurredAt) : IIntegrationEvent;
