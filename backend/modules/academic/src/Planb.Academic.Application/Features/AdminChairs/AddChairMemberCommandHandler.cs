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
/// Handler de sumar un docente al equipo (US-196). El aggregate ya defiende sus propios invariantes
/// (un solo titular vigente, nadie dos veces); acá se valida lo que necesita ver los otros
/// aggregates: que el docente y el período existan, que el docente no esté archivado, y que la
/// materia, el docente y el período sean de la misma universidad.
///
/// <para>
/// Esa última es la que importa y no la impone ninguna FK: sin ella se puede armar una cátedra de
/// una materia de UNSTA con un docente de la UTN y un período de una tercera, y la ficha pública lo
/// publicaría sin que nada chille (ADR-0017: la integridad cross-aggregate vive acá).
/// </para>
/// </summary>
public static class AddChairMemberCommandHandler
{
    public static async Task<Result> Handle(
        AddChairMemberCommand command,
        IChairRepository chairs,
        ISubjectRepository subjects,
        ITeacherRepository teachers,
        IAcademicTermRepository terms,
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

        var teacher = await teachers.GetByIdAsync(new TeacherId(command.TeacherId), ct);
        if (teacher is null)
        {
            return ChairErrors.TeacherNotFound;
        }

        if (!teacher.IsActive)
        {
            return ChairErrors.TeacherInactive;
        }

        var term = await terms.FindByIdAsync(new AcademicTermId(command.SinceTermId), ct);
        if (term is null)
        {
            return ChairErrors.TermNotFound;
        }

        var universityId = await UniversityOfAsync(chair.SubjectId, subjects, academic, ct);
        if (universityId is null)
        {
            // Defensivo: la cátedra solo se crea contra una materia existente, pero sin FK
            // cross-schema el dato puede quedar huérfano y acá explotaría con un NRE.
            return ChairErrors.SubjectNotFound;
        }

        if (teacher.UniversityId.Value != universityId || term.UniversityId.Value != universityId)
        {
            return ChairErrors.UniversityMismatch;
        }

        var result = chair.AddMember(
            new TeacherId(command.TeacherId),
            command.Role,
            new AcademicTermId(command.SinceTermId),
            clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);
        return Result.Success();
    }

    /// <summary>
    /// La universidad de una materia, que se alcanza por su plan. No es un campo de Subject: el
    /// plan es de una carrera y la carrera de una universidad.
    /// </summary>
    private static async Task<Guid?> UniversityOfAsync(
        SubjectId subjectId,
        ISubjectRepository subjects,
        IAcademicQueryService academic,
        CancellationToken ct)
    {
        var subject = await subjects.GetByIdAsync(subjectId, ct);
        if (subject is null)
        {
            return null;
        }

        var plan = await academic.GetCareerPlanByIdAsync(subject.CareerPlanId.Value, ct);
        return plan?.UniversityId;
    }
}
