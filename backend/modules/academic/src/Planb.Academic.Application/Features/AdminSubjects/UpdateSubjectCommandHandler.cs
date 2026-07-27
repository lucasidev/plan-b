using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.Commissions;
using Planb.Academic.Domain.Subjects;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// Handler del PATCH /api/academic/subjects/{id} (admin). Carga el aggregate, valida que el nuevo
/// code (si cambió) no colisione con otra materia del mismo plan, aplica Update y persiste. 404 si
/// la materia no existe.
///
/// <para>
/// La cadencia (<c>TermKind</c>) se congela apenas la materia tiene comisiones: ver
/// <see cref="SubjectErrors.TermKindLockedByCommissions"/>.
/// </para>
/// </summary>
public static class UpdateSubjectCommandHandler
{
    public static async Task<Result<UpdateSubjectResponse>> Handle(
        UpdateSubjectCommand command,
        ISubjectRepository subjects,
        ICommissionRepository commissions,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var subject = await subjects.GetByIdAsync(new SubjectId(command.SubjectId), ct);
        if (subject is null)
        {
            return SubjectErrors.NotFound;
        }

        if (command.TermKind != subject.TermKind
            && await commissions.ExistsForSubjectAsync(subject.Id.Value, ct))
        {
            return SubjectErrors.TermKindLockedByCommissions;
        }

        var trimmedCode = command.Code.Trim();
        if (await subjects.ExistsByCodeAsync(subject.CareerPlanId, trimmedCode, subject.Id, ct))
        {
            return SubjectErrors.CodeAlreadyExists;
        }

        var result = subject.Update(
            command.Code,
            command.Name,
            command.YearInPlan,
            command.TermInYear,
            command.TermKind,
            command.WeeklyHours,
            command.TotalHours,
            command.Description,
            clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new UpdateSubjectResponse(subject.Id.Value);
    }
}
