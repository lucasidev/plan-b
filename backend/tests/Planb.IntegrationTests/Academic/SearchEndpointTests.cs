using System.Net;
using System.Net.Http.Json;
using Planb.Academic.Application.Features.Search;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Tests de GET /api/search (US-004): búsqueda léxica de catálogo. Público. Corre contra el seed
/// determinístico de Academic (las mismas materias TUDCS) y la migración AddSubjectSearchTrigram
/// (pg_trgm + unaccent), que el host aplica en Development también en el factory de tests.
///
/// Hoy solo materias (type=subject); la rama docente se injerta en US-063.
/// </summary>
public class SearchEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid MAT102 = Guid.Parse("00000004-0000-4000-a000-000000000001");
    private static readonly Guid PRG101 = Guid.Parse("00000004-0000-4000-a000-000000000004");

    private readonly RegisterApiFixture _fixture;

    public SearchEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Exact_code_ranks_the_subject_first()
    {
        using var client = _fixture.Factory.CreateClient();

        var response = await client.GetAsync("/api/search?q=MAT102");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<SearchResponse>();
        body.ShouldNotBeNull();
        body!.Items.ShouldNotBeEmpty();
        body.Items[0].Type.ShouldBe("subject");
        body.Items[0].Id.ShouldBe(MAT102);
        body.Items[0].Sublabel.ShouldBe("MAT102");
    }

    [Fact]
    public async Task Is_accent_insensitive()
    {
        using var client = _fixture.Factory.CreateClient();

        // "analisis" sin acento debe encontrar "Análisis Matemático I".
        var response = await client.GetAsync("/api/search?q=analisis");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<SearchResponse>();
        body!.Items.ShouldContain(i => i.Id == MAT102);
    }

    [Fact]
    public async Task Tolerates_typos_via_trigram()
    {
        using var client = _fixture.Factory.CreateClient();

        // "programcion" (typo) debe acercarse a "Programación I" por similitud trigram.
        var response = await client.GetAsync("/api/search?q=programcion");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<SearchResponse>();
        body!.Items.ShouldContain(i => i.Id == PRG101);
    }

    [Fact]
    public async Task Query_under_min_length_returns_400()
    {
        using var client = _fixture.Factory.CreateClient();

        var response = await client.GetAsync("/api/search?q=a");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<ProblemTitle>();
        problem!.Title.ShouldBe("academic.search.query_too_short");
    }

    [Fact]
    public async Task Respects_the_limit()
    {
        using var client = _fixture.Factory.CreateClient();

        // "mat" matchea varias (MAT102, MAT201, Matemática...); limit=1 recorta a una.
        var response = await client.GetAsync("/api/search?q=mat&limit=1");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<SearchResponse>();
        body!.Items.Count.ShouldBe(1);
    }

    [Fact]
    public async Task Is_public_no_auth_required()
    {
        using var client = _fixture.Factory.CreateClient();

        var response = await client.GetAsync("/api/search?q=MAT102");

        response.StatusCode.ShouldNotBe(HttpStatusCode.Unauthorized);
    }

    private sealed record ProblemTitle(string Title);
}
