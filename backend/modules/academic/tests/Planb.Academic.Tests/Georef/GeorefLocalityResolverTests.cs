using Microsoft.Extensions.Logging.Abstractions;
using Planb.Academic.Infrastructure.Georef;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Georef;

/// <summary>Cubre el resolvedor de localidades de Georef (R6, tarea 19) con un <see cref="FakeHttpMessageHandler"/>: no pega a la red.</summary>
public class GeorefLocalityResolverTests
{
    private static GeorefLocalityResolver CreateSut(FakeHttpMessageHandler handler)
    {
        var client = new HttpClient(handler) { BaseAddress = new Uri("https://fake.test/georef/api/") };
        return new GeorefLocalityResolver(client, NullLogger<GeorefLocalityResolver>.Instance);
    }

    [Fact]
    public async Task ResolveAsync_LocalidadesHasOneMatch_ReturnsIt()
    {
        // Respuesta real de /localidades?nombre=San Miguel De Tucuman&provincia=Tucuman (verificado 2026-09-09).
        var sut = CreateSut(FakeHttpMessageHandler.Json(
            """{"cantidad":1,"localidades":[{"id":"90084010","nombre":"San Miguel de Tucumán"}],"total":1}"""));

        var result = await sut.ResolveAsync("San Miguel De Tucuman");

        result.ShouldNotBeNull();
        result.Id.ShouldBe("90084010");
        result.Name.ShouldBe("San Miguel de Tucumán");
    }

    [Fact]
    public async Task ResolveAsync_LocalidadesEmpty_FallsBackToAsentamientos()
    {
        // Amaicha del Llano y Leocadio Paz no están en /localidades y sí en /asentamientos (verificado 2026-09-09).
        var callCount = 0;
        var handler = new FakeHttpMessageHandler(request =>
        {
            callCount++;
            var url = request.RequestUri!.ToString();
            var body = url.Contains("/localidades")
                ? """{"cantidad":0,"localidades":[],"total":0}"""
                : """{"cantidad":1,"asentamientos":[{"id":"90056A03","nombre":"Amaicha del Llano"}],"total":1}""";
            return new HttpResponseMessage(System.Net.HttpStatusCode.OK) { Content = new StringContent(body) };
        });
        var sut = CreateSut(handler);

        var result = await sut.ResolveAsync("Amaicha Del Llano");

        result.ShouldNotBeNull();
        result.Id.ShouldBe("90056A03");
        result.Name.ShouldBe("Amaicha del Llano");
        callCount.ShouldBe(2); // localidades primero (vacío), después asentamientos
    }

    [Fact]
    public async Task ResolveAsync_BothEndpointsEmpty_ReturnsNull()
    {
        var sut = CreateSut(FakeHttpMessageHandler.Json("""{"cantidad":0,"localidades":[],"asentamientos":[],"total":0}"""));

        var result = await sut.ResolveAsync("Una Localidad Que No Existe");

        result.ShouldBeNull();
    }

    [Fact]
    public async Task ResolveAsync_TwoMatchesForSameName_PicksTheShorterId()
    {
        // Yerba Buena y Aguilares devuelven dos filas: una "Entidad" (id de 10 dígitos) y la
        // localidad puntual (id de 8 dígitos). Respuesta real (verificado 2026-09-09).
        var sut = CreateSut(FakeHttpMessageHandler.Json(
            """
            {"cantidad":2,"localidades":[
                {"id":"9011903002","nombre":"Yerba Buena - Marcos Paz"},
                {"id":"90119030","nombre":"Yerba Buena - Marcos Paz"}
            ],"total":2}
            """));

        var result = await sut.ResolveAsync("Yerba Buena");

        result.ShouldNotBeNull();
        result.Id.ShouldBe("90119030"); // el id de 8 dígitos, no el de 10 (la "Entidad")
    }

    [Fact]
    public async Task ResolveAsync_HttpRequestFails_ReturnsNullInsteadOfThrowing()
    {
        var sut = CreateSut(FakeHttpMessageHandler.Throwing(new HttpRequestException("Georef caído")));

        var result = await sut.ResolveAsync("San Miguel De Tucuman");

        result.ShouldBeNull();
    }

    [Fact]
    public async Task ResolveAsync_RequestTimesOut_ReturnsNullInsteadOfThrowing()
    {
        var sut = CreateSut(FakeHttpMessageHandler.Throwing(new TaskCanceledException("timeout")));

        var result = await sut.ResolveAsync("San Miguel De Tucuman");

        result.ShouldBeNull();
    }

    [Fact]
    public async Task ResolveAsync_MalformedJson_ReturnsNullInsteadOfThrowing()
    {
        var sut = CreateSut(FakeHttpMessageHandler.Json("no es json"));

        var result = await sut.ResolveAsync("San Miguel De Tucuman");

        result.ShouldBeNull();
    }
}
