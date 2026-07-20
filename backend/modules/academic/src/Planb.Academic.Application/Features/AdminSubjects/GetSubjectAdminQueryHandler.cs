using Planb.Academic.Domain.Subjects;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// Handler del GET /api/academic/career-plans/{planId}/subjects/{subjectId} (admin). Lee el
/// aggregate directo del repo de write (no amerita un reader Dapper aparte: es un lookup por PK sin
/// joins ni cómputo). 404 si no existe o si no pertenece al plan de la ruta: un subjectId real pero
/// de otro plan también es 404, no 200 con datos ajenos al plan pedido.
/// </summary>
public static class GetSubjectAdminQueryHandler
{
    public static async Task<Result<AdminSubjectListItem>> Handle(
        GetSubjectAdminQuery query,
        ISubjectRepository subjects,
        CancellationToken ct)
    {
        var subject = await subjects.GetByIdAsync(new SubjectId(query.SubjectId), ct);
        if (subject is null || subject.CareerPlanId.Value != query.CareerPlanId)
        {
            return SubjectErrors.NotFound;
        }

        return new AdminSubjectListItem
        {
            Id = subject.Id.Value,
            Code = subject.Code,
            Name = subject.Name,
            YearInPlan = subject.YearInPlan,
            TermInYear = subject.TermInYear,
            TermKind = subject.TermKind.ToString(),
            WeeklyHours = subject.WeeklyHours,
            TotalHours = subject.TotalHours,
            Description = subject.Description,
            IsOfficial = subject.IsOfficial,
            IsActive = subject.IsActive,
        };
    }
}
