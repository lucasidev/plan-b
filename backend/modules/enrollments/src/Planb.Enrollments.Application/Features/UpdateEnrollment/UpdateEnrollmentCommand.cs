using Planb.Enrollments.Domain.EnrollmentRecords;

namespace Planb.Enrollments.Application.Features.UpdateEnrollment;

/// <summary>
/// Editar una cursada propia del alumno autenticado (US-015). El caso que la motiva es el cierre de
/// cuatrimestre: la cursada que arrancó como <c>Cursando</c> pasa a su estado final.
///
/// <para>
/// Lleva el estado académico completo, no un delta. Las invariantes del aggregate son cruzadas
/// (status contra nota y método, método contra comisión y período), así que validar un cambio
/// parcial obliga igual a componer el estado resultante entero. Mandar los cinco campos evita
/// además la ambigüedad de distinguir "no lo mandé" de "mandé null", que acá es una diferencia real:
/// volver una cursada a <c>Cursando</c> significa borrarle la nota.
/// </para>
///
/// <para>
/// El alumno y la materia no viajan porque no se pueden cambiar: cambiar cualquiera de los dos no
/// es editar esta cursada sino cargar otra, y arrastraría la reseña anclada a un
/// <c>EnrollmentRecord</c> que ya no habla de lo mismo (ADR-0005).
/// </para>
/// </summary>
public sealed record UpdateEnrollmentCommand(
    Guid UserId,
    Guid EnrollmentRecordId,
    Guid? CommissionId,
    Guid? TermId,
    EnrollmentStatus Status,
    ApprovalMethod? ApprovalMethod,
    decimal? Grade);
