using System.Net;
using System.Net.Http.Json;
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

    /// <summary>
    /// Roto: pendiente de issue, hasta 2026-09-30.
    ///
    /// <para>
    /// US-132 E2, N1: la letra pide que buscar el nombre de una docente lleve directo a la cátedra
    /// de la que es titular ("no a una ficha de 'docente' que no existe... el destino siempre es la
    /// cátedra"). Hoy sí existe una ficha de docente (<c>/teachers/[id]</c>, que su propio docstring
    /// cita como resolución de US-132 y US-003, y que <c>path-to-the-ficha.spec.ts:163</c> lista
    /// entre "las cuatro superficies públicas del producto"), y el branch <c>teacher</c> de
    /// <c>DapperCatalogSearchReader</c> no redirige a la cátedra que esa persona integra: busca
    /// por nombre de la docente y no encuentra la cátedra si su nombre no coincide con el de
    /// la cátedra (que es exactamente el caso del ejemplo de la letra, "Claudia Fernández" titular
    /// de "Cátedra Pérez"). <see cref="SearchEndpointTests.Finds_a_chair_by_its_name_with_its_subject_as_sublabel"/>
    /// ya prueba, y a propósito, el diseño contrario: buscar "perez" (que matchea el NOMBRE de la
    /// cátedra) devuelve la cátedra y la docente juntas ("son cosas distintas, la persona y el
    /// equipo que dicta").
    /// </para>
    ///
    /// <para>
    /// Caso exacto: se crea una docente ("Delfina Aranda") como titular de una cátedra nueva
    /// (nombre al azar, sin relación con "Delfina Aranda"). <c>GET /api/search?q=Delfina Aranda</c>
    /// responde con un item <c>type=teacher</c> (la ficha de la persona) y ninguno <c>type=chair</c>
    /// para la cátedra que integra. Lo esperado por la letra es lo inverso: ningún <c>teacher</c>,
    /// sí un <c>chair</c> apuntando a esa cátedra.
    /// </para>
    /// </summary>
    [Fact(Skip = "Roto: pendiente de issue, hasta 2026-09-30")]
    public async Task Searching_a_teacher_by_name_leads_to_her_chair_not_a_person_ficha()
    {
        var admin = await AuthenticatedClient.CreateAsync(
            _fixture, $"search.admin.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

        // Nombre de cátedra al azar, sin relación con el nombre de la docente: es el mismo caso que
        // describe la letra ("Cátedra Pérez" no tiene nada que ver con "Claudia Fernández").
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
        var response = await anonymous.GetAsync("/api/search?q=Delfina Aranda");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<SearchResponse>();

        // Lo que la letra pide: la cátedra aparece, y nunca se genera una ficha propia de la persona.
        body!.Items.ShouldNotContain(i => i.Type == "teacher");
        body.Items.ShouldContain(i => i.Type == "chair" && i.Id == chair.Id);
    }

    private static readonly Guid AcademicSeedUnstaId = Guid.Parse("00000001-0000-4000-a000-000000000001");

    private sealed record CreatedChair(Guid Id);

    private sealed record CreatedTeacher(Guid Id);

    private sealed record ProblemTitle(string Title);
}
