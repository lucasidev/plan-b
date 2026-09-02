namespace Planb.Reviews.Application.Features.Curation;

/// <summary>El body de abrir un código nuevo. El código viejo sale de la frase que se reemplaza.</summary>
public sealed record SupersedeItemRequest(
    string Code,
    string Text,
    string? Help,
    string Layer,
    IReadOnlyList<CuratedOptionRequest> Options);
