using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Reviews.Domain.Reviews.Events;

/// <summary>
/// Domain event emitido cuando una Review queda en <see cref="ReviewStatus.UnderReview"/>
/// recién creada porque el filter de contenido la marcó triggered. Translator a integration
/// event mappea para notificar a moderation queue.
///
/// El embedding job NO se dispara hasta que la review pase a <c>Published</c>, ver
/// ADR-0013 (embedding gated en transiciones a published).
/// </summary>
public sealed record ReviewQuarantinedDomainEvent(
    ReviewId ReviewId,
    Guid EnrollmentId,
    Guid DocenteResenadoId,
    DateTimeOffset OccurredAt) : IDomainEvent;
