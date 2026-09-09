using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Infrastructure.AgnAudits;

/// <summary>
/// <see cref="IAgnReportsClient"/> contra la API real: <c>GET /api/node/informes</c> (el recurso
/// JSON:API de Drupal, no la vista <c>busqueda_avanzada/informes</c> que el issue #506 marcaba sin
/// filtros) filtrado por <c>filter[organismo_auditado.drupal_internal__tid]</c>. Comprobado el
/// 2026-09-09 contra <c>https://webagnapi.agn.gob.ar</c>: con la UNT (tid 1140) devuelve sus 4
/// informes reales sin paginar; con la UTN (tid 2409), 1.
///
/// <para>
/// El nombre del parámetro importa: es <c>drupal_internal__tid</c> (el id interno del término de
/// taxonomía del organismo), no <c>id</c> (el UUID del recurso, que responde 200 con <c>data: []</c>
/// y <c>meta.count: 0</c>, indistinguible de "este organismo no tiene informes") ni
/// <c>drupal_internal__nid</c> (responde 400). Queda fijo acá adentro, no configurable, para que un
/// error de nombre no pueda colarse como el caso legítimo que el producto necesita poder afirmar.
/// </para>
///
/// <para>
/// Los DTOs de acá abajo modelan a propósito solo el subconjunto de la respuesta que este cliente
/// lee (título, año, resolución, fecha del acta, el alias público y el id del organismo auditado):
/// un campo que la AGN agregue no rompe el parseo, y si le cambia la forma a alguno de los que sí
/// leemos, <see cref="FetchReportsForOrganismoAsync"/> lo corta con
/// <see cref="AgnAuditErrors.FetchFailed"/> en vez de guardar datos a medias.
/// </para>
/// </summary>
public sealed class AgnReportsApiClient : IAgnReportsClient
{
    /// <summary>Origen de la API JSON:API. El buscador público (agn.gob.ar/auditorias/buscador) es un cliente Angular de esta misma API.</summary>
    public const string BaseUrl = "https://webagnapi.agn.gob.ar";

    // Generoso para un solo organismo: la UNT, el de más informes de los dos que hoy tiene el
    // catálogo (ver AgnOrganismoCatalog), tiene 4. Comprobado contra la API real que hay organismos
    // (no universidades) con más de cien: si alguno de los nuestros lo superara alguna vez,
    // meta.count no cerraría con lo recibido y el chequeo de abajo lo corta en vez de devolver una
    // lista truncada.
    private const int PageLimit = 50;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly HttpClient _http;
    private readonly ILogger<AgnReportsApiClient> _logger;

    public AgnReportsApiClient(HttpClient http, ILogger<AgnReportsApiClient> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<Result<IReadOnlyList<AgnReport>>> FetchReportsForOrganismoAsync(
        int organismoId, CancellationToken ct = default)
    {
        var path =
            $"/api/node/informes?filter[organismo_auditado.drupal_internal__tid]={organismoId}&page[limit]={PageLimit}";

        AgnInformesPage parsed;
        try
        {
            using var response = await _http.GetAsync(path, ct);
            if (!response.IsSuccessStatusCode)
            {
                return AgnAuditErrors.FetchFailed(
                    $"el organismo {organismoId} respondió {(int)response.StatusCode}.");
            }

            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            parsed = await JsonSerializer.DeserializeAsync<AgnInformesPage>(stream, JsonOptions, ct)
                ?? throw new JsonException("el body vino vacío.");
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            // HttpClient.Timeout cancela con un OperationCanceledException propio, distinto del
            // ct que nos pasó el caller: si el caller no pidió cancelar, es la AGN tardando.
            return AgnAuditErrors.FetchFailed($"tiempo de espera agotado para el organismo {organismoId}.");
        }
        catch (HttpRequestException ex)
        {
            return AgnAuditErrors.FetchFailed($"fallo de red para el organismo {organismoId}: {ex.Message}");
        }
        catch (JsonException ex)
        {
            return AgnAuditErrors.FetchFailed($"JSON inesperado para el organismo {organismoId}: {ex.Message}");
        }

        if (parsed.Data is null)
        {
            return AgnAuditErrors.FetchFailed($"la respuesta del organismo {organismoId} no trae 'data'.");
        }

        // meta.count es el total que matchea el filtro (comprobado contra la API real: no es el
        // total global de los 4816 informes), así que si no cierra con lo recibido, page[limit] se
        // quedó corto. Mejor cortar acá (todo o nada) que publicar un "más reciente" que no lo es
        // porque quedó afuera de esta página.
        if (parsed.Meta?.Count is int expectedCount && parsed.Data.Count != expectedCount)
        {
            return AgnAuditErrors.FetchFailed(
                $"el organismo {organismoId} tiene {expectedCount} informes (meta.count) y se trajeron " +
                $"{parsed.Data.Count}: page[limit]={PageLimit} se quedó corto.");
        }

        var reports = parsed.Data.Select(ToReport).ToList();
        _logger.LogInformation(
            "AgnReportsApiClient: {Count} informes traídos para el organismo {OrganismoId}.",
            reports.Count, organismoId);
        return reports;
    }

    private static AgnReport ToReport(AgnInformeNode node)
    {
        var attrs = node.Attributes;
        var organismoIds = node.Relationships?.OrganismoAuditado?.Data?
            .Select(r => r.Meta?.DrupalInternalTargetId)
            .Where(id => id is not null)
            .Select(id => id!.Value)
            .ToArray() ?? [];

        var fechaActa = DateOnly.TryParse(attrs?.FechaActa, out var parsedDate)
            ? parsedDate
            : (DateOnly?)null;

        return new AgnReport(
            attrs?.Titulo?.Trim(),
            attrs?.Ano,
            attrs?.Resolucion,
            fechaActa,
            attrs?.Path?.Alias,
            organismoIds);
    }
}

// ------------------------------------------------------------------------------------------------
// DTOs privados: reflejan solo lo que AgnReportsApiClient lee de la respuesta JSON:API real
// (docs/history/reviews/2026-09-07-official-data-sources.md, sección 8). No modelan la respuesta
// entera a propósito (ver el docstring de la clase).
// ------------------------------------------------------------------------------------------------

internal sealed record AgnInformesPage(
    [property: JsonPropertyName("data")] List<AgnInformeNode>? Data,
    [property: JsonPropertyName("meta")] AgnPageMeta? Meta);

// meta.count viene como número JSON en /api/node/informes (a diferencia de la vista
// busqueda_avanzada/informes, donde venía como string): comprobado contra la API real el 2026-09-09.
internal sealed record AgnPageMeta([property: JsonPropertyName("count")] int? Count);

internal sealed record AgnInformeNode(
    [property: JsonPropertyName("attributes")] AgnInformeAttributes? Attributes,
    [property: JsonPropertyName("relationships")] AgnInformeRelationships? Relationships);

internal sealed record AgnInformeAttributes(
    [property: JsonPropertyName("titulo")] string? Titulo,
    [property: JsonPropertyName("ano")] int? Ano,
    [property: JsonPropertyName("resolucion")] int? Resolucion,
    [property: JsonPropertyName("fecha_acta")] string? FechaActa,
    [property: JsonPropertyName("path")] AgnPath? Path);

internal sealed record AgnPath([property: JsonPropertyName("alias")] string? Alias);

internal sealed record AgnInformeRelationships(
    [property: JsonPropertyName("organismo_auditado")] AgnRelationship? OrganismoAuditado);

internal sealed record AgnRelationship(
    [property: JsonPropertyName("data")] List<AgnResourceRef>? Data);

internal sealed record AgnResourceRef(
    [property: JsonPropertyName("meta")] AgnResourceRefMeta? Meta);

internal sealed record AgnResourceRefMeta(
    [property: JsonPropertyName("drupal_internal__target_id")] int? DrupalInternalTargetId);
