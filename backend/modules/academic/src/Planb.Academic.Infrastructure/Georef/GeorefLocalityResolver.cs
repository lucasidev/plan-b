using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

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
    private const string Province = "Tucuman";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _http;
    private readonly ILogger<GeorefLocalityResolver> _logger;

    public GeorefLocalityResolver(HttpClient http, ILogger<GeorefLocalityResolver> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<GeorefLocality?> ResolveAsync(string localityText, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(localityText);

        try
        {
            var found = await QueryAsync("localidades", localityText, ct)
                ?? await QueryAsync("asentamientos", localityText, ct);

            if (found is null)
            {
                _logger.LogWarning(
                    "Georef: ninguna localidad ni asentamiento resolvió {LocalityText}. " +
                    "La unidad académica queda sin localidad.",
                    localityText);
            }

            return found;
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

    private async Task<GeorefLocality?> QueryAsync(string endpoint, string localityText, CancellationToken ct)
    {
        var url = $"{endpoint}?nombre={Uri.EscapeDataString(localityText)}&provincia={Province}&campos=id,nombre";
        using var response = await _http.GetAsync(url, ct);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        var payload = await JsonSerializer.DeserializeAsync<GeorefResponse>(stream, JsonOptions, ct);
        var items = endpoint == "localidades" ? payload?.Localidades : payload?.Asentamientos;

        if (items is not { Count: > 0 })
        {
            return null;
        }

        // Yerba Buena y Aguilares (verificado el 2026-09-09) devuelven dos filas para el mismo
        // nombre: una "Entidad" censal con id de 10 dígitos que agrupa varias localidades, y la
        // localidad puntual con el id de 8 dígitos (el código INDEC estándar). Se elige el id más
        // corto: es la localidad que el domicilio nombra, no la entidad que la contiene.
        var best = items.OrderBy(item => item.Id.Length).First();
        return new GeorefLocality(best.Id, best.Nombre);
    }

    private sealed record GeorefResponse(
        List<GeorefItem>? Localidades,
        List<GeorefItem>? Asentamientos);

    private sealed record GeorefItem(
        [property: JsonPropertyName("id")] string Id,
        [property: JsonPropertyName("nombre")] string Nombre);
}
