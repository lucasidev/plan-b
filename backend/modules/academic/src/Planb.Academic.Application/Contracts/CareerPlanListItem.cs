namespace Planb.Academic.Application.Contracts;

/// <summary>
/// DTO para el listado público de planes de una carrera. Expuesto como
/// GET /api/academic/career-plans?careerId={id} (US-037 onboarding cascada).
///
/// Year es el año del plan (no de ingreso del alumno). Status indica si el plan está vigente
/// o no (draft / current / deprecated, ver CareerPlanStatus en domain). El cliente filtra
/// "current" para no ofrecer planes en deuda al user de onboarding.
/// </summary>
public sealed record CareerPlanListItem(
    Guid Id,
    Guid CareerId,
    int Year,
    string Status);
