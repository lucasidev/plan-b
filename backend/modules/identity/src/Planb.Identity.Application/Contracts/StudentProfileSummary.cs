namespace Planb.Identity.Application.Contracts;

/// <summary>
/// Vista cross-BC del <c>StudentProfile</c> de un user. Diseñado para que otros bounded contexts
/// (Enrollments, Reviews, Planning) validen identidad estudiantil + acceso a su plan sin tener
/// que hidratar el aggregate completo ni hacer JOIN cross-schema (ADR-0017).
///
/// <para>
/// Mínimo necesario: IDs para referencias, <see cref="CareerPlanId"/> para validar pertenencia
/// de subjects (US-013), <see cref="IsActive"/> para gatear comandos (ej. no se puede cargar
/// historial sobre un profile graduado o abandonado).
/// </para>
///
/// <para>
/// No incluye email, password hash ni datos sensibles del User: cada cross-BC consumer solo
/// necesita la identidad estudiantil. Si más tarde algún caller necesita el role del User
/// dueño del profile, se agrega acá.
/// </para>
/// </summary>
public sealed record StudentProfileSummary(
    Guid Id,
    Guid UserId,
    Guid CareerId,
    Guid CareerPlanId,
    bool IsActive);
