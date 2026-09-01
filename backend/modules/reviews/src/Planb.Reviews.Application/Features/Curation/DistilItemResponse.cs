namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// Lo que deja destilar: el ítem nuevo y la versión del instrumento que lo estrena. La versión es
/// el dato que importa, porque es el corte: lo que se responda desde ahora se cuenta bajo este ítem
/// y no se compara con nada de antes, que no lo tenía.
/// </summary>
public sealed record DistilItemResponse(Guid ItemId, string Code, short InstrumentVersion);
