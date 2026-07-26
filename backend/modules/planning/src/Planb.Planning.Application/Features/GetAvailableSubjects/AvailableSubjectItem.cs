namespace Planb.Planning.Application.Features.GetAvailableSubjects;

/// <summary>
/// Una materia del plan evaluada para el simulador (US-016). <see cref="Status"/> es el nombre del
/// enum <c>AvailabilityStatus</c> (Available/Blocked/AlreadyPassed/AlreadyRegularized/InProgress),
/// mismo criterio que <c>PrerequisiteEdgeItem.Type</c> en Academic: el backend serializa el nombre
/// del enum tal cual, la traducción a texto para el alumno es responsabilidad del frontend.
///
/// <para>
/// <see cref="Commissions"/> es la oferta de esa materia en un término puntual (US-096): viaja
/// vacía cuando el caller de GET /available no pasó <c>termId</c>, y con la oferta activa completa
/// (docentes + horario) cuando sí lo pasó. Es el insumo para elegir comisión y, después, para
/// detectar choques en POST /evaluate.
/// </para>
/// </summary>
public sealed record AvailableSubjectItem(
    Guid Id,
    string Code,
    string Name,
    int YearInPlan,
    int? TermInYear,
    string TermKind,
    int WeeklyHours,
    int TotalHours,
    string Status,
    IReadOnlyList<BlockedBySubjectItem> BlockedBy,
    IReadOnlyList<AvailableCommissionItem> Commissions);
