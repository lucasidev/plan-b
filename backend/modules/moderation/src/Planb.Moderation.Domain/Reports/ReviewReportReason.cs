namespace Planb.Moderation.Domain.Reports;

/// <summary>
/// Closed set of reasons a user can pick when reporting a review (US-019). Persisted as
/// text (HasConversion in EF config) so new values do not require a migration.
///
/// The set matches the report modal one-to-one (per the v2-modals mockup, the source of
/// truth): no <c>Otro</c> bucket. The doc's original AC listed an "otro" option, but the
/// claude-design pass dropped it; an unused enum value would be dead code (YAGNI). Add it
/// here plus in the modal together if a real need appears.
/// </summary>
public enum ReviewReportReason
{
    /// <summary>"No es sobre la cursada": habla de cosas ajenas a materia/docente.</summary>
    OffTopic,

    /// <summary>"Datos personales": identifica a un alumno o expone info privada.</summary>
    DatosPersonales,

    /// <summary>"Lenguaje ofensivo": insultos, discriminación o ataques personales.</summary>
    LenguajeInapropiado,

    /// <summary>"Información falsa": datos verificablemente incorrectos sobre la cursada.</summary>
    Difamacion,

    /// <summary>"Spam o promoción": promociona algo ajeno a la materia.</summary>
    Spam,
}
