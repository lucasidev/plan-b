namespace Planb.Academic.Application.Abstractions.Georef;

/// <summary>Localidad resuelta contra Georef, con su identificador y nombre canónico.</summary>
public sealed record GeorefLocality(string Id, string Name);

/// <summary>Puerto para resolver una localidad textual dentro de una provincia.</summary>
public interface IGeorefLocalityResolver
{
    Task<GeorefLocality?> ResolveAsync(string localityText, string province, CancellationToken ct = default);
}
