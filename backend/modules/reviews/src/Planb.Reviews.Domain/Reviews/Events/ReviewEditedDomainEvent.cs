using Planb.SharedKernel.Abstractions.DomainEvents;

namespace Planb.Reviews.Domain.Reviews.Events;

/// <summary>
/// Domain event emitido cuando el autor edita su Review (US-018). El translator a
/// integration event re-encola el job de embedding (los textos cambiaron) y dispara
/// downstream consumers que quieran enterarse.
///
/// <para>
/// <c>StatusAfter</c> permite distinguir el caso "el edit pasó el filter" (Published) del
/// caso "el edit triggereó el filter y la review pasó a UnderReview". El consumer del
/// embedding job decide qué hacer en cada caso (encolar igual, skipear si UnderReview).
/// </para>
/// </summary>
public sealed record ReviewEditedDomainEvent(
    ReviewId ReviewId,
    Guid EnrollmentId,
    Guid DocenteResenadoId,
    ReviewStatus StatusBefore,
    ReviewStatus StatusAfter,
    DateTimeOffset OccurredAt) : IDomainEvent;
