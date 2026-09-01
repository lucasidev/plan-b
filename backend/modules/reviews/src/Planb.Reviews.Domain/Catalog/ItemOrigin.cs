namespace Planb.Reviews.Domain.Catalog;

/// <summary>
/// De dónde salió la pregunta ([ADR-0084](../../../../../../docs/decisions/0084-free-text-feeds-curation-and-is-never-published.md)).
///
/// <para>
/// No es metadata de archivo: Método lo publica. Que una pregunta haya salido de lo que muchos
/// escribieron en el campo libre es parte de cómo se llegó a preguntarla, y quien audita un número
/// tiene derecho a saberlo. El instrumento evoluciona desde lo cualitativo, y esto es lo que deja
/// ver esa evolución.
/// </para>
/// </summary>
public enum ItemOrigin
{
    /// <summary>La escribimos nosotros para arrancar.</summary>
    Seed = 1,

    /// <summary>Salió del campo libre de muchos y entró al instrumento como versión nueva.</summary>
    Distilled = 2,
}
