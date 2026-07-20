namespace Planb.Academic.Application.Features.AdminPrerequisites;

/// <summary>
/// Grafo entero de correlativas de un plan (los dos types juntos, US-062): el frontend arma las dos
/// listas (para_cursar / para_rendir) filtrando client-side por <see cref="PrerequisiteEdgeItem.Type"/>.
/// </summary>
public sealed record PrerequisiteGraphResponse(IReadOnlyList<PrerequisiteEdgeItem> Items);
