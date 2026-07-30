using Planb.SharedKernel.Abstractions.Messaging;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Cross-BC announcement de una reseña que entró en estado <c>Published</c> recién creada
/// (filter de contenido la marcó clean).
///
/// <list type="bullet">
///   <item><b>Semantic Analytics</b>: iba a disparar el embedding job (ADR-0007, ADR-0013) que
///         computa el vector de la reseña para la búsqueda semántica + las crowd insights. El
///         andamiaje se borró: no hay consumidor real todavía (ver revisión de ADR-0007).</item>
///   <item><b>Notifications</b> (futuro): el docente reseñado verificado puede recibir mail.</item>
/// </list>
///
/// <para>
/// No incluye el texto de la reseña (privacidad y tamaño): consumers que necesiten el contenido
/// lo leen vía read service después de ver el event. ID y referencias cross-BC alcanzan para el
/// fan-out típico.
/// </para>
/// </summary>
public sealed record ReviewPublishedIntegrationEvent(
    Guid EventId,
    Guid ReviewId,
    Guid EnrollmentId,
    Guid? ReviewedTeacherId,
    DateTimeOffset OccurredAt) : IIntegrationEvent;
