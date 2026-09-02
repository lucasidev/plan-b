using Planb.Reviews.Domain.Catalog;

namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// Abrir un código nuevo porque cambió lo que se pregunta (US-198, E2). La frase de
/// <see cref="ItemId"/> deja de ofrecerse y en su lugar entra otra, con <see cref="Code"/> nuevo,
/// que arranca su serie desde cero.
///
/// <para>
/// El sujeto y el origen no viajan: los hereda de la frase que reemplaza. Cambiar de sujeto no sería
/// una pregunta nueva de la misma cosa sino otra cosa, y el origen dice de dónde salió la pregunta
/// (la escribimos nosotros o la destilamos del campo libre), que no cambia porque se la reformule.
/// </para>
/// </summary>
public sealed record SupersedeItemCommand(
    Guid ItemId,
    string Code,
    string Text,
    string? Help,
    ItemLayer Layer,
    IReadOnlyList<CuratedOption> Options,
    Guid ChangedBy);
