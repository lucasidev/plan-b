using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

using Planb.Academic.Application.Abstractions.Georef;

namespace Planb.Academic.Infrastructure.Georef;

/// <summary>
/// Cliente HTTP de <see cref="IGeorefLocalityResolver"/>. Prueba primero <c>/localidades</c>
/// (resuelve siete de las nueve localidades de la Guía SIU); si no encuentra nada, cae a
/// <c>/asentamientos</c> (las dos rurales que no son localidad Georef: Amaicha del Llano y
/// Leocadio Paz). Cualquier falla de red, timeout o respuesta inesperada se loguea como warning y
/// devuelve null: nunca rompe el seed (verificado el 2026-09-09 contra las nueve localidades).
/// </summary>
internal sealed class GeorefLocalityResolver : IGeorefLocalityResolver
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _http;
    private readonly ILogger<GeorefLocalityResolver> _logger;

    public GeorefLocalityResolver(HttpClient http, ILogger<GeorefLocalityResolver> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<GeorefLocality?> ResolveAsync(
        string localityText,
        string province,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(localityText);
        ArgumentException.ThrowIfNullOrWhiteSpace(province);

        try
        {
            var found = await QueryAsync("localidades", localityText, province, ct)
                ?? await QueryAsync("asentamientos", localityText, province, ct);

            if (found is null)
            {
                _logger.LogWarning(
                    "Georef: ninguna localidad ni asentamiento resolvió {LocalityText}. " +
                    "La unidad académica queda sin localidad.",
                    localityText);
            }

            return found;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            _logger.LogWarning(
                ex,
                "Georef no respondió para {LocalityText}. La unidad académica queda sin localidad.",
                localityText);
            return null;
        }
    }

    private async Task<GeorefLocality?> QueryAsync(
        string endpoint,
        string localityText,
        string province,
        CancellationToken ct)
    {
        var url = $"{endpoint}?nombre={Uri.EscapeDataString(localityText)}&provincia={Uri.EscapeDataString(province)}&campos=id,nombre";
        using var response = await _http.GetAsync(url, ct);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        var payload = await JsonSerializer.DeserializeAsync<GeorefResponse>(stream, JsonOptions, ct);
        var items = endpoint == "localidades" ? payload?.Localidades : payload?.Asentamientos;

        if (items is not { Count: > 0 })
        {
            return null;
        }

        if (items.Count == 1)
        {
            return new GeorefLocality(items[0].Id, items[0].Nombre);
        }

        // Yerba Buena y Aguilares devuelven una localidad de ocho dígitos y la entidad censal de
        // diez que la contiene. Fuera de esa pareja, varias filas son una ambigüedad geográfica.
        var locality = items.Where(item => item.Id.Length == 8).ToList();
        var entity = items.Where(item => item.Id.Length == 10).ToList();
        return locality.Count == 1 && entity.Count == 1 && items.Count == 2
            && entity[0].Id.StartsWith(locality[0].Id, StringComparison.Ordinal)
            ? new GeorefLocality(locality[0].Id, locality[0].Nombre)
            : null;
    }

    private sealed record GeorefResponse(
        List<GeorefItem>? Localidades,
        List<GeorefItem>? Asentamientos);

    private sealed record GeorefItem(
        [property: JsonPropertyName("id")] string Id,
        [property: JsonPropertyName("nombre")] string Nombre);
}
