using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.Chairs;
using Planb.Academic.Domain.Subjects;
using Planb.Academic.Domain.Teachers;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminChairs;

/// <summary>
/// Handler de cerrar el tramo de un docente (US-196). No borra la fila: le pone el período hasta el
/// que integró, y el aggregate se encarga de que el docente esté vigente en esa cátedra.
/// </summary>
public static class CloseChairMemberCommandHandler
{
    public static async Task<Result> Handle(
        CloseChairMemberCommand command,
        IChairRepository chairs,
        IAcademicTermRepository terms,
        ISubjectRepository subjects,
        IAcademicQueryService academic,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var chair = await chairs.GetByIdAsync(new ChairId(command.ChairId), ct);
        if (chair is null)
        {
            return ChairErrors.NotFound;
        }

        var member = chair.Members.FirstOrDefault(m => m.IsCurrent && m.TeacherId.Value == command.TeacherId);
        if (member is null)
        {
            return ChairErrors.TeacherNotInChair;
        }

        var term = await terms.FindByIdAsync(new AcademicTermId(command.UntilTermId), ct);
        var since = await terms.FindByIdAsync(member.SinceTermId, ct);
        if (term is null || since is null)
        {
            return ChairErrors.TermNotFound;
        }

        var subject = await subjects.GetByIdAsync(chair.SubjectId, ct);
        var plan = subject is null ? null : await academic.GetCareerPlanByIdAsync(subject.CareerPlanId.Value, ct);
        if (plan is null)
        {
            return ChairErrors.SubjectNotFound;
        }

        if (term.UniversityId.Value != plan.UniversityId || since.UniversityId.Value != plan.UniversityId)
        {
            return ChairErrors.UniversityMismatch;
        }

        // Hasta incluye el período elegido; las fechas permiten comparar cadencias distintas.
        if (term.EndDate < since.StartDate)
        {
            return ChairErrors.MemberPeriodInverted;
        }

        var result = chair.CloseMember(
            new TeacherId(command.TeacherId),
            new AcademicTermId(command.UntilTermId),
            clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);
        return Result.Success();
    }
}
