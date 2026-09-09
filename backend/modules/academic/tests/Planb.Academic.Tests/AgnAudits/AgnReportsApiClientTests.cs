using System.Net;
using Microsoft.Extensions.Logging.Abstractions;
using Planb.Academic.Infrastructure.AgnAudits;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.AgnAudits;

/// <summary>
/// <see cref="AgnReportsApiClient"/> contra dobles de <see cref="HttpMessageHandler"/> (issue #506):
/// nunca pega a la red real. Las muestras son informes reales, relevados el 2026-09-09 contra
/// <c>webagnapi.agn.gob.ar/api/node/informes</c> (el endpoint filtrado, no la vista
/// <c>busqueda_avanzada/informes</c> que el issue #506 marcaba sin filtros): uno de la UNT (tid
/// 1140) con <c>fecha_acta</c> nula, y dos de un organismo distinto con <c>organismo_auditado</c>
/// múltiple y <c>fecha_acta</c> completa, combinados acá en una sola respuesta para ejercitar varios
/// casos de parseo juntos aunque en la AGN real no compartan organismo. Los demás casos (status no
/// exitoso, timeout, JSON roto, meta.count que no cierra, respuesta vacía) son deliberadamente
/// sintéticos: prueban el manejo de falla o de ausencia, no el parseo de un payload real.
/// </summary>
public sealed class AgnReportsApiClientTests
{
    // Informe real de la UNT (tid 1140), resolución 126/2013: fecha_acta null en la fuente.
    private const string ItemUnt126 = """
        {
          "type": "node--informes",
          "id": "05a432f2-d425-42df-97fe-538728eba546",
          "attributes": {
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
          "id": "23ef73dd-6483-4ab8-b23c-373896313a98",
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

    private static readonly Uri ExpectedUntUri = new(
        $"{AgnReportsApiClient.BaseUrl}/api/node/informes?filter[organismo_auditado.drupal_internal__tid]=1140&page[limit]=50");

    [Fact]
    public async Task FetchReportsForOrganismoAsync_RealSample_ParsesKnownFields()
    {
        var page = Envelope([ItemUnt126, ItemProsama173], count: 2);
        var handler = new QueueHttpMessageHandler(_ => JsonResponse(page));
        var client = CreateClient(handler);

        var result = await client.FetchReportsForOrganismoAsync(1140);

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
    public async Task FetchReportsForOrganismoAsync_FiltersByDrupalInternalTid_NotByIdOrNid()
    {
        // El parámetro correcto es drupal_internal__tid: con "id" la AGN responde 200 con data
        // vacío (se confunde con "no tiene informes"), y con drupal_internal__nid responde 400. Una
        // regresión acá cambiaría el filtro real sin que ningún otro test lo note.
        var handler = new QueueHttpMessageHandler(_ => JsonResponse(Envelope([], count: 0)));
        var client = CreateClient(handler);

        await client.FetchReportsForOrganismoAsync(1140);

        handler.RequestedUris.Count.ShouldBe(1);
        new Uri(handler.RequestedUris[0]).ShouldBe(ExpectedUntUri);
    }

    [Fact]
    public async Task FetchReportsForOrganismoAsync_EmptyResult_ReturnsEmptySuccessNotFailure()
    {
        // Forma real, comprobada el 2026-09-09: un organismo sin informes (o un tid que no existe)
        // responde 200 con data: [] y meta.count: 0, exactamente igual que un filtro mal armado. El
        // cliente no puede distinguir esos dos casos por la forma de la respuesta (por eso el nombre
        // del parámetro queda fijo en AgnReportsApiClient, no es cosa de este test), pero sí tiene
        // que distinguir "no hay informes" (Success con lista vacía) de una falla real (Failure).
        var page = Envelope([], count: 0);
        var handler = new QueueHttpMessageHandler(_ => JsonResponse(page));
        var client = CreateClient(handler);

        var result = await client.FetchReportsForOrganismoAsync(999999);

        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBeEmpty();
    }

    [Fact]
    public async Task FetchReportsForOrganismoAsync_NonSuccessStatus_ReturnsFailureWithoutThrowing()
    {
        var handler = new QueueHttpMessageHandler(
            _ => new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
        var client = CreateClient(handler);

        var result = await client.FetchReportsForOrganismoAsync(1140);

        result.IsFailure.ShouldBeTrue();
        result.Error.Message.ShouldContain("503");
    }

    [Fact]
    public async Task FetchReportsForOrganismoAsync_HandlerTimesOut_ReturnsFailureWithoutThrowing()
    {
        // HttpClient.Timeout cancela con un TaskCanceledException propio: el doble lo simula
        // directo en vez de esperar un timeout real, que haría el test lento.
        var handler = new QueueHttpMessageHandler(
            _ => throw new TaskCanceledException("simulated HttpClient.Timeout"));
        var client = CreateClient(handler);

        var result = await client.FetchReportsForOrganismoAsync(1140);

        result.IsFailure.ShouldBeTrue();
        result.Error.Message.ShouldContain("tiempo de espera agotado");
    }

    [Fact]
    public async Task FetchReportsForOrganismoAsync_MalformedJson_ReturnsFailureWithoutThrowing()
    {
        var handler = new QueueHttpMessageHandler(_ => JsonResponse("esto no es JSON:API {{{"));
        var client = CreateClient(handler);

        var result = await client.FetchReportsForOrganismoAsync(1140);

        result.IsFailure.ShouldBeTrue();
        result.Error.Message.ShouldContain("JSON inesperado");
    }

    [Fact]
    public async Task FetchReportsForOrganismoAsync_FewerReportsThanMetaCountPromised_ReturnsFailure()
    {
        // meta.count refleja el total que matchea el filtro (comprobado contra la API real: el
        // organismo 2472 tiene 126 informes y sigue reportando 126 aunque page[limit] corte antes),
        // así que si no cierra con lo recibido, page[limit] se quedó corto. Mejor cortar acá que
        // publicar un "más reciente" que en realidad quedó afuera de la página.
        var page = Envelope([ItemUnt126], count: 99);
        var handler = new QueueHttpMessageHandler(_ => JsonResponse(page));
        var client = CreateClient(handler);

        var result = await client.FetchReportsForOrganismoAsync(1140);

        result.IsFailure.ShouldBeTrue();
        result.Error.Message.ShouldContain("99");
    }

    private static AgnReportsApiClient CreateClient(HttpMessageHandler handler) =>
        new(
            new HttpClient(handler) { BaseAddress = new Uri(AgnReportsApiClient.BaseUrl) },
            NullLogger<AgnReportsApiClient>.Instance);

    private static HttpResponseMessage JsonResponse(string body) =>
        new(HttpStatusCode.OK) { Content = new StringContent(body) };

    // Template con placeholders + Replace en vez de un raw string interpolado: mezclar "{{" (escape
    // de llave literal en un raw string interpolado) con el JSON, que ya está lleno de llaves, es
    // ilegible y frágil. Acá la única interpolación real (el count, chico) es un string común.
    private const string EnvelopeTemplate = """
        {
          "data": [__ITEMS__],
          "meta": { "count": __COUNT__ }
        }
        """;

    private static string Envelope(IReadOnlyList<string> items, int count) =>
        EnvelopeTemplate
            .Replace("__ITEMS__", string.Join(",\n", items))
            .Replace("__COUNT__", count.ToString());
}

/// <summary>
/// Doble de <see cref="HttpMessageHandler"/> que responde en el orden en que se le encolan las
/// respuestas, y registra la URI pedida en cada una para poder afirmar sobre el filtro que
/// <see cref="AgnReportsApiClient"/> arma.
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
