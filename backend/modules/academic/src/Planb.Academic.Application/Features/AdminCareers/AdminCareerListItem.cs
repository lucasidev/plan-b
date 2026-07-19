namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>
/// Fila del listado admin de carreras de una universidad. Record property-init (no posicional):
/// Dapper mapea por nombre de columna.
/// </summary>
public sealed record AdminCareerListItem
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string? ShortName { get; init; }
    public string? Code { get; init; }
    public bool IsOfficial { get; init; }
    public bool IsActive { get; init; }

    /// <summary>Cantidad de planes de estudio asociados (para el badge del listado admin).</summary>
    public int PlanCount { get; init; }
}
