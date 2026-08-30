namespace Planb.Reviews.Application.Features.CareerFacts;

/// <summary>
/// La ficha de una carrera tal como la pantalla la dibuja (US-134, ADR-0085).
///
/// <para>
/// Alcance acotado a lo que tiene fuente real hoy: identidad, cuánto dura en el papel (la otra
/// mitad de US-127, "dura en la realidad" contra egreso por cohorte, es relevamiento propio que
/// todavía no existe) y la cobertura (US-134). Lo que la ficha completa pide y no entra todavía
/// ("qué frena la cursada", la nota de curaduría) necesita un corpus de reseñas que hoy es cero:
/// no viaja acá.
/// </para>
/// </summary>
public sealed record GetCareerFactsResponse(
    Guid CareerId,
    string CareerName,
    string UniversityName,
    int? DurationYears,
    int TotalSubjects,
    int CoveredSubjects,
    int CoveragePercent);
