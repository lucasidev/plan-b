namespace Planb.Academic.Domain.Careers;

/// <summary>
/// Tipo de título que otorga una carrera (US-061, mock AdmOnbCarrera). <see cref="Grado"/> =
/// licenciaturas / ingenierías; <see cref="Posgrado"/> = maestrías / doctorados / especializaciones;
/// <see cref="Tecnicatura"/> = carreras cortas de pregrado.
/// </summary>
public enum CareerDegreeType
{
    Grado,
    Posgrado,
    Tecnicatura,
}
