using System.Net;
using System.Net.Http.Json;
using Shouldly;

namespace Planb.IntegrationTests.Infrastructure;

/// <summary>
/// Lecturas de body que afirman el status antes de deserializar. Sin ese assert, un 500 llega
/// disfrazado de excepción de deserialización (no dice qué status trajo la respuesta) o, si el
/// body viene vacío en un 2xx, como un <c>null</c> que revienta más adelante en el test sin
/// explicar por qué. El antecedente es #393.
/// </summary>
internal static class HttpClientReadExtensions
{
    public static async Task<T> GetOkAsync<T>(
        this HttpClient client, string url, CancellationToken ct = default)
        where T : class
    {
        var response = await client.GetAsync(url, ct);
        var message = $"GET {url}: esperaba 200, fue {(int)response.StatusCode}";
        response.StatusCode.ShouldBe(HttpStatusCode.OK, message);

        var body = await response.Content.ReadFromJsonAsync<T>(ct);
        body.ShouldNotBeNull(message);
        return body!;
    }

    public static async Task<string> GetOkStringAsync(
        this HttpClient client, string url, CancellationToken ct = default)
    {
        var response = await client.GetAsync(url, ct);
        response.StatusCode.ShouldBe(
            HttpStatusCode.OK, $"GET {url}: esperaba 200, fue {(int)response.StatusCode}");

        return await response.Content.ReadAsStringAsync(ct);
    }
}
