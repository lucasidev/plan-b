using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Infrastructure.Seeding;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Integration tests para los 2 endpoints nuevos del catálogo Academic (PR1 destrabante de
/// US-013):
///   - GET /api/academic/subjects?careerPlanId=
///   - GET /api/academic/academic-terms?universityId=
///
/// Más: validación directa de <see cref="IAcademicQueryService.IsSubjectInPlanAsync"/> via DI
/// (no hay endpoint público para esa query, vive del lado app para que los handlers crossbc lo
/// invoquen). El test usa <see cref="RegisterApiFixture"/> que ya levantó la API con el seeder
/// aplicado, así que los IDs del seed están disponibles.
/// </summary>
public class SubjectsAndTermsCatalogTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _client;

    public SubjectsAndTermsCatalogTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Factory.CreateClient();
    }

    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");

    private static readonly Guid UnstaId =
        Guid.Parse("00000001-0000-4000-a000-000000000001");

    // -------------------------------------------------------------------
    // GET /api/academic/subjects
    // -------------------------------------------------------------------

    [Fact]
    public async Task ListSubjects_returns_seeded_subjects_for_TUDCS_plan()
    {
        var response = await _client.GetAsync(
            $"/api/academic/subjects?careerPlanId={TudcsPlanId}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var subjects = await response.Content.ReadFromJsonAsync<List<SubjectListItem>>();
        subjects.ShouldNotBeNull();
        subjects!.ShouldNotBeEmpty();
        subjects.ShouldAllBe(s => s.CareerPlanId == TudcsPlanId);

        var seedIds = AcademicSeedData.Subjects
            .Where(s => s.CareerPlanId.Value == TudcsPlanId)
            .Select(s => s.Id.Value)
            .ToHashSet();
        subjects.Select(s => s.Id).ShouldBe(seedIds, ignoreOrder: true);
    }

    [Fact]
    public async Task ListSubjects_orders_by_year_term_code()
    {
        var response = await _client.GetAsync(
            $"/api/academic/subjects?careerPlanId={TudcsPlanId}");

        var subjects = await response.Content.ReadFromJsonAsync<List<SubjectListItem>>();
        subjects.ShouldNotBeNull();

        // Verifico que las materias de 1º vienen antes que las de 2º antes que las de 3º.
        var firstYear = subjects!.Where(s => s.YearInPlan == 1).ToList();
        var thirdYear = subjects.Where(s => s.YearInPlan == 3).ToList();

        firstYear.Count.ShouldBeGreaterThan(0);
        thirdYear.Count.ShouldBeGreaterThan(0);

        var firstYearMaxIndex = subjects.FindLastIndex(s => s.YearInPlan == 1);
        var thirdYearMinIndex = subjects.FindIndex(s => s.YearInPlan == 3);
        firstYearMaxIndex.ShouldBeLessThan(thirdYearMinIndex);
    }

    [Fact]
    public async Task ListSubjects_returns_empty_for_unknown_plan()
    {
        var unknownId = Guid.NewGuid();

        var response = await _client.GetAsync(
            $"/api/academic/subjects?careerPlanId={unknownId}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var subjects = await response.Content.ReadFromJsonAsync<List<SubjectListItem>>();
        subjects.ShouldBeEmpty();
    }

    [Fact]
    public async Task ListSubjects_returns_400_when_careerPlanId_missing()
    {
        var response = await _client.GetAsync("/api/academic/subjects");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ListSubjects_returns_400_when_careerPlanId_is_empty_guid()
    {
        var response = await _client.GetAsync(
            $"/api/academic/subjects?careerPlanId={Guid.Empty}");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    // -------------------------------------------------------------------
    // GET /api/academic/academic-terms
    // -------------------------------------------------------------------

    [Fact]
    public async Task ListAcademicTerms_returns_seeded_terms_for_UNSTA()
    {
        var response = await _client.GetAsync(
            $"/api/academic/academic-terms?universityId={UnstaId}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var terms = await response.Content.ReadFromJsonAsync<List<AcademicTermListItem>>();
        terms.ShouldNotBeNull();
        terms!.ShouldNotBeEmpty();
        terms.ShouldAllBe(t => t.UniversityId == UnstaId);

        var seedIds = AcademicSeedData.AcademicTerms
            .Where(t => t.UniversityId.Value == UnstaId)
            .Select(t => t.Id.Value)
            .ToHashSet();
        terms.Select(t => t.Id).ShouldBe(seedIds, ignoreOrder: true);
    }

    [Fact]
    public async Task ListAcademicTerms_orders_most_recent_first()
    {
        var response = await _client.GetAsync(
            $"/api/academic/academic-terms?universityId={UnstaId}");

        var terms = await response.Content.ReadFromJsonAsync<List<AcademicTermListItem>>();
        terms.ShouldNotBeNull();
        terms!.Count.ShouldBeGreaterThan(1);

        // (Year, Number) DESC: el primero del array debe ser el más reciente.
        var sorted = terms.OrderByDescending(t => (t.Year, t.Number)).ToList();
        terms.ShouldBe(sorted);
    }

    [Fact]
    public async Task ListAcademicTerms_returns_empty_for_unknown_university()
    {
        var unknownId = Guid.NewGuid();

        var response = await _client.GetAsync(
            $"/api/academic/academic-terms?universityId={unknownId}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var terms = await response.Content.ReadFromJsonAsync<List<AcademicTermListItem>>();
        terms.ShouldBeEmpty();
    }

    [Fact]
    public async Task ListAcademicTerms_returns_400_when_universityId_missing()
    {
        var response = await _client.GetAsync("/api/academic/academic-terms");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    // -------------------------------------------------------------------
    // IsSubjectInPlanAsync (cross-BC contract, vía DI)
    // -------------------------------------------------------------------

    [Fact]
    public async Task IsSubjectInPlan_returns_true_for_seeded_subject_and_its_plan()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var queries = scope.ServiceProvider.GetRequiredService<IAcademicQueryService>();

        var anyTudcsSubject = AcademicSeedData.Subjects
            .First(s => s.CareerPlanId.Value == TudcsPlanId);

        var result = await queries.IsSubjectInPlanAsync(
            anyTudcsSubject.Id.Value, TudcsPlanId);

        result.ShouldBeTrue();
    }

    [Fact]
    public async Task IsSubjectInPlan_returns_false_for_subject_of_another_plan()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var queries = scope.ServiceProvider.GetRequiredService<IAcademicQueryService>();

        var anyTudcsSubject = AcademicSeedData.Subjects
            .First(s => s.CareerPlanId.Value == TudcsPlanId);

        // El subject sí existe en DB pero el plan que pasamos no es el suyo.
        var someOtherPlanId = Guid.Parse("00000003-0000-4000-a000-000000000010"); // Siglo21 Ing.Software
        var result = await queries.IsSubjectInPlanAsync(
            anyTudcsSubject.Id.Value, someOtherPlanId);

        result.ShouldBeFalse();
    }

    [Fact]
    public async Task IsSubjectInPlan_returns_false_for_unknown_subject()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var queries = scope.ServiceProvider.GetRequiredService<IAcademicQueryService>();

        var result = await queries.IsSubjectInPlanAsync(
            Guid.NewGuid(), TudcsPlanId);

        result.ShouldBeFalse();
    }
}
