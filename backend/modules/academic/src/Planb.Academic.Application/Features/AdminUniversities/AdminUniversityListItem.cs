namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>
/// Fila del listado admin de universidades. Record property-init (no posicional): Dapper mapea
/// por nombre de columna. <see cref="InstitutionalEmailDomains"/> es <c>string[]</c> (no
/// <c>IReadOnlyList&lt;string&gt;</c>) porque así es como Npgsql/Dapper materializan un
/// <c>text[]</c> de Postgres sin conversión adicional.
/// </summary>
public sealed record AdminUniversityListItem
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string[] InstitutionalEmailDomains { get; init; } = [];
    public bool IsActive { get; init; }

    /// <summary>Cantidad de careers del catálogo asociadas (para el badge del listado admin).</summary>
    public int CareerCount { get; init; }
}
