namespace Planb.Moderation.Application.Features.ReportQueue;

/// <summary>
/// Counts globales para los filter chips + el subtitle de la cola (US-050). Se devuelven en el mismo
/// response (una sola roundtrip para tabla + chips). Record property-init para Dapper.
/// </summary>
public sealed record ReportQueueCounts
{
    /// <summary>Reportes abiertos (status = Open).</summary>
    public int OpenCount { get; init; }

    /// <summary>Reportes cerrados (upheld + dismissed) en los últimos 7 días.</summary>
    public int ClosedLast7d { get; init; }

    /// <summary>Abiertos de tono urgente.</summary>
    public int UrgentCount { get; init; }

    /// <summary>Abiertos de tono normal.</summary>
    public int NormalCount { get; init; }

    /// <summary>Abiertos de tono bajo.</summary>
    public int LowCount { get; init; }

    /// <summary>Abiertos con más de 48h sin tocar (para el "N con +48h sin tocar" del subtitle).</summary>
    public int StaleCount { get; init; }
}
