using Planb.Academic.Application.Contracts;
using Planb.Enrollments.Application.Abstractions.Persistence;
using Planb.Enrollments.Application.Services;
using Planb.Enrollments.Domain.EnrollmentRecords;
using Planb.Identity.Application.Contracts;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Enrollments.Application.Features.UpdateEnrollment;

/// <summary>
/// Handler de US-015 (editar entrada del historial). Flow:
/// <list type="number">
///   <item>Resolver el <see cref="StudentProfileSummary"/> activo del user (cross-BC via
///         <see cref="IIdentityQueryService"/>). Sin profile activo → NotFound.</item>
///   <item>Traer el record y chequear ownership. Un record ajeno devuelve el mismo NotFound que uno
///         inexistente: distinguirlos deja enumerar ids de otros alumnos.</item>
///   <item>Revalidar comisión y período contra el catálogo, igual que el alta: la edición puede
///         moverlos, y sin FKs cross-schema (ADR-0017) esto es lo único que los sostiene.</item>
///   <item>Mutar el aggregate con <see cref="EnrollmentRecord.Update"/>, que revalida el juego
///         completo de invariantes sobre el estado resultante.</item>
///   <item>SaveChanges solo si algo cambió: un payload idéntico es no-op.</item>
/// </list>
///
/// <para>
/// <b>No se revalida que la materia pertenezca al plan.</b> El alta ya lo validó y la materia no se
/// puede cambiar acá, así que volver a chequearlo solo abriría la puerta a rechazar una corrección
/// legítima porque el plan del alumno cambió después de haber cursado, que no tiene nada que ver
/// con lo que se está editando.
/// </para>
/// </summary>
public static class UpdateEnrollmentCommandHandler
{
    public static async Task<Result<UpdateEnrollmentResponse>> Handle(
        UpdateEnrollmentCommand command,
        IEnrollmentRecordRepository records,
        IEnrollmentsUnitOfWork unitOfWork,
        IIdentityQueryService identity,
        IAcademicQueryService academic,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var profile = await identity.GetStudentProfileForUserAsync(command.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return EnrollmentRecordErrors.StudentProfileRequired;
        }

        var record = await records.GetByIdAsync(
            new EnrollmentRecordId(command.EnrollmentRecordId), ct);

        // Ownership como parte del NotFound, no como un 403 aparte: responder distinto para "no
        // existe" y "no es tuyo" convierte el endpoint en un oráculo de ids ajenos.
        if (record is null || record.StudentProfileId != profile.Id)
        {
            return EnrollmentRecordErrors.NotFound;
        }

        var plan = await academic.GetCareerPlanByIdAsync(profile.CareerPlanId, ct);
        if (plan is null)
        {
            return EnrollmentRecordErrors.StudentProfileRequired;
        }

        var placementCheck = await EnrollmentPlacement.ValidateAsync(
            academic, plan.UniversityId, record.SubjectId,
            command.CommissionId, command.TermId, ct);
        if (placementCheck.IsFailure)
        {
            return placementCheck.Error;
        }

        var updateResult = record.Update(
            command.CommissionId,
            command.TermId,
            command.Status,
            command.ApprovalMethod,
            command.Grade,
            clock);

        if (updateResult.IsFailure)
        {
            return updateResult.Error;
        }

        var changed = updateResult.Value;
        if (changed)
        {
            await unitOfWork.SaveChangesAsync(ct);
        }

        return new UpdateEnrollmentResponse(
            record.Id.Value,
            record.StudentProfileId,
            record.SubjectId,
            record.CommissionId,
            record.TermId,
            record.Status.ToString(),
            record.ApprovalMethod?.ToString(),
            record.Grade?.Value,
            record.UpdatedAt,
            changed);
    }
}
