namespace Planb.Reviews.Domain.Catalog;

/// <summary>
/// A qué ficha aterriza el dato de una frase (ADR-0085). Es metadato invisible: el que responde nunca
/// elige un sujeto, contesta sobre su cursada y el catálogo sabe dónde va cada respuesta.
///
/// <para>
/// La carrera y la unidad académica no están acá a propósito: no se reseñan, se derivan de las
/// cursadas con su cobertura declarada.
/// </para>
/// </summary>
public enum ItemSubject
{
    /// <summary>La cátedra que dictó: lo que hizo el equipo docente y lo que te pasó cursando con él.</summary>
    Chair,

    /// <summary>La materia en cualquier cátedra: el contenido, el régimen, los horarios, el costo.</summary>
    Subject,

    /// <summary>La institución: trámites, infraestructura, becas. Llegan por el instrumento administrativo.</summary>
    Institution,
}
