using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Abstractions.Persistence;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de <c>GET /api/reviews/instrument</c> (US-146, ADR-0082): el cuestionario
/// vigente tal como lo pide la pantalla Reseñar.
///
/// <para>
/// El test que más importa acá es el de la valencia: el contrato NO la expone. Que el read no la
/// traiga es lo que hace imposible que la pantalla pinte de rojo la opción mala mientras alguien
/// responde, y eso es una decisión de producto (la recolección va sin alarma), no un detalle de
/// serialización. Si alguien la agrega al DTO "porque ya está en la base", este test lo frena.
/// </para>
/// </summary>
public class GetCurrentInstrumentEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly HttpClient _client;

    public GetCurrentInstrumentEndpointTests(RegisterApiFixture fixture)
    {
        _client = fixture.Factory.CreateClient();
    }

    [Fact]
    public async Task Current_instrument_is_public_and_carries_its_items_in_order()
    {
        var response = await _client.GetAsync("/api/reviews/instrument");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var instrument = await response.Content.ReadFromJsonAsync<CurrentInstrumentView>();
        instrument.ShouldNotBeNull();
        instrument!.Code.ShouldBe("STUDENT_COURSE");
        instrument.Version.ShouldBeGreaterThan((short)0);
        instrument.Items.ShouldNotBeEmpty();

        // Cada frase llega con al menos dos opciones: una frase de una sola opción no es una pregunta.
        foreach (var item in instrument.Items)
        {
            item.Code.ShouldNotBeNullOrWhiteSpace();
            item.Text.ShouldNotBeNullOrWhiteSpace();
            item.Options.Count.ShouldBeGreaterThanOrEqualTo(2);
        }
    }

    [Fact]
    public async Task Items_come_grouped_by_the_three_layers()
    {
        var response = await _client.GetAsync("/api/reviews/instrument");
        var instrument = await response.Content.ReadFromJsonAsync<CurrentInstrumentView>();

        var layers = instrument!.Items.Select(i => i.Layer).Distinct().ToList();

        // Las tres capas del ADR-0082: el contexto, qué hizo la cátedra, qué te pasó a vos.
        layers.ShouldContain("Context");
        layers.ShouldContain("ChairConduct");
        layers.ShouldContain("StudentExperience");
    }

    [Fact]
    public async Task The_payload_never_carries_the_valence_of_an_option()
    {
        // Se mira el JSON crudo, no el DTO tipado: el DTO no tiene el campo por construcción, así
        // que deserializarlo lo escondería. Lo que se protege es lo que viaja por el cable.
        var json = await _client.GetStringAsync("/api/reviews/instrument");

        using var document = JsonDocument.Parse(json);
        var options = document.RootElement
            .GetProperty("items")
            .EnumerateArray()
            .SelectMany(item => item.GetProperty("options").EnumerateArray());

        foreach (var option in options)
        {
            option.TryGetProperty("valence", out _).ShouldBeFalse(
                "la recolección va sin alarma: si la valencia viaja, la pantalla puede teñir la " +
                "opción negativa mientras el alumno responde, y eso le sugiere la respuesta");
        }

        json.ShouldNotContain("Negative");
    }
}
