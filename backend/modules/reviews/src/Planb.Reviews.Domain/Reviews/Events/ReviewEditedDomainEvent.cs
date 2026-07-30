using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Reviews.Domain.Reviews.Events;

/// <summary>
/// Domain event emitido cuando el autor edita su Review (US-018). El translator a
/// integration event dispara downstream consumers que quieran enterarse; el re-encolado
/// del embedding (los textos cambiaron) es diseño en pausa, no algo que corra hoy (ver
/// revisión de ADR-0007).
///
/// <para>
/// <c>StatusAfter</c> permite distinguir el caso "el edit pasó el filter" (Published) del
/// caso "el edit triggereó el filter y la review pasó a UnderReview". Cuando el pipeline de
/// embedding exista, el consumer decide qué hacer en cada caso (encolar igual, skipear si
/// UnderReview) según ADR-0013.
/// </para>
/// </summary>
public sealed record ReviewEditedDomainEvent(
    ReviewId ReviewId,
    Guid EnrollmentId,
    Guid ReviewedTeacherId,
    ReviewStatus StatusBefore,
    ReviewStatus StatusAfter,
    DateTimeOffset OccurredAt) : IDomainEvent;
