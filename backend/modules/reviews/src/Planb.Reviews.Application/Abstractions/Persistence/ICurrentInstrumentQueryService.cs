namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Read del cuestionario vigente: lo que la pantalla Reseñar ofrece (US-146, ADR-0082). Es público
/// y sin cuenta, porque ver qué se pregunta es parte de saber en qué te estás metiendo; producir la
/// respuesta sí pide cuenta.
/// </summary>
public interface ICurrentInstrumentQueryService
{
    /// <summary>
    /// La versión vigente del cuestionario con ese código, con sus ítems y opciones en orden. Null
    /// si ese cuestionario todavía no se publicó.
    /// </summary>
    Task<CurrentInstrumentView?> GetCurrentAsync(string code, CancellationToken ct = default);
}

/// <summary>El cuestionario tal como se ofrece: su versión y sus ítems en orden.</summary>
public sealed record CurrentInstrumentView(
    string Code,
    short Version,
    IReadOnlyList<InstrumentItemView> Items);

/// <summary>
/// Un ítem del cuestionario. Lleva su <see cref="Layer"/> porque la pantalla agrupa por capa
/// (el contexto, qué hizo la cátedra, qué te pasó a vos).
///
/// <para>
/// <b>No lleva la valencia de sus opciones a propósito.</b> La valencia decide qué se pinta de rojo
/// en la ficha, y la recolección va sin alarma: teñir una opción mientras alguien responde es
/// sugerirle la respuesta. Es la misma razón por la que el boceto de Reseñar no tiene un solo
/// acento de color.
/// </para>
/// </summary>
public sealed record InstrumentItemView(
    string Code,
    string Text,
    string? Help,
    string Layer,
    /// <summary>
    /// De dónde salió la pregunta: <c>Seed</c> si la escribimos nosotros para arrancar,
    /// <c>Distilled</c> si salió del campo libre de muchos (ADR-0084). Método lo publica: es parte
    /// de cómo se llegó a preguntarla, y quien audita un número tiene derecho a saberlo.
    /// </summary>
    string Origin,
    IReadOnlyList<InstrumentOptionView> Options);

/// <summary>Una opción: el valor que se manda al responder y la etiqueta que se lee.</summary>
public sealed record InstrumentOptionView(short Value, string Label);
