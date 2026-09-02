namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// El body de destilar una pregunta. La capa y el sujeto viajan como string y los parsea el
/// endpoint: un enum no bindea directo desde JSON, y un typo saldría como 500 en vez de como el 400
/// con su mensaje que corresponde.
/// </summary>
public sealed record DistilItemRequest(
    string Code,
    string Text,
    string? Help,
    string Layer,
    string Subject,
    IReadOnlyList<CuratedOptionRequest> Options);
