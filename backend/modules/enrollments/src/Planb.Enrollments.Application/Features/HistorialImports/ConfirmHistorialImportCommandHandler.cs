using Planb.Enrollments.Application.Abstractions.Persistence;
using Planb.Enrollments.Domain.EnrollmentRecords;
using Planb.Enrollments.Domain.HistorialImports;
using Planb.Identity.Application.Contracts;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Enrollments.Application.Features.HistorialImports;

/// <summary>
/// Handler del POST /confirm. Crea <c>EnrollmentRecord</c> por cada <see cref="ConfirmedItem"/>
/// del payload, respetando los records existentes (conflict resolution: si la triple
/// (student, subject, term) ya tiene un record, skip silencioso y log en summary).
///
/// <list type="number">
///   <item>Validar ownership: el import pertenece al student profile del user actual.</item>
///   <item>Validar estado: solo se puede confirmar si está en <c>Parsed</c>.</item>
///   <item>Para cada item:
///     <list type="bullet">
///       <item>Si ya existe un EnrollmentRecord con (student, subject, term) → skip + count.</item>
///       <item>Si no, crear el aggregate con <c>EnrollmentRecord.Create</c> (invariantes
///             del data-model aplican: status/grade coherencia, etc.). Si falla algún
///             invariante, retornar 400 con el primer error.</item>
///       <item>Add al repo.</item>
///     </list>
///   </item>
///   <item>Transicionar el import a <c>Confirmed</c>.</item>
///   <item>SaveChanges atómico: o todo o nada.</item>
/// </list>
/// </summary>
public static class ConfirmHistorialImportCommandHandler
{
    public static async Task<Result<ConfirmHistorialImportResponse>> Handle(
        ConfirmHistorialImportCommand command,
        IHistorialImportRepository imports,
        IEnrollmentRecordRepository records,
        IEnrollmentsUnitOfWork unitOfWork,
        IIdentityQueryService identity,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var profile = await identity.GetStudentProfileForUserAsync(command.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return HistorialImportErrors.StudentProfileRequired;
        }

        var import = await imports.FindByIdForOwnerAsync(
            new HistorialImportId(command.ImportId), profile.Id, ct);
        if (import is null)
        {
            return HistorialImportErrors.NotFound;
        }

        if (import.Status != HistorialImportStatus.Parsed)
        {
            return HistorialImportErrors.NotReadyForConfirm;
        }

        var created = 0;
        var skipped = 0;

        foreach (var item in command.Items)
        {
            var exists = await records.ExistsAsync(profile.Id, item.SubjectId, item.TermId, ct);
            if (exists)
            {
                skipped++;
                continue;
            }

            if (!Enum.TryParse<EnrollmentStatus>(item.Status, ignoreCase: true, out var status))
            {
                return EnrollmentRecordErrors.GradeOutOfRange; // status inválido — surface 400
            }

            ApprovalMethod? method = null;
            if (!string.IsNullOrWhiteSpace(item.ApprovalMethod))
            {
                if (!Enum.TryParse<ApprovalMethod>(item.ApprovalMethod, ignoreCase: true, out var parsed))
                {
                    return EnrollmentRecordErrors.GradeOutOfRange;
                }
                method = parsed;
            }

            var recordResult = EnrollmentRecord.Create(
                studentProfileId: profile.Id,
                subjectId: item.SubjectId,
                commissionId: null, // el import no propaga commissionId (US-014 lo deja null)
                termId: item.TermId,
                status: status,
                approvalMethod: method,
                grade: item.Grade,
                clock: clock);

            if (recordResult.IsFailure)
            {
                return recordResult.Error;
            }

            await records.AddAsync(recordResult.Value, ct);
            created++;
        }

        var confirmTransition = import.MarkConfirmed(clock);
        if (confirmTransition.IsFailure)
        {
            return confirmTransition.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new ConfirmHistorialImportResponse(
            Id: import.Id.Value,
            CreatedCount: created,
            SkippedCount: skipped);
    }
}
