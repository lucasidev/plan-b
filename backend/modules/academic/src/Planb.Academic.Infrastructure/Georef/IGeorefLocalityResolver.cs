namespace Planb.Academic.Infrastructure.Georef;

/// <summary>Localidad resuelta contra Georef: su id y su nombre canónico.</summary>
public sealed record GeorefLocality(string Id, string Name);

/// <summary>
/// Resuelve el texto de una localidad de Tucumán contra la API de Georef (apis.datos.gob.ar,
/// R6 tarea 19). Corre al sembrar el catálogo, no en cada request: la localidad queda guardada en
/// <c>AcademicUnit</c>. Si Georef no responde o no encuentra nada, devuelve null: nunca lanza para
/// eso, porque el seed tiene que terminar igual.
/// </summary>
public interface IGeorefLocalityResolver
{
    Task<GeorefLocality?> ResolveAsync(string localityText, CancellationToken ct = default);
}
