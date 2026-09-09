using System.Net;

namespace Planb.Academic.Tests.Georef;

/// <summary>
/// Doble de <see cref="HttpMessageHandler"/>: cada test arma la respuesta (o la excepción) que
/// quiere que el <see cref="HttpClient"/> bajo prueba reciba, sin pegarle a la red.
/// </summary>
internal sealed class FakeHttpMessageHandler : HttpMessageHandler
{
    private readonly Func<HttpRequestMessage, HttpResponseMessage> _respond;

    public FakeHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) => _respond = respond;

    public static FakeHttpMessageHandler Json(string body, HttpStatusCode status = HttpStatusCode.OK) =>
        new(_ => new HttpResponseMessage(status) { Content = new StringContent(body) });

    public static FakeHttpMessageHandler Throwing(Exception exception) =>
        new(_ => throw exception);

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken) =>
        Task.FromResult(_respond(request));
}
