namespace Planb.Planning.Application.Features.GetAvailableSubjects;

/// <summary>
/// Una franja horaria de cursada, lista para display (US-096): día como nombre del enum
/// (<c>"Monday"</c>..<c>"Sunday"</c>) y horas como <c>"HH:mm"</c>. Compartida entre
/// GetAvailableSubjects (oferta de comisiones de un término) y EvaluateSimulation (bloques de las
/// comisiones elegidas + detección de choques): mismo shape que <c>CommissionScheduleItem</c>
/// (Academic.Application.Contracts) y <c>AdminCommissionScheduleItem</c> (Academic), pero vive acá
/// porque Planning cruza ese schema con Dapper (ADR-0017): no se puede reusar el tipo de Academic
/// desde este módulo.
/// </summary>
public sealed record SimulatorScheduleItem(string Day, string Start, string End);
