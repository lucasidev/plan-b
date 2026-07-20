using Planb.Academic.Domain;

namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// Alta de una materia de un plan de estudios (US-062, admin). El plan no se puede cambiar después
/// (<see cref="Domain.Subjects.Subject.Update"/> no toca CareerPlanId); para reubicar una materia
/// hace falta la migración asistida de plan (US-084).
/// </summary>
public sealed record CreateSubjectCommand(
    Guid CareerPlanId,
    string Code,
    string Name,
    int YearInPlan,
    int? TermInYear,
    TermKind TermKind,
    int WeeklyHours,
    int TotalHours,
    string? Description);
