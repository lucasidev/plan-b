using Planb.Enrollments.Domain.EnrollmentRecords;

namespace Planb.Enrollments.Application.Features.RegisterEnrollment;

/// <summary>
/// Cargar una entrada del historial académico del alumno autenticado (US-013).
///
/// Recibe el <see cref="UserId"/> explícito (workaround pre-JWT, mismo patrón que
/// <c>CreateStudentProfileCommand</c>). El handler resuelve el <c>StudentProfile</c> activo
/// del user via <c>IIdentityQueryService</c>.
///
/// Los campos opcionales (<see cref="CommissionId"/>, <see cref="TermId"/>, <see cref="ApprovalMethod"/>,
/// <see cref="Grade"/>) los enforca el aggregate según el <see cref="Status"/> elegido.
/// </summary>
public sealed record RegisterEnrollmentCommand(
    Guid UserId,
    Guid SubjectId,
    Guid? CommissionId,
    Guid? TermId,
    EnrollmentStatus Status,
    ApprovalMethod? ApprovalMethod,
    decimal? Grade);
