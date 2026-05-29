using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Reviews.Domain.Reviews.Events;

/// <summary>
/// Domain event emitido cuando una Review queda en status <see cref="ReviewStatus.Published"/>
/// recién creada (filter de contenido marcó clean). Translator en Application mappea a
/// integration event <c>ReviewPublished</c> que enciende el job de embedding (ADR-0007).
/// </summary>
public sealed record ReviewPublishedDomainEvent(
    ReviewId ReviewId,
    Guid EnrollmentId,
    Guid DocenteResenadoId,
    DateTimeOffset OccurredAt) : IDomainEvent;
