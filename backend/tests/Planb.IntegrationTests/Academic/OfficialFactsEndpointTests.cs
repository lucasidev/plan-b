using System.Net;
using System.Net.Http.Json;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Tests de integración del modelo de datos oficiales (ADR-0090): el endpoint de carga con su
/// autorización, el rechazo sin fuente, y el read devolviendo la afirmación vigente con su estado.
/// Usa la UNSTA sembrada por <c>AcademicSeeder</c> (Development) como sujeto Institution, mismo
/// criterio que <see cref="AdminCareersEndpointTests"/>.
/// </summary>
public class OfficialFactsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid Unsta = Guid.Parse("00000001-0000-4000-a000-000000000001");

    private readonly RegisterApiFixture _fixture;

    public OfficialFactsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"admin.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    private static object NewFactBody(
        string subjectType = "Institution",
        Guid? subjectId = null,
        string field = "institution_type",
        string status = "Published",
        string? value = "Privada",
        string? unit = null,
        string? period = "2026",
        string sourceName = "Sitio institucional",
        string sourceUrl = "https://unsta.edu.ar",
        string? sourceDocument = null,
        string sourceRetrievedAt = "2026-09-01T00:00:00Z",
        string? derivationRuleId = null,
        string? note = null,
        string relievedAt = "2026-09-07T00:00:00Z") =>
        new
        {
            subjectType,
            subjectId = subjectId ?? Unsta,
            field,
            status,
            value,
            unit,
            period,
            sourceName,
            sourceUrl,
            sourceDocument,
            sourceRetrievedAt,
            derivationRuleId,
            note,
            relievedAt,
        };

    [Fact]
    public async Task Admin_creates_an_official_fact_for_the_institution()
    {
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync(
            "/api/academic/official-facts", NewFactBody());

        create.StatusCode.ShouldBe(HttpStatusCode.Created);
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();
        created!.Id.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public async Task Member_cannot_create_an_official_fact_403()
    {
        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"member.{Guid.NewGuid():N}@planb.local");

        var create = await member.Client.PostAsJsonAsync(
            "/api/academic/official-facts", NewFactBody());

        create.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Anonymous_cannot_create_an_official_fact_401()
    {
        using var anon = _fixture.Factory.CreateClient();

        var create = await anon.PostAsJsonAsync("/api/academic/official-facts", NewFactBody());

        create.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Creating_without_a_source_name_is_400()
    {
        // La fuente es obligatoria siempre (ADR-0090): sin sourceName el aggregate la rechaza y el
        // endpoint la traduce a 400, nunca se guarda una afirmación sin fuente.
        // El validator de forma (NotEmpty) frena antes que el aggregate: el body es el
        // ValidationProblem genérico de FluentValidation, no el Problem con el código de dominio
        // (ese camino lo cubren los unit tests de OfficialFact.Create). Lo que importa acá es que
        // nunca se guarda: 400, nunca 201.
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync(
            "/api/academic/official-facts", NewFactBody(sourceName: ""));

        create.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Creating_without_a_source_url_is_400()
    {
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync(
            "/api/academic/official-facts", NewFactBody(sourceUrl: ""));

        create.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Creating_for_a_subject_that_does_not_exist_is_404()
    {
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync(
            "/api/academic/official-facts",
            NewFactBody(subjectType: "Offering", subjectId: Guid.NewGuid()));

        create.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await create.Content.ReadAsStringAsync()).ShouldContain("subject_not_found");
    }

    [Fact]
    public async Task Creating_with_an_invalid_status_is_400()
    {
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync(
            "/api/academic/official-facts", NewFactBody(status: "NotAStatus"));

        create.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Reading_official_facts_does_not_need_a_session()
    {
        using var anon = _fixture.Factory.CreateClient();

        var read = await anon.GetAsync($"/api/academic/official-facts?subjectType=Institution&subjectId={Unsta}");

        read.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Reading_an_unknown_subject_type_is_400()
    {
        using var anon = _fixture.Factory.CreateClient();

        var read = await anon.GetAsync($"/api/academic/official-facts?subjectType=NotAType&subjectId={Unsta}");

        read.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Reading_without_a_subject_id_is_400()
    {
        using var anon = _fixture.Factory.CreateClient();

        var read = await anon.GetAsync("/api/academic/official-facts?subjectType=Institution");

        read.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Reading_returns_only_the_most_recently_relieved_fact_per_field()
    {
        // Dos fuentes que no cierran (K04 del relevamiento): SIPES dice presencial, el sitio dice
        // presencial y a distancia. Las dos conviven; el read trae solo la vigente (la relevada
        // después), con su fuente y su estado.
        var admin = await AdminAsync();
        var field = $"admission_regime"; // campo curado, mismo para ambas afirmaciones

        var older = await admin.Client.PostAsJsonAsync(
            "/api/academic/official-facts",
            NewFactBody(
                field: field, value: "Presencial", sourceName: "SIPES",
                sourceUrl: "https://sipes.siu.edu.ar", relievedAt: "2026-01-01T00:00:00Z"));
        older.StatusCode.ShouldBe(HttpStatusCode.Created);

        var newer = await admin.Client.PostAsJsonAsync(
            "/api/academic/official-facts",
            NewFactBody(
                field: field, value: "Presencial y a distancia", sourceName: "Sitio UNSTA",
                sourceUrl: "https://unsta.edu.ar/ingreso", relievedAt: "2026-09-07T00:00:00Z"));
        newer.StatusCode.ShouldBe(HttpStatusCode.Created);

        using var anon = _fixture.Factory.CreateClient();
        var read = await anon.GetFromJsonAsync<ReadDto>(
            $"/api/academic/official-facts?subjectType=Institution&subjectId={Unsta}");

        var current = read!.Facts.Single(f => f.Field == field);
        current.Value.ShouldBe("Presencial y a distancia");
        current.SourceName.ShouldBe("Sitio UNSTA");
        current.Status.ShouldBe("Published");
    }

    private sealed record CreatedDto(Guid Id);
    private sealed record ReadDto(IReadOnlyList<FactDto> Facts);
    private sealed record FactDto(
        Guid Id, string Field, string? Value, string? Unit, string? Period, string Status,
        string SourceName, string SourceUrl, string? SourceDocument, DateTimeOffset SourceRetrievedAt,
        string? DerivationRuleId, string? Note, DateTimeOffset RelievedAt);
}
