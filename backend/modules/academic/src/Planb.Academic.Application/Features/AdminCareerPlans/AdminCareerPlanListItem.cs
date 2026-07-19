namespace Planb.Academic.Application.Features.AdminCareerPlans;

/// <summary>
/// Fila del listado admin de planes de estudio de una carrera. Record property-init (no
/// posicional): Dapper mapea por nombre de columna. <see cref="Status"/> es <c>string</c> porque
/// así lo persiste EF (<c>HasConversion&lt;string&gt;</c> sobre <c>CareerPlanStatus</c>).
/// </summary>
public sealed record AdminCareerPlanListItem
{
    public Guid Id { get; init; }
    public int Year { get; init; }
    public string Status { get; init; } = string.Empty;
    public bool IsOfficial { get; init; }

    /// <summary>Etiqueta editorial opcional (US-061, ej. "plan-2023").</summary>
    public string? Label { get; init; }
}
