namespace Planb.Academic.Application.Contracts;

/// <summary>
/// DTO para el listado de períodos lectivos de una universidad. Caller principal: el form de
/// carga de historial (US-013) que necesita un select con los terms en los que el alumno
/// cursó/aprobó cada materia.
///
/// <para>
/// <see cref="Label"/> es la representación human-readable del período (ej. "2026·1c"); el
/// cliente la muestra tal cual. <see cref="Year"/> y <see cref="Number"/> quedan disponibles
/// para sorting cliente-side sin tener que parsear el label.
/// </para>
/// </summary>
public sealed record AcademicTermListItem(
    Guid Id,
    Guid UniversityId,
    int Year,
    int Number,
    string Kind,
    string Label);
