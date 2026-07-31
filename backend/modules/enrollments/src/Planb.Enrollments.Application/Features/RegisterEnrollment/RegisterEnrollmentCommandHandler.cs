using Planb.Academic.Application.Contracts;
using Planb.Enrollments.Application.Abstractions.Persistence;
using Planb.Enrollments.Application.Services;
using Planb.Enrollments.Domain.EnrollmentRecords;
using Planb.Identity.Application.Contracts;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Enrollments.Application.Features.RegisterEnrollment;

/// <summary>
/// Handler de US-013 (cargar historial manual). Flow:
/// <list type="number">
///   <item>Resolver el <see cref="StudentProfileSummary"/> activo del user (cross-BC via
///         <see cref="IIdentityQueryService"/>). Sin profile activo → NotFound.</item>
///   <item>Validar que el subject pertenece al plan del student (cross-BC via
///         <see cref="IAcademicQueryService.IsSubjectInPlanAsync"/>). Sin pertenencia →
///         Validation.</item>
///   <item>Validar comisión y período, que llegan como Guids libres del cliente: el período tiene
///         que ser de la universidad del alumno, y la comisión tiene que existir y ser de esa
///         materia en ese período. Sin FK que lo sostenga (ADR-0017), es el único chequeo.</item>
///   <item>Chequear idempotencia: ya existe un record para (student, subject, term)? Devolver
///         409 Conflict en vez de explotar contra UNIQUE.</item>
///   <item>Crear el aggregate con <see cref="EnrollmentRecord.Create"/> (enforce invariantes
///         status/grade/approval_method/commission/term).</item>
///   <item>AddAsync. SaveChanges lo hace el middleware Wolverine [Transactional].</item>
/// </list>
/// </summary>
public static class RegisterEnrollmentCommandHandler
{
    public static async Task<Result<RegisterEnrollmentResponse>> Handle(
        RegisterEnrollmentCommand command,
        IEnrollmentRecordRepository records,
        IEnrollmentsUnitOfWork unitOfWork,
        IIdentityQueryService identity,
        IAcademicQueryService academic,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        // 1) Profile activo del user.
        var profile = await identity.GetStudentProfileForUserAsync(command.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return EnrollmentRecordErrors.StudentProfileRequired;
        }

        // 2) Subject pertenece al plan del student.
        var subjectInPlan = await academic.IsSubjectInPlanAsync(
            command.SubjectId, profile.CareerPlanId, ct);
        if (!subjectInPlan)
        {
            return EnrollmentRecordErrors.SubjectNotInPlan;
        }

        // 3) Coherencia de comisión y período, que llegan del cliente como Guids libres. Sin FK que
        // los sostenga (ADR-0017), esto es lo único que los valida. Antes pasaba cualquier Guid, y
        // con eso se podía anclar la cursada a la comisión de OTRA materia: después publicar reseña
        // pasa su gate (valida que el docente esté en la comisión de la cursada) y queda una reseña
        // contra un docente que nunca dio esa clase, colgada además de la materia equivocada.
        var plan = await academic.GetCareerPlanByIdAsync(profile.CareerPlanId, ct);
        if (plan is null)
        {
            return EnrollmentRecordErrors.StudentProfileRequired;
        }

        var placementCheck = await EnrollmentPlacement.ValidateAsync(
            academic, plan.UniversityId, command.SubjectId,
            command.CommissionId, command.TermId, ct);
        if (placementCheck.IsFailure)
        {
            return placementCheck.Error;
        }

        // 4) Idempotencia.
        var alreadyExists = await records.ExistsAsync(
            profile.Id, command.SubjectId, command.TermId, ct);
        if (alreadyExists)
        {
            return EnrollmentRecordErrors.Duplicate;
        }

        // 5) Aggregate.
        var recordResult = EnrollmentRecord.Create(
            profile.Id,
            command.SubjectId,
            command.CommissionId,
            command.TermId,
            command.Status,
            command.ApprovalMethod,
            command.Grade,
            clock);

        if (recordResult.IsFailure)
        {
            return recordResult.Error;
        }

        var record = recordResult.Value;
        await records.AddAsync(record, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new RegisterEnrollmentResponse(
            record.Id.Value,
            record.StudentProfileId,
            record.SubjectId,
            record.CommissionId,
            record.TermId,
            record.Status.ToString(),
            record.ApprovalMethod?.ToString(),
            record.Grade?.Value,
            record.CreatedAt);
    }
}
