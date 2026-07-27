using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.Commissions;
using Planb.Academic.Domain.Subjects;
using Planb.Academic.Domain.Teachers;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>
/// Handler del POST /api/academic/subjects/{subjectId}/commissions (admin). Valida coherencia
/// cross-aggregate en app-layer (ADR-0017, no hay FK cross-schema): el subject existe y está activo,
/// el term existe, sus term_kind coinciden, subject/term/cada docente son de la misma universidad, y
/// el nombre es único dentro de (subject, term).
///
/// <para>
/// Usa los repos de escritura (no <see cref="IAcademicQueryService"/>) para resolver Subject/Term/
/// Teacher porque necesita distinguir "no existe" de "existe pero inactivo": el catálogo público de
/// Subject (<c>GetSubjectByIdAsync</c>) ya filtra <c>is_active = true</c> y colapsaría ambos casos en
/// un mismo null.
/// </para>
/// </summary>
public static class CreateCommissionCommandHandler
{
    public static async Task<Result<CreateCommissionResponse>> Handle(
        CreateCommissionCommand command,
        ICommissionRepository commissions,
        ISubjectRepository subjects,
        IAcademicTermRepository terms,
        ITeacherRepository teachers,
        IAcademicQueryService academic,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var subject = await subjects.GetByIdAsync(new SubjectId(command.SubjectId), ct);
        if (subject is null)
        {
            return CommissionErrors.SubjectNotFound;
        }
        if (!subject.IsActive)
        {
            return CommissionErrors.SubjectInactive;
        }

        var term = await terms.FindByIdAsync(new AcademicTermId(command.TermId), ct);
        if (term is null)
        {
            return CommissionErrors.TermNotFound;
        }

        if (subject.TermKind != term.Kind)
        {
            return CommissionErrors.TermKindMismatch;
        }

        var careerPlan = await academic.GetCareerPlanByIdAsync(subject.CareerPlanId.Value, ct);
        if (careerPlan is null)
        {
            // Defensivo: no debería pasar (Subject solo se crea contra un CareerPlan existente), pero
            // sin FK cross-schema (ADR-0017) evitamos el NRE de abajo si el dato quedó huérfano.
            return CommissionErrors.SubjectNotFound;
        }

        if (careerPlan.UniversityId != term.UniversityId.Value)
        {
            return CommissionErrors.UniversityMismatch;
        }

        var trimmedName = command.Name.Trim();
        if (await commissions.ExistsByNameAsync(
            command.SubjectId, command.TermId, trimmedName, excludeId: null, ct))
        {
            return CommissionErrors.NameAlreadyExists;
        }

        var assignments = new List<(TeacherId TeacherId, CommissionTeacherRole Role)>();
        foreach (var item in command.Teachers)
        {
            var teacher = await teachers.GetByIdAsync(new TeacherId(item.TeacherId), ct);
            if (teacher is null)
            {
                return CommissionErrors.TeacherNotFound;
            }
            if (!teacher.IsActive)
            {
                return CommissionErrors.TeacherInactive;
            }
            if (teacher.UniversityId.Value != term.UniversityId.Value)
            {
                return CommissionErrors.UniversityMismatch;
            }
            assignments.Add((teacher.Id, item.Role));
        }

        var created = Commission.Create(
            command.SubjectId,
            command.TermId,
            command.Name,
            command.Modality,
            command.Capacity,
            command.Notes,
            clock);
        if (created.IsFailure)
        {
            return created.Error;
        }

        var commission = created.Value;
        foreach (var (teacherId, role) in assignments)
        {
            var assigned = commission.AssignTeacher(teacherId, role, clock);
            if (assigned.IsFailure)
            {
                return assigned.Error;
            }
        }

        var scheduled = commission.ReplaceSchedule(
            command.Schedule.Select(s => (s.Day, s.Start, s.End)), clock);
        if (scheduled.IsFailure)
        {
            return scheduled.Error;
        }

        await commissions.AddAsync(commission, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new CreateCommissionResponse(commission.Id.Value);
    }
}
