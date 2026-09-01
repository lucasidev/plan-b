using Planb.Reviews.Domain.Catalog;

namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// Destilar una pregunta nueva del campo libre (ADR-0084): si mucha gente escribe variaciones de lo
/// mismo, eso se convierte en un ítem cerrado y entra al instrumento como versión nueva.
///
/// <para>
/// No es "crear un ítem suelto". El instrumento es lo que la pantalla de reseñar ofrece y lo que
/// Método publica, así que un ítem que no entra a una versión no existe para nadie: por eso el alta
/// y la versión nueva son la misma operación.
/// </para>
/// </summary>
public sealed record DistilItemCommand(
    string Code,
    string Text,
    string? Help,
    ItemLayer Layer,
    ItemSubject Subject,
    IReadOnlyList<DistilledOption> Options);

/// <summary>Una opción de la pregunta destilada, tal como la va a ver quien reseña.</summary>
public sealed record DistilledOption(short Value, short Order, string Label, OptionValence Valence);
