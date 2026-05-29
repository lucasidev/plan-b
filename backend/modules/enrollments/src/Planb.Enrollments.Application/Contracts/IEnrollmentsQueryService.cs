namespace Planb.Enrollments.Application.Contracts;

/// <summary>
/// Read-side de Enrollments exportado a otros bounded contexts (ADR-0017: cross-BC reads via
/// Contracts, sin FK Postgres ni nav properties EF cross-schema).
///
/// Distinto de servicios internos del módulo (que pueden hidratar el aggregate completo): este
/// contract expone vistas mínimas <c>EnrollmentSummary</c> que cubren lo que los callers
/// externos realmente necesitan para validar.
///
/// Mantener mínimo. Solo agregar métodos cuando un caller real los necesite.
/// </summary>
public interface IEnrollmentsQueryService
{
    /// <summary>
    /// Devuelve el summary del enrollment, o null si no existe.
    ///
    /// Caller principal: handler de US-017 (publicar reseña) que necesita:
    ///   1) chequear que el enrollment es del user actual (cruza <see cref="EnrollmentSummary.StudentProfileId"/>
    ///      con el StudentProfile resuelto desde Identity),
    ///   2) chequear que el status es elegible para reseña (no <c>Cursando</c>),
    ///   3) tomar el <see cref="EnrollmentSummary.CommissionId"/> para futuras validaciones de
    ///      docente en la commission (cuando aterricen los aggregates Commission + Teacher en
    ///      Academic).
    /// </summary>
    Task<EnrollmentSummary?> GetEnrollmentByIdAsync(
        Guid enrollmentId, CancellationToken ct = default);
}
