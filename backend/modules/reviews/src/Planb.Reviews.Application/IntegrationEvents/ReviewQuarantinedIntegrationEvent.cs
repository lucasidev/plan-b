using Planb.SharedKernel.Abstractions.Messaging;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Cross-BC announcement de una reseña que entró en <c>UnderReview</c> recién creada porque el
/// filter de contenido la marcó triggered. Consumer canónico: <b>Moderation</b>, que la suma a
/// la cola de revisión humana.
///
/// <para>
/// El embedding NO se dispara hasta que un moderator la mueva a <c>Published</c>: ADR-0013
/// gatea el embedding en transiciones a published. Hasta entonces la review existe en DB pero
/// no en el corpus semántico.
/// </para>
/// </summary>
public sealed record ReviewQuarantinedIntegrationEvent(
    Guid EventId,
    Guid ReviewId,
    Guid EnrollmentId,
    Guid DocenteResenadoId,
    DateTimeOffset OccurredAt) : IIntegrationEvent;
