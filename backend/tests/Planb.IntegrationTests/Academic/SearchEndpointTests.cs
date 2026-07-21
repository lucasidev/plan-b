using System.Net;
using System.Net.Http.Json;
using Planb.Academic.Application.Features.Search;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Tests de GET /api/search (US-004): búsqueda léxica de catálogo (materias + docentes). Público.
/// Corre contra el seed determinístico de Academic (materias TUDCS + docentes US-063) y la migración
/// AddSubjectSearchTrigram (pg_trgm + unaccent), que el host aplica en Development también en el
/// factory de tests.
/// </summary>
public class SearchEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid Subject101 = Guid.Parse("00000004-0000-4000-a000-000000000001"); // Algoritmos y Paradigmas
    private static readonly Guid Subject102 = Guid.Parse("00000004-0000-4000-a000-000000000002"); // Álgebra I
    private static readonly Guid Brandt = Guid.Parse("00000006-0000-4000-a000-000000000001");
    private static readonly Guid Ledesma = Guid.Parse("00000006-0000-4000-a000-000000000009");

    private readonly RegisterApiFixture _fixture;

    public SearchEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Exact_code_ranks_the_subject_first()
    {
        using var client = _fixture.Factory.CreateClient();

        var response = await client.GetAsync("/api/search?q=101");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<SearchResponse>();
        body.ShouldNotBeNull();
        body!.Items.ShouldNotBeEmpty();
        body.Items[0].Type.ShouldBe("subject");
        body.Items[0].Id.ShouldBe(Subject101);
        body.Items[0].Sublabel.ShouldBe("101");
    }

    [Fact]
    public async Task Is_accent_insensitive()
    {
        using var client = _fixture.Factory.CreateClient();

        // "algebra" sin acento debe encontrar "Álgebra I".
        var response = await client.GetAsync("/api/search?q=algebra");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<SearchResponse>();
        body!.Items.ShouldContain(i => i.Id == Subject102);
    }

    [Fact]
    public async Task Tolerates_typos_via_trigram()
    {
        using var client = _fixture.Factory.CreateClient();

        // "paradigms" (typo de "paradigmas") debe acercarse a "Algoritmos y Paradigmas" por
        // similitud trigram.
        var response = await client.GetAsync("/api/search?q=paradigms");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<SearchResponse>();
        body!.Items.ShouldContain(i => i.Id == Subject101);
    }

    [Fact]
    public async Task Finds_teacher_by_last_name()
    {
        using var client = _fixture.Factory.CreateClient();

        var response = await client.GetAsync("/api/search?q=brandt");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<SearchResponse>();
        body.ShouldNotBeNull();
        var teacher = body!.Items.FirstOrDefault(i => i.Id == Brandt);
        teacher.ShouldNotBeNull();
        teacher!.Type.ShouldBe("teacher");
        teacher.Label.ShouldBe("Carlos Brandt"); // title case desde el storage lowercase
    }

    [Fact]
    public async Task Teacher_search_is_accent_insensitive()
    {
        using var client = _fixture.Factory.CreateClient();

        // "veronica" sin acento debe encontrar a "Verónica Ledesma".
        var response = await client.GetAsync("/api/search?q=veronica");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<SearchResponse>();
        body!.Items.ShouldContain(i => i.Id == Ledesma && i.Type == "teacher");
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

        // "desarrollo" matchea varias (111, 213, 223, 311); limit=1 recorta a una.
        var response = await client.GetAsync("/api/search?q=desarrollo&limit=1");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<SearchResponse>();
        body!.Items.Count.ShouldBe(1);
    }

    [Fact]
    public async Task Is_public_no_auth_required()
    {
        using var client = _fixture.Factory.CreateClient();

        var response = await client.GetAsync("/api/search?q=101");

        response.StatusCode.ShouldNotBe(HttpStatusCode.Unauthorized);
    }

    private sealed record ProblemTitle(string Title);
}
