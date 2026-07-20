using Planb.SharedKernel.Primitives;

namespace Planb.Planning.Domain.Availability;

/// <summary>
/// Errores del simulador de cuatrimestre, lado "available" (US-016).
///
/// <para>
/// Mismo hecho de negocio que <c>EnrollmentRecordErrors.StudentProfileRequired</c> en Enrollments:
/// se repite acá con su propio code porque Planning no puede referenciar el Domain de Identity
/// (ADR-0017), así que no hay forma de compartir el valor de <see cref="Error"/> entre BCs.
/// </para>
/// </summary>
public static class AvailabilityErrors
{
    /// <summary>
    /// Sin <c>StudentProfile</c> activo no hay <c>CareerPlan</c> para evaluar: 404, mismo criterio
    /// que <c>GetStudentProfileEndpoint</c> (Identity) y <c>EnrollmentRecordErrors.StudentProfileRequired</c>
    /// (Enrollments). Es un GET sobre "mi disponibilidad", y sin profile ese recurso no existe
    /// todavía para este user, no es un conflicto de estado de una escritura (por eso 404 y no 409).
    /// </summary>
    public static readonly Error StudentProfileRequired =
        Error.NotFound(
            "planning.simulator.student_profile_required",
            "The user does not have an active student profile.");
}
