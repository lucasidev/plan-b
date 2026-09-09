using System.Net;
using Microsoft.Extensions.Logging.Abstractions;
using Planb.Academic.Infrastructure.AgnAudits;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.AgnAudits;

/// <summary>
/// <see cref="AgnReportsApiClient"/> contra dobles de <see cref="HttpMessageHandler"/> (issue #506):
/// nunca pega a la red real. El caso feliz y el de paginación usan una muestra real, relevada el
/// 2026-09-09 contra <c>webagnapi.agn.gob.ar/api/views/busqueda_avanzada/informes</c> (tres informes
/// reales: uno de la UNT con <c>fecha_acta</c> nula, y dos con <c>organismo_auditado</c> múltiple y
/// fecha completa), recortada a los campos que el cliente lee. Los demás casos (status no exitoso,
/// timeout, JSON roto, meta.count que no cierra) son deliberadamente sintéticos: prueban el manejo
/// de falla, no el parseo de un payload real.
/// </summary>
public sealed class AgnReportsApiClientTests
{
    // Informe real de la UNT (organismo 1140), resolución 126/2013: fecha_acta null en la fuente.
    private const string ItemUnt126 = """
        {
          "type": "node--informes",
          "id": "cceb2a4e-afa6-4ef9-84fb-aacbedc6a059",
          "attributes": {
            "drupal_internal__nid": 800,
            "langcode": "es",
            "titulo": "PLAN DE OBRAS PARA LA CONSTRUCCIÓN DE LA CIUDAD UNIVERSITARIA",
            "ano": 2013,
            "resolucion": 126,
            "fecha_acta": null,
            "path": { "alias": "/plan-de-obras-para-la-construccion-de-la-ciudad-universitaria" }
          },
          "relationships": {
            "organismo_auditado": {
              "data": [
                { "type": "taxonomy_term--organismo_auditado", "id": "cdf29fdb-879b-47e4-bd22-ccbcc3231467", "meta": { "drupal_internal__target_id": 1140 } }
              ]
            }
          }
        }
        """;

    // Informe real con dos organismos auditados a la vez, resolución 173/2026, fecha_acta completa.
    private const string ItemProsama173 = """
        {
          "type": "node--informes",
          "id": "f1a2b3c4-1111-4ef9-84fb-aacbedc6a059",
          "attributes": {
            "titulo": "Programa de Fortalecimiento de los Servicios de Sanidad Agropecuaria y del Manejo Sustentable de los Recursos Marítimos de Argentina (PROSAMA). Ministerio de Economía",
            "ano": 2026,
            "resolucion": 173,
            "fecha_acta": "2026-08-20",
            "path": { "alias": "/Informe-173-2026" }
          },
          "relationships": {
            "organismo_auditado": {
              "data": [
                { "type": "taxonomy_term--organismo_auditado", "id": "54a85c58-1a7a-458a-a396-07f183ccc899", "meta": { "drupal_internal__target_id": 3376 } },
                { "type": "taxonomy_term--organismo_auditado", "id": "8f866dd3-bce0-49df-8627-a41395144678", "meta": { "drupal_internal__target_id": 2472 } }
              ]
            }
          }
        }
        """;

    // Informe real, un solo organismo, resolución 172/2026: usado para el test de paginación.
    private const string ItemRiego172 = """
        {
          "type": "node--informes",
          "id": "f1a2b3c4-2222-4ef9-84fb-aacbedc6a059",
          "attributes": {
            "titulo": "Programa para el Desarrollo de Nuevas Áreas de Riego en Argentina - Etapa II e Infraestructura Rural. Estados Financieros 2024 Ejercicio Nº 8. Ministerio de Economía",
            "ano": 2026,
            "resolucion": 172,
            "fecha_acta": "2026-08-20",
            "path": { "alias": "/Informe-172-2026" }
          },
          "relationships": {
            "organismo_auditado": {
              "data": [
                { "type": "taxonomy_term--organismo_auditado", "id": "8f866dd3-bce0-49df-8627-a41395144678", "meta": { "drupal_internal__target_id": 2472 } }
              ]
            }
          }
        }
        """;

    private const string NextPageUrl =
        "https://webagnapi.agn.gob.ar/api/views/busqueda_avanzada/informes?page=1";

    [Fact]
    public async Task FetchAllReportsAsync_RealSamplePage_ParsesKnownFields()
    {
        var page = SinglePageEnvelope([ItemUnt126, ItemProsama173], count: "2");
        var handler = new QueueHttpMessageHandler(_ => JsonResponse(page));
        var client = CreateClient(handler);

        var result = await client.FetchAllReportsAsync();

        result.IsSuccess.ShouldBeTrue();
        result.Value.Count.ShouldBe(2);

        var unt = result.Value[0];
        unt.Titulo.ShouldBe("PLAN DE OBRAS PARA LA CONSTRUCCIÓN DE LA CIUDAD UNIVERSITARIA");
        unt.Ano.ShouldBe(2013);
        unt.Resolucion.ShouldBe(126);
        unt.FechaActa.ShouldBeNull();
        unt.PathAlias.ShouldBe("/plan-de-obras-para-la-construccion-de-la-ciudad-universitaria");
        unt.OrganismoIds.ShouldBe([1140]);

        var prosama = result.Value[1];
        prosama.Titulo.ShouldBe(
            "Programa de Fortalecimiento de los Servicios de Sanidad Agropecuaria y del Manejo " +
            "Sustentable de los Recursos Marítimos de Argentina (PROSAMA). Ministerio de Economía");
        prosama.Ano.ShouldBe(2026);
        prosama.Resolucion.ShouldBe(173);
        prosama.FechaActa.ShouldBe(new DateOnly(2026, 8, 20));
        prosama.PathAlias.ShouldBe("/Informe-173-2026");
        prosama.OrganismoIds.ShouldBe([3376, 2472]);
    }

    [Fact]
    public async Task FetchAllReportsAsync_FollowsLinksNextLiterally_AggregatesAcrossPages()
    {
        // La AGN reporta el mismo meta.count (el total real, no lo que falta) en cada página: acá
        // se refleja ese comportamiento real con "2" en ambas.
        var page0 = PageEnvelope([ItemRiego172], count: "2", nextHref: NextPageUrl);
        var page1 = PageEnvelope([ItemUnt126], count: "2", nextHref: null);
        var handler = new QueueHttpMessageHandler(
            _ => JsonResponse(page0),
            _ => JsonResponse(page1));
        var client = CreateClient(handler);

        var result = await client.FetchAllReportsAsync();

        result.IsSuccess.ShouldBeTrue();
        result.Value.Count.ShouldBe(2);
        result.Value[0].Resolucion.ShouldBe(172);
        result.Value[1].Resolucion.ShouldBe(126);

        // La segunda request pegó exactamente a la URL que mandó links.next.href, no a una
        // reconstruida a mano con "?page=1".
        handler.RequestedUris.Count.ShouldBe(2);
        handler.RequestedUris[1].ShouldBe(NextPageUrl);
    }

    [Fact]
    public async Task FetchAllReportsAsync_EmptyDataPage_StopsWithoutFollowingFurther()
    {
        var page0 = PageEnvelope([ItemRiego172], count: "1", nextHref: NextPageUrl);
        var emptyPage = PageEnvelope([], count: "1", nextHref: NextPageUrl);
        var handler = new QueueHttpMessageHandler(
            _ => JsonResponse(page0),
            _ => JsonResponse(emptyPage));
        var client = CreateClient(handler);

        var result = await client.FetchAllReportsAsync();

        result.IsSuccess.ShouldBeTrue();
        result.Value.Count.ShouldBe(1);
        handler.RequestedUris.Count.ShouldBe(2);
    }

    [Fact]
    public async Task FetchAllReportsAsync_NonSuccessStatus_ReturnsFailureWithoutThrowing()
    {
        var handler = new QueueHttpMessageHandler(
            _ => new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
        var client = CreateClient(handler);

        var result = await client.FetchAllReportsAsync();

        result.IsFailure.ShouldBeTrue();
        result.Error.Message.ShouldContain("503");
    }

    [Fact]
    public async Task FetchAllReportsAsync_HandlerTimesOut_ReturnsFailureWithoutThrowing()
    {
        // HttpClient.Timeout cancela con un TaskCanceledException propio: el doble lo simula
        // directo en vez de esperar un timeout real, que haría el test lento.
        var handler = new QueueHttpMessageHandler(
            _ => throw new TaskCanceledException("simulated HttpClient.Timeout"));
        var client = CreateClient(handler);

        var result = await client.FetchAllReportsAsync();

        result.IsFailure.ShouldBeTrue();
        result.Error.Message.ShouldContain("tiempo de espera agotado");
    }

    [Fact]
    public async Task FetchAllReportsAsync_MalformedJson_ReturnsFailureWithoutThrowing()
    {
        var handler = new QueueHttpMessageHandler(_ => JsonResponse("esto no es JSON:API {{{"));
        var client = CreateClient(handler);

        var result = await client.FetchAllReportsAsync();

        result.IsFailure.ShouldBeTrue();
        result.Error.Message.ShouldContain("JSON inesperado");
    }

    [Fact]
    public async Task FetchAllReportsAsync_FewerReportsThanMetaCountPromised_ReturnsFailure()
    {
        // La AGN anuncia más informes de los que después entrega (meta.count no cierra con lo
        // paginado): mejor cortar acá que publicar un "no auditada" que en realidad es "no
        // llegamos a traerlo" (ver el comentario de FetchAllReportsAsync).
        var page = SinglePageEnvelope([ItemUnt126], count: "99");
        var handler = new QueueHttpMessageHandler(_ => JsonResponse(page));
        var client = CreateClient(handler);

        var result = await client.FetchAllReportsAsync();

        result.IsFailure.ShouldBeTrue();
        result.Error.Message.ShouldContain("99");
    }

    private static AgnReportsApiClient CreateClient(HttpMessageHandler handler) =>
        new(
            new HttpClient(handler) { BaseAddress = new Uri(AgnReportsApiClient.BaseUrl) },
            NullLogger<AgnReportsApiClient>.Instance);

    private static HttpResponseMessage JsonResponse(string body) =>
        new(HttpStatusCode.OK) { Content = new StringContent(body) };

    private static string SinglePageEnvelope(IReadOnlyList<string> items, string count) =>
        PageEnvelope(items, count, nextHref: null);

    // Template con placeholders + Replace en vez de un raw string interpolado: mezclar "{{" (escape
    // de llave literal en un raw string interpolado) con el JSON, que ya está lleno de llaves, es
    // ilegible y frágil. Acá la única interpolación real ("next", chico) es un string común.
    private const string PageTemplate = """
        {
          "data": [__ITEMS__],
          "meta": { "count": "__COUNT__" },
          "links": { "self": { "href": "https://webagnapi.agn.gob.ar/api/views/busqueda_avanzada/informes?page=0" }__NEXT__ }
        }
        """;

    private static string PageEnvelope(IReadOnlyList<string> items, string count, string? nextHref)
    {
        var next = nextHref is null ? "" : $", \"next\": {{ \"href\": \"{nextHref}\" }}";
        return PageTemplate
            .Replace("__ITEMS__", string.Join(",\n", items))
            .Replace("__COUNT__", count)
            .Replace("__NEXT__", next);
    }
}

/// <summary>
/// Doble de <see cref="HttpMessageHandler"/> que responde en el orden en que se le encolan las
/// respuestas (una por cada request que <see cref="AgnReportsApiClient"/> haga), y registra la URI
/// pedida en cada una para poder afirmar que siguió <c>links.next.href</c> tal cual.
/// </summary>
internal sealed class QueueHttpMessageHandler : HttpMessageHandler
{
    private readonly Queue<Func<HttpRequestMessage, HttpResponseMessage>> _responses;

    public QueueHttpMessageHandler(params Func<HttpRequestMessage, HttpResponseMessage>[] responses) =>
        _responses = new Queue<Func<HttpRequestMessage, HttpResponseMessage>>(responses);

    public List<string> RequestedUris { get; } = [];

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        RequestedUris.Add(request.RequestUri!.ToString());
        if (_responses.Count == 0)
        {
            throw new InvalidOperationException("QueueHttpMessageHandler: no quedan respuestas encoladas.");
        }

        return Task.FromResult(_responses.Dequeue()(request));
    }
}
