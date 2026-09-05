using System.Net;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Invariants;

/// <summary>
/// Atribuir la dificultad: carrera o facultad (US-129). Antes de ADR-0083 la ficha calculaba una
/// cabecera con dos proporciones por eje ("exigencia", "gestión") que repartía la dificultad entre
/// la cátedra y la institución. Ese cálculo se retiró: ninguna ficha vuelve a computar ni publicar
/// esa cifra única, ni con ese nombre ni con otro; lo que hay son los conteos de cada bloque,
/// separados por lo que describen.
/// </summary>
public class NoSingleDifficultyAttributionTests : IClassFixture<RegisterApiFixture>
{
    private readonly HttpClient _anonymous;

    // TUDCS (UNSTA) y Cátedra Pérez (Análisis Matemático II), del seed.
    private static readonly Guid TudcsCareerId = Guid.Parse("00000002-0000-4000-a000-000000000003");
    private static readonly Guid ChairPerez = Guid.Parse("00000008-0000-4000-a000-000000000001");

    public NoSingleDifficultyAttributionTests(RegisterApiFixture fixture)
    {
        _anonymous = fixture.Factory.CreateClient();
    }

    /// <summary>US-129 N1</summary>
    [Fact]
    public async Task Neither_ficha_computes_a_single_score_that_splits_difficulty_between_career_and_institution()
    {
        var chairJson = await BodyAsync($"/api/reviews/chairs/{ChairPerez}/facts");
        var careerJson = await BodyAsync($"/api/reviews/careers/{TudcsCareerId}/facts");

        foreach (var json in new[] { chairJson, careerJson })
        {
            // El eje retirado por ADR-0083: ni la cabecera de "exigencia"/"gestión" ni ningún
            // sinónimo de atribución vuelve a aparecer en ningún cuerpo público.
            json.ShouldNotContain("exigencia", Case.Insensitive);
            json.ShouldNotContain("gestion", Case.Insensitive);
            json.ShouldNotContain("gestión", Case.Insensitive);
            json.ShouldNotContain("attribution", Case.Insensitive);
            json.ShouldNotContain("atribuc", Case.Insensitive);
        }
    }

    private async Task<string> BodyAsync(string url)
    {
        var response = await _anonymous.GetAsync(url);
        response.StatusCode.ShouldBe(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());
        return await response.Content.ReadAsStringAsync();
    }
}
