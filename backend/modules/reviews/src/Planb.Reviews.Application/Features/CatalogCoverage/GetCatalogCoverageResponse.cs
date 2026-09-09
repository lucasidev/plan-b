namespace Planb.Reviews.Application.Features.CatalogCoverage;

/// <summary>
/// El catálogo entero (US-222, SC-003): una entrada por carrera, con lo mínimo que ayuda a decidir
/// si vale abrirla antes de hacer el clic. Sin orden: lo decide quien arma la pantalla (alfabético
/// o por voces, nunca por cobertura ni por conveniencia, US-171).
/// </summary>
public sealed record GetCatalogCoverageResponse(IReadOnlyList<CareerCoverageView> Careers);

/// <summary>
/// Una carrera con las señales que dicen si hay algo para leer, ninguna un puntaje: si tiene datos
/// oficiales (ADR-0090), sus voces publicadas (Voces: cuántas personas reseñaron algo de ella,
/// respetando el piso por cátedra) y su cobertura (<see cref="CoveredSubjects"/> de
/// <see cref="TotalSubjects"/> materias del plan vigente). Una carrera sin nada trae todo en
/// cero/false: sigue en la lista, el vacío es información (US-139).
/// </summary>
public sealed record CareerCoverageView(
    Guid CareerId,
    string CareerName,
    Guid UniversityId,
    string UniversityName,
    /// <summary>US-088: carreras cargadas por alumnos (crowdsourced) tienen IsOfficial=false. No es lo mismo que <see cref="HasOfficialData"/> (ADR-0090, la afirmación relevada con fuente).</summary>
    bool IsOfficial,
    bool HasOfficialData,
    int VoiceCount,
    /// <summary>
    /// Hay reseñas de esta carrera que todavía no cruzan el piso de alguna cátedra: existe
    /// actividad aunque <see cref="VoiceCount"/> no la sume. Distingue "nadie reseñó" de "están
    /// reseñando, todavía no publica", sin exponer cuántas son.
    /// </summary>
    bool HasReviewsBelowFloor,
    int TotalSubjects,
    int CoveredSubjects);
