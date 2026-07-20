namespace Planb.Planning.Application.Features.GetAvailableSubjects;

/// <summary>
/// Metadata de display de una materia activa del plan (US-016). Record property-init: el reader
/// Dapper mapea por nombre de columna, mismo idiom que <c>AdminAcademicTermListItem</c> en Academic.
/// Sirve tanto para armar el item principal de la respuesta como para resolver code/name de las
/// materias que aparecen en <c>blockedBy</c> (ver <see cref="SimulatorPlanSnapshot"/>).
/// </summary>
public sealed record SimulatorSubjectSnapshot
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public int YearInPlan { get; init; }
    public int? TermInYear { get; init; }
    public string TermKind { get; init; } = string.Empty;
    public int WeeklyHours { get; init; }
    public int TotalHours { get; init; }
}
