namespace Planb.Academic.Application.Features.AdminCareerPlans;

/// <summary>
/// Alta de un plan de estudios para una carrera (US-061, admin). El año no puede repetirse para la
/// misma carrera (constraint UNIQUE(career_id, year)); nace Active y oficial (creado por
/// backoffice, a diferencia del import crowdsourced de US-088).
/// </summary>
public sealed record CreateCareerPlanCommand(Guid CareerId, int Year);
