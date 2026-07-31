using Planb.Academic.Application.Contracts;
using Planb.Enrollments.Domain.EnrollmentRecords;
using Planb.SharedKernel.Primitives;

namespace Planb.Enrollments.Application.Services;

/// <summary>
/// Coherencia de las referencias cross-BC de una cursada: el período tiene que ser de la universidad
/// del alumno, y la comisión tiene que existir, ser de esa materia y, cuando el período viene
/// informado, ser de ese período.
///
/// <para>
/// Vive acá y no adentro de un handler porque el alta (US-013) y la edición (US-015) aplican
/// exactamente los mismos chequeos. Sin FKs cross-schema (ADR-0017) esto es lo único que sostiene
/// esas referencias, así que dos copias de estas reglas es una que se va a olvidar de actualizar.
/// </para>
/// </summary>
internal static class EnrollmentPlacement
{
    /// <summary>
    /// Tres errores separados para la comisión porque desde el cliente cada caso se arregla
    /// distinto: elegir otra comisión, corregir la materia, o corregir el cuatrimestre.
    ///
    /// <para>
    /// No se rechaza una comisión archivada: una cursada histórica puede apuntar legítimamente a
    /// una comisión que ya se dio de baja del catálogo. El alta de comisión sí la rechaza, que es
    /// donde corresponde.
    /// </para>
    /// </summary>
    public static async Task<Result> ValidateAsync(
        IAcademicQueryService academic,
        Guid universityId,
        Guid subjectId,
        Guid? commissionId,
        Guid? termId,
        CancellationToken ct)
    {
        if (termId is not null
            && !await academic.IsAcademicTermInUniversityAsync(termId.Value, universityId, ct))
        {
            return EnrollmentRecordErrors.TermNotInUniversity;
        }

        if (commissionId is null)
        {
            return Result.Success();
        }

        var placement = await academic.GetCommissionPlacementAsync(commissionId.Value, ct);
        if (placement is null)
        {
            return EnrollmentRecordErrors.CommissionNotFound;
        }

        if (placement.SubjectId != subjectId)
        {
            return EnrollmentRecordErrors.CommissionNotForSubject;
        }

        if (termId is not null && placement.TermId != termId.Value)
        {
            return EnrollmentRecordErrors.CommissionNotForTerm;
        }

        return Result.Success();
    }
}
