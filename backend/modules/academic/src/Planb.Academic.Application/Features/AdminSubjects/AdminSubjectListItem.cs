namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// Fila del listado admin de materias de un plan de estudios (US-062). Record property-init (no
/// posicional): Dapper mapea por nombre de columna. También se reutiliza tal cual como response
/// del GET admin de detalle: mismo shape, sin campos extra.
/// </summary>
public sealed record AdminSubjectListItem
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public int YearInPlan { get; init; }
    public int? TermInYear { get; init; }
    public string TermKind { get; init; } = string.Empty;
    public int WeeklyHours { get; init; }
    public int TotalHours { get; init; }
    public string? Description { get; init; }
    public bool IsOfficial { get; init; }
    public bool IsActive { get; init; }
}
