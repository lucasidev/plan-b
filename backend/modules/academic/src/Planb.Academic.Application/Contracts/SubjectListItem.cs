namespace Planb.Academic.Application.Contracts;

/// <summary>
/// DTO para el listado de materias de un CareerPlan. Caller principal: el form de carga de
/// historial (US-013) que necesita un select con las materias del plan del alumno. Caller
/// secundario (futuro): backoffice admin de catálogo.
///
/// <para>
/// Incluye <see cref="CareerPlanId"/> para que el cliente pueda asociar la lista al plan
/// activo sin tener que mantenerlo aparte (mismo razonamiento que <c>CareerListItem.UniversityId</c>).
/// </para>
/// </summary>
public sealed record SubjectListItem(
    Guid Id,
    Guid CareerPlanId,
    string Code,
    string Name,
    int YearInPlan,
    int? TermInYear,
    string TermKind);
