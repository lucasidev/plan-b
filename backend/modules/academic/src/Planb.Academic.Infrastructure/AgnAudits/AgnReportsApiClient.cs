using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Infrastructure.AgnAudits;

/// <summary>
/// <see cref="IAgnReportsClient"/> contra la API real: <c>GET /api/views/busqueda_avanzada/informes</c>
/// (JSON:API de Drupal, comprobada el 2026-09-08 contra <c>https://webagnapi.agn.gob.ar</c>: 200,
/// 4816 informes en páginas de diez). Sigue <c>links.next.href</c> tal como lo manda cada respuesta
/// en vez de armar <c>?page=N</c> a mano, así que un cambio de esquema de paginación de Drupal no
/// rompe el recorrido mientras la API lo siga anunciando ahí.
///
/// <para>
/// Los DTOs de acá abajo modelan a propósito solo el subconjunto de la respuesta que este cliente
/// lee (título, año, resolución, fecha del acta, el alias público y el id del organismo auditado):
/// un campo que la AGN agregue no rompe el parseo, y si le cambia la forma a alguno de los que sí
/// leemos, <see cref="FetchAllReportsAsync"/> lo corta con <see cref="AgnAuditErrors.FetchFailed"/>
/// en vez de guardar datos a medias.
/// </para>
/// </summary>
public sealed class AgnReportsApiClient : IAgnReportsClient
{
    /// <summary>Origen de la API JSON:API. El buscador público (agn.gob.ar/auditorias/buscador) es un cliente Angular de esta misma API.</summary>
    public const string BaseUrl = "https://webagnapi.agn.gob.ar";

    private const string InformesPath = "/api/views/busqueda_avanzada/informes?page=0";

    // Tope de páginas como para nunca alcanzarlo con los ~482 de hoy (4816 informes / 10), pero que
    // corta un loop infinito si `links.next` de la AGN quedara pisado en un ciclo por un bug de su
    // lado: sin esto, una API que nunca deja de devolver "next" tumba el comando para siempre.
    private const int MaxPages = 2000;

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

    public async Task<Result<IReadOnlyList<AgnReport>>> FetchAllReportsAsync(CancellationToken ct = default)
    {
        var reports = new List<AgnReport>();
        string? nextUrl = InformesPath;
        int? expectedCount = null;
        var page = 0;

        while (nextUrl is not null)
        {
            if (page >= MaxPages)
            {
                return AgnAuditErrors.FetchFailed(
                    $"se superaron las {MaxPages} páginas sin que la AGN dejara de anunciar 'next'.");
            }

            AgnInformesPage parsed;
            try
            {
                using var response = await _http.GetAsync(nextUrl, ct);
                if (!response.IsSuccessStatusCode)
                {
                    return AgnAuditErrors.FetchFailed(
                        $"la página {page} respondió {(int)response.StatusCode}.");
                }

                await using var stream = await response.Content.ReadAsStreamAsync(ct);
                parsed = await JsonSerializer.DeserializeAsync<AgnInformesPage>(stream, JsonOptions, ct)
                    ?? throw new JsonException("el body de la página vino vacío.");
            }
            catch (OperationCanceledException) when (!ct.IsCancellationRequested)
            {
                // HttpClient.Timeout cancela con un OperationCanceledException propio, distinto del
                // ct que nos pasó el caller: si el caller no pidió cancelar, es la AGN tardando.
                return AgnAuditErrors.FetchFailed($"tiempo de espera agotado en la página {page}.");
            }
            catch (HttpRequestException ex)
            {
                return AgnAuditErrors.FetchFailed($"fallo de red en la página {page}: {ex.Message}");
            }
            catch (JsonException ex)
            {
                return AgnAuditErrors.FetchFailed($"JSON inesperado en la página {page}: {ex.Message}");
            }

            if (parsed.Data is null)
            {
                return AgnAuditErrors.FetchFailed($"la página {page} no trae 'data'.");
            }

            expectedCount ??= int.TryParse(parsed.Meta?.Count, out var count) ? count : null;

            foreach (var node in parsed.Data)
            {
                reports.Add(ToReport(node));
            }

            if (parsed.Data.Count == 0)
            {
                break;
            }

            nextUrl = parsed.Links?.Next?.Href;
            page++;
        }

        // Si la AGN corta la paginación antes de lo que su propio meta.count prometía (un bug de
        // su lado, o un cambio de forma que este cliente no detectó antes), un NotPublished
        // construido con esta lista incompleta mentiría: mejor cortar acá que publicar un "no
        // auditada" que en realidad es "no llegamos a traerlo".
        if (expectedCount is not null && reports.Count != expectedCount)
        {
            return AgnAuditErrors.FetchFailed(
                $"se esperaban {expectedCount} informes (meta.count) y se trajeron {reports.Count}.");
        }

        _logger.LogInformation("AgnReportsApiClient: {Count} informes traídos en {Pages} páginas.", reports.Count, page);
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
    [property: JsonPropertyName("meta")] AgnPageMeta? Meta,
    [property: JsonPropertyName("links")] AgnPageLinks? Links);

internal sealed record AgnPageMeta([property: JsonPropertyName("count")] string? Count);

internal sealed record AgnPageLinks([property: JsonPropertyName("next")] AgnLink? Next);

internal sealed record AgnLink([property: JsonPropertyName("href")] string? Href);

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
