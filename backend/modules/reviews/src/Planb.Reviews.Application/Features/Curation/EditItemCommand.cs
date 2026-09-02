using Planb.Reviews.Domain.Catalog;

namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// Editar una frase sin cambiar lo que pregunta (US-198): su texto, su ayuda, su capa y sus opciones,
/// todo junto. El código no viaja porque no se toca: es la identidad semántica de la frase y lo que
/// mantiene comparable la serie.
///
/// <para>
/// Que el significado no cambie es una afirmación de quien cura, no algo que el sistema pueda
/// verificar. Por eso este comando y <see cref="SupersedeItemCommand"/> son dos y no uno con un
/// flag: son dos actos distintos con dos consecuencias distintas sobre el dato ya publicado.
/// </para>
/// </summary>
public sealed record EditItemCommand(
    Guid ItemId,
    string Text,
    string? Help,
    ItemLayer Layer,
    IReadOnlyList<CuratedOption> Options,
    Guid ChangedBy);
