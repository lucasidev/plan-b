using System.Net;
using System.Net.Http.Json;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Infrastructure.Seeding;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Integration tests del grafo público de correlativas (GET /api/academic/prerequisites?careerPlanId=).
/// Usa el seed determinístico de <see cref="AcademicSeedData"/> (plan TUDCS, que ya trae
/// correlativas reales) en vez de armar datos propios: alcanza para validar el wiring HTTP + el
/// doble join a subjects (code + name de ambos lados). Sin auth (catálogo público), mismo patrón
/// que <see cref="PublicCatalogEndpointsTests"/>.
/// </summary>
public class PublicPrerequisitesEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly HttpClient _client;

    public PublicPrerequisitesEndpointTests(RegisterApiFixture fixture)
    {
        _client = fixture.Factory.CreateClient();
    }

    [Fact]
    public async Task ListPrerequisites_returns_edge_with_subject_codes_and_names()
    {
        var tudcsPlanId = AcademicSeedData.Careers[2].Plan.Id.Value; // TUDCS UNSTA

        var response = await _client.GetAsync(
            $"/api/academic/prerequisites?careerPlanId={tudcsPlanId}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var edges = await response.Content.ReadFromJsonAsync<List<PublicPrerequisiteEdge>>();
        edges.ShouldNotBeNull();

        // 213 Desarrollo Front End requiere 111 Desarrollo de Software (par real del seed, ver
        // AcademicSeedData.PrerequisitePairs: ("14", "05")).
        var frontEndId = Guid.Parse("00000004-0000-4000-a000-000000000014");
        var softwareDevId = Guid.Parse("00000004-0000-4000-a000-000000000005");

        var toEnroll = edges!.Single(e =>
            e.SubjectId == frontEndId
            && e.RequiredSubjectId == softwareDevId
            && e.Type == "ToEnroll");

        toEnroll.SubjectCode.ShouldBe("213");
        toEnroll.SubjectName.ShouldBe("Desarrollo Front End");
        toEnroll.RequiredSubjectCode.ShouldBe("111");
        toEnroll.RequiredSubjectName.ShouldBe("Desarrollo de Software");

        // El seed carga los dos grafos por pareja (ADR-0003): el mismo par de materias también
        // tiene que aparecer en ToTakeFinal, de forma independiente.
        edges.ShouldContain(e =>
            e.SubjectId == frontEndId
            && e.RequiredSubjectId == softwareDevId
            && e.Type == "ToTakeFinal");
    }

    [Fact]
    public async Task ListPrerequisites_returns_empty_array_for_plan_without_prerequisites()
    {
        var response = await _client.GetAsync(
            $"/api/academic/prerequisites?careerPlanId={Guid.NewGuid()}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var edges = await response.Content.ReadFromJsonAsync<List<PublicPrerequisiteEdge>>();
        edges.ShouldNotBeNull();
        edges.ShouldBeEmpty();
    }

    [Fact]
    public async Task ListPrerequisites_returns_400_when_careerPlanId_missing()
    {
        var response = await _client.GetAsync("/api/academic/prerequisites");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }
}
