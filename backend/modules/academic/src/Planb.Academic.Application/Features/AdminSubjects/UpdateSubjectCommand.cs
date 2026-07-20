using Planb.Academic.Domain;

namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// Edición de una materia del catálogo (US-062, admin). Replace del form completo: code, name y
/// los atributos académicos se re-validan y re-normalizan como en el alta. El plan NO se puede
/// mover (ver <see cref="Domain.Subjects.Subject.Update"/>).
/// </summary>
public sealed record UpdateSubjectCommand(
    Guid SubjectId,
    string Code,
    string Name,
    int YearInPlan,
    int? TermInYear,
    TermKind TermKind,
    int WeeklyHours,
    int TotalHours,
    string? Description);
