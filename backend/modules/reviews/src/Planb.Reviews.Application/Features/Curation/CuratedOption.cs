using Planb.Reviews.Domain.Catalog;

namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// Una opción de una frase tal como la manda el backoffice, en los tres caminos que la escriben:
/// destilar una pregunta del campo libre, editar una frase y abrir un código nuevo.
/// </summary>
public sealed record CuratedOption(short Value, short Order, string Label, OptionValence Valence);
