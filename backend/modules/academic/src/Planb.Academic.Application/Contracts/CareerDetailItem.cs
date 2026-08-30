namespace Planb.Academic.Application.Contracts;

/// <summary>
/// Identidad de una carrera con el nombre de su universidad ya resuelto. Caller: la ficha pública
/// de carrera (reviews, US-134), que se lee sola sin haber pasado por el listado de una
/// universidad puntual.
/// </summary>
public sealed record CareerDetailItem(
    Guid Id,
    string Name,
    int? DurationYears,
    string UniversityName);
