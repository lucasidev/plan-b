namespace Planb.Academic.Application.Contracts;

/// <summary>
/// DTO para el listado público de planes de una carrera. Expuesto como
/// GET /api/academic/career-plans?careerId={id} (US-037 onboarding cascada).
///
/// <para>
/// Year es el año del plan (no de ingreso del alumno). Status indica si el plan está vigente
/// o no: viene serializado por EF (HasConversion&lt;string&gt;) con los valores del enum
/// CareerPlanStatus (Active | Deprecated). El cliente filtra "Active" para no ofrecer planes
/// históricos al user de onboarding.
/// </para>
/// <para>
/// IsOfficial diferencia los planes seedeados / cargados por backoffice (true) de los
/// crowdsourced por alumnos via US-088 (false). El frontend muestra badge "No oficial" cuando
/// es false.
/// </para>
/// </summary>
public sealed record CareerPlanListItem(
    Guid Id,
    Guid CareerId,
    int Year,
    string Status,
    bool IsOfficial);
