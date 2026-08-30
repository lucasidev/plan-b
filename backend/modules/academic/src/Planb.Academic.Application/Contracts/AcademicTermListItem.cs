namespace Planb.Academic.Application.Contracts;

/// <summary>
/// DTO para el listado de períodos lectivos de una universidad. Pensado originalmente para el
/// form de carga de historial (US-013, retirado por ADR-0086), que necesitaba un select con los
/// terms en los que el alumno cursó/aprobó cada materia.
///
/// <para>
/// <see cref="Label"/> es la representación human-readable del período (ej. "2026-C1"); el
/// cliente la muestra tal cual. <see cref="Year"/> y <see cref="Number"/> quedan disponibles
/// para sorting cliente-side sin tener que parsear el label.
/// </para>
///
/// <para>
/// <see cref="StartDate"/> y <see cref="EndDate"/> las agrega US-096: el planificador arranca
/// posicionado en el período que viene, y "cuál viene" se decide comparando fechas contra hoy.
/// Sin ellas el cliente solo podía caer en "el más reciente de la lista", que es otra cosa.
/// </para>
/// </summary>
public sealed record AcademicTermListItem(
    Guid Id,
    Guid UniversityId,
    int Year,
    int Number,
    string Kind,
    string Label,
    DateOnly StartDate,
    DateOnly EndDate);
