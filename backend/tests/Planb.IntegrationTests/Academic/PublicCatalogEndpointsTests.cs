using System.Net;
using System.Net.Http.Json;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Infrastructure.Seeding;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Integration tests para los 3 endpoints públicos del catálogo Academic (US-037-b):
///   - GET /api/academic/universities
///   - GET /api/academic/careers?universityId=
///   - GET /api/academic/career-plans?careerId=
///
/// Usan el seed determinístico de <see cref="AcademicSeedData"/> que ya levantó el host
/// (RegisterApiFixture aplica el seeder al startup). No necesitan auth (catálogo público).
/// </summary>
public class PublicCatalogEndpointsTests : IClassFixture<RegisterApiFixture>
{
    private readonly HttpClient _client;

    public PublicCatalogEndpointsTests(RegisterApiFixture fixture)
    {
        _client = fixture.Factory.CreateClient();
    }

    [Fact]
    public async Task ListUniversities_returns_200_with_all_seeded_universities()
    {
        var response = await _client.GetAsync("/api/academic/universities");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var unis = await response.Content.ReadFromJsonAsync<List<UniversityListItem>>();
        unis.ShouldNotBeNull();
        unis!.Count.ShouldBe(AcademicSeedData.Universities.Count);

        // El SQL incluye ORDER BY name ASC, pero el orden exacto depende del collation de
        // Postgres (case-insensitive en default UTF-8) y no del comparador C#. No chequeamos
        // orden exacto; chequeamos set-equality contra el seed.
        var seedIds = AcademicSeedData.Universities.Select(u => u.Id.Value).ToHashSet();
        unis.Select(u => u.Id).ShouldBe(seedIds, ignoreOrder: true);
    }

    [Fact]
    public async Task ListCareers_returns_only_careers_of_requested_university()
    {
        var unstaId = AcademicSeedData.Unsta.Id.Value;

        var response = await _client.GetAsync($"/api/academic/careers?universityId={unstaId}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var careers = await response.Content.ReadFromJsonAsync<List<CareerListItem>>();
        careers.ShouldNotBeNull();
        careers!.ShouldNotBeEmpty();
        careers.ShouldAllBe(c => c.UniversityId == unstaId);

        // Match con el seed: 4 carreras de UNSTA (las primeras 4 en AcademicSeedData.Careers).
        var unstaSeedIds = AcademicSeedData.Careers
            .Where(c => c.Career.UniversityId == AcademicSeedData.Unsta.Id)
            .Select(c => c.Career.Id.Value)
            .ToHashSet();
        careers.Select(c => c.Id).ShouldBe(unstaSeedIds, ignoreOrder: true);
    }

    [Fact]
    public async Task ListCareers_returns_empty_for_unknown_university()
    {
        var unknownId = Guid.NewGuid();

        var response = await _client.GetAsync($"/api/academic/careers?universityId={unknownId}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var careers = await response.Content.ReadFromJsonAsync<List<CareerListItem>>();
        careers.ShouldBeEmpty();
    }

    [Fact]
    public async Task ListCareers_returns_400_when_universityId_missing()
    {
        var response = await _client.GetAsync("/api/academic/careers");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ListCareerPlans_returns_only_plans_of_requested_career()
    {
        var tudcsCareerId = AcademicSeedData.Careers[2].Career.Id.Value; // TUDCS UNSTA

        var response = await _client.GetAsync(
            $"/api/academic/career-plans?careerId={tudcsCareerId}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var plans = await response.Content.ReadFromJsonAsync<List<CareerPlanListItem>>();
        plans.ShouldNotBeNull();
        plans!.ShouldNotBeEmpty();
        plans.ShouldAllBe(p => p.CareerId == tudcsCareerId);
    }

    [Fact]
    public async Task ListCareerPlans_returns_400_when_careerId_missing()
    {
        var response = await _client.GetAsync("/api/academic/career-plans");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }
}
