namespace Planb.Moderation.Application.Features.ReportQueue;

/// <summary>
/// Una fila de la cola de reportes (US-050): un report individual, no agrupado por reseña. Record
/// property-init (no posicional): Dapper mapea por nombre de columna y tolera nullables.
///
/// <para>
/// <see cref="Reason"/> viene como el string del enum (ej. "DatosPersonales"); el frontend mapea a
/// copy human-readable. <see cref="Tone"/> ("urgent" | "normal" | "low") lo clasifica el read model
/// desde el motivo (ver <c>DapperReportQueueReader</c>). <see cref="Snippet"/> es el body de la reseña
/// truncado (el report no guarda el fragmento citado; identidades visibles al staff, ADR-0009).
/// </para>
/// </summary>
public sealed record ReportQueueItem
{
    public Guid Id { get; init; }
    public DateTime CreatedAt { get; init; }
    public string Reason { get; init; } = string.Empty;
    public string? Snippet { get; init; }
    public Guid TargetReviewId { get; init; }
    public Guid ReporterUserId { get; init; }
    public string Tone { get; init; } = "low";
}
