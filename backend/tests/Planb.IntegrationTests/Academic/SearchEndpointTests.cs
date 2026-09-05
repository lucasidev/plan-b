using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Planb.Academic.Application.Features.Search;
using Planb.Identity.Domain.Users;
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
    private static readonly Guid Subject211 = Guid.Parse("00000004-0000-4000-a000-000000000012"); // Fundamentos de Control de Calidad
    private static readonly Guid UnstaTerm = Guid.Parse("00000005-0000-4000-a000-000000000001");
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

    [Fact]
    public async Task Finds_a_chair_by_its_name_with_its_subject_as_sublabel()
    {
        using var client = _fixture.Factory.CreateClient();

        // El seed tiene tres cátedras sobre 211 Fundamentos de Control de Calidad: Pérez,
        // González y Ruiz.
        var response = await client.GetAsync("/api/search?q=perez");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<SearchResponse>();

        // Buscar un apellido tiene que poder llevar a la cátedra y no solo a la persona: lo que el
        // producto publica es de la cátedra (ADR-0083), así que si la búsqueda no la devuelve, su
        // ficha es inalcanzable salvo tipeando un UUID.
        var chair = body!.Items.SingleOrDefault(i => i.Type == "chair");
        chair.ShouldNotBeNull();
        chair!.Label.ShouldBe("Pérez");

        // La materia como sublabel es lo que distingue a dos cátedras con el mismo apellido.
        chair.Sublabel.ShouldBe("Fundamentos de Control de Calidad");

        // Y el docente sigue apareciendo: son cosas distintas, la persona y el equipo que dicta.
        body.Items.ShouldContain(i => i.Type == "teacher" && i.Label == "Martín Pérez");
    }

    [Fact]
    public async Task A_chair_search_tolerates_missing_accents()
    {
        using var client = _fixture.Factory.CreateClient();

        // Nadie tipea el acento al buscar: "gonzalez" tiene que encontrar a "González".
        var response = await client.GetAsync("/api/search?q=gonzalez");

        var body = await response.Content.ReadFromJsonAsync<SearchResponse>();
        body!.Items.ShouldContain(i => i.Type == "chair" && i.Label == "González");
    }

    /// <summary>US-132 E2, N1: buscar el nombre de una docente lleva a sus cátedras y no publica nada sobre ella.</summary>
    [Fact]
    public async Task Searching_a_teacher_by_name_leads_to_her_chairs_and_publishes_nothing_about_her()
    {
        var admin = await AuthenticatedClient.CreateAsync(
            _fixture, $"search.admin.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

        // Nombre de cátedra al azar, sin relación con el nombre de la docente: la pantalla de la
        // docente tiene que poder llevar a sus cátedras aunque los nombres no coincidan.
        var chairName = $"Cátedra {Guid.NewGuid():N}"[..24];
        var createdChair = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{Subject211}/chairs", new { name = chairName });
        createdChair.StatusCode.ShouldBe(HttpStatusCode.Created);
        var chair = (await createdChair.Content.ReadFromJsonAsync<CreatedChair>())!;

        var createdTeacher = await admin.Client.PostAsJsonAsync(
            "/api/academic/teachers",
            new { universityId = AcademicSeedUnstaId, firstName = "Delfina", lastName = "Aranda" });
        createdTeacher.StatusCode.ShouldBe(HttpStatusCode.Created);
        var teacher = (await createdTeacher.Content.ReadFromJsonAsync<CreatedTeacher>())!;

        var added = await admin.Client.PostAsJsonAsync(
            $"/api/academic/chairs/{chair.Id}/members",
            new { teacherId = teacher.Id, role = "Lead", sinceTermId = UnstaTerm });
        added.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        using var anonymous = _fixture.Factory.CreateClient();

        // E2: buscar su nombre la encuentra a ella, que es la puerta a sus cátedras y no una ficha
        // propia con conteos.
        var response = await anonymous.GetAsync("/api/search?q=Delfina Aranda");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<SearchResponse>();
        body!.Items.ShouldContain(i => i.Type == "teacher" && i.Id == teacher.Id);

        // N1: su pantalla lista la cátedra creada entre las que integra, y nada de lo que ese JSON
        // publica habla de ella: ni porcentaje, ni moda, ni conteo, ni puntaje.
        var chairsResponse = await anonymous.GetAsync($"/api/academic/teachers/{teacher.Id}/chairs");
        chairsResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        var chairsJson = await chairsResponse.Content.ReadAsStringAsync();
        using var chairsDocument = JsonDocument.Parse(chairsJson);

        chairsDocument.RootElement.EnumerateArray().ToList()
            .ShouldContain(c => c.GetProperty("chairId").GetGuid() == chair.Id);

        AssertPublishesNothingAboutThePerson(chairsDocument.RootElement);
    }

    /// <summary>
    /// Recorre el documento buscando una propiedad cuyo nombre delate un dato de la persona: lo que
    /// se publica es de la cátedra, nunca un porcentaje, moda, conteo, promedio o puntaje atribuido
    /// a quien la integra.
    /// </summary>
    private static void AssertPublishesNothingAboutThePerson(JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    var name = property.Name.ToLowerInvariant();
                    ForbiddenPropertyNameFragments.Any(name.Contains).ShouldBeFalse(
                        $"la propiedad \"{property.Name}\" publica algo sobre la persona, y su ficha no puede");
                    AssertPublishesNothingAboutThePerson(property.Value);
                }
                break;
            case JsonValueKind.Array:
                foreach (var item in element.EnumerateArray())
                {
                    AssertPublishesNothingAboutThePerson(item);
                }
                break;
        }
    }

    private static readonly string[] ForbiddenPropertyNameFragments =
        ["percent", "mode", "score", "average", "voices", "reviewcount"];

    private static readonly Guid AcademicSeedUnstaId = Guid.Parse("00000001-0000-4000-a000-000000000001");

    private sealed record CreatedChair(Guid Id);

    private sealed record CreatedTeacher(Guid Id);

    private sealed record ProblemTitle(string Title);
}
