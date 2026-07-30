using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Reviews.Domain.Reviews.Events;

/// <summary>
/// Domain event emitido cuando una Review queda en status <see cref="ReviewStatus.Published"/>
/// recién creada (filter de contenido marcó clean). Translator en Application mappea a
/// integration event <c>ReviewPublished</c>; el consumidor de embeddings que la iba a usar
/// no se construyó (ver revisión de ADR-0007).
/// </summary>
public sealed record ReviewPublishedDomainEvent(
    ReviewId ReviewId,
    Guid EnrollmentId,
    Guid ReviewedTeacherId,
    DateTimeOffset OccurredAt) : IDomainEvent;
