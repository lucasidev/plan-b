namespace Planb.Academic.Application.Features.AdminCareerPlans;

/// <summary>
/// Alta de un plan de estudios para una carrera (US-061, admin). El año no puede repetirse para la
/// misma carrera (constraint UNIQUE(career_id, year)); nace Active y oficial (creado por
/// backoffice, a diferencia del import crowdsourced de US-088). Label es una etiqueta editorial
/// opcional (ej. "plan-2023"); el year sigue siendo la clave de unicidad.
/// </summary>
public sealed record CreateCareerPlanCommand(Guid CareerId, int Year, string? Label = null);
