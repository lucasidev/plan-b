using Planb.SharedKernel.Abstractions.Messaging;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Cross-BC announcement de una reseña que entró en <c>UnderReview</c> recién creada porque el
/// filter de contenido la marcó triggered. Consumer canónico: <b>Moderation</b>, que la suma a
/// la cola de revisión humana.
///
/// <para>
/// El diseño de ADR-0013 dice que el embedding se encola recién cuando un moderator la mueva a
/// <c>Published</c>; hoy no hay pipeline ni corpus semántico corriendo (ver revisión de
/// ADR-0007).
/// </para>
/// </summary>
public sealed record ReviewQuarantinedIntegrationEvent(
    Guid EventId,
    Guid ReviewId,
    Guid EnrollmentId,
    Guid ReviewedTeacherId,
    DateTimeOffset OccurredAt) : IIntegrationEvent;
