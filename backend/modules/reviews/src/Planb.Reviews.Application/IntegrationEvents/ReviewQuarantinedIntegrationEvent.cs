using Planb.SharedKernel.Abstractions.Messaging;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Cross-BC announcement de una reseña que entró en <c>UnderReview</c> recién creada porque el
/// filter de contenido la marcó triggered.
///
/// <para>
/// <b>Sin consumer hoy</b> (verificado 2026-07-29): el evento se publica al outbox y nadie lo
/// escucha. La cola de moderación (<c>DapperReportQueueReader</c>, US-050) se arma desde
/// <c>moderation.review_reports</c>, y una cuarentena del filtro nace con cero reports, así que
/// no aparece ahí. Esto dejaba la reseña sin salida: ningún moderador la veía y el autor no
/// podía editarla (ver la revisión 2026-07-29 de ADR-0012). La salida que se construyó es que
/// el autor edite: <c>Review.Edit</c> corre de nuevo el filtro sobre el texto nuevo. Si algún
/// día se quiere sumar esta cuarentena a una cola humana, hace falta un consumer nuevo: no
/// existe todavía.
/// </para>
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
