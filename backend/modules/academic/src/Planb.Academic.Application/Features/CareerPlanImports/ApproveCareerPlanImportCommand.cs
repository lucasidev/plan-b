namespace Planb.Academic.Application.Features.CareerPlanImports;

/// <summary>
/// El alumno revisó el preview del parser y aprueba (con sus eventuales overrides). Esto crea
/// Career (si no existe) + CareerPlan + Subjects en bloque, todos isOfficial=false.
/// </summary>
public sealed record ApproveCareerPlanImportCommand(
    Guid UserId,
    Guid ImportId,
    IReadOnlyList<ApproveSubjectItem> Items);

/// <summary>
/// Item editable del preview. El alumno selecciona qué materias entran al plan y puede
/// override del parser (cambiar nombre, año, cuatri). El backend confía estos valores.
///
/// <para>
/// Code y TermKind son opcionales, como en el aggregate (ADR-0097): el parser no siempre los
/// detecta, y lo que no trae el item queda null, no se inventa.
/// </para>
/// </summary>
public sealed record ApproveSubjectItem(
    string? Code,
    string Name,
    int YearInPlan,
    int? TermInYear,
    string? TermKind);
