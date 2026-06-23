namespace Planb.Academic.Application.Features.Search;

/// <summary>Body de GET /api/search: lista mixta de resultados discriminados por <c>Type</c>.</summary>
public sealed record SearchResponse(IReadOnlyList<SearchResultItem> Items);
