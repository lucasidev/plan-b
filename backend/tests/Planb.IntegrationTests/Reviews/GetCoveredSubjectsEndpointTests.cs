using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de <c>GET /api/reviews/career-plans/{careerPlanId}/covered-subjects</c>
/// (US-134, V10: la lista de materias del plan no marca cuáles tienen ficha) contra la base real.
///
/// <para>
/// Lo que se prueba acá y no en el modelo: que el JOIN cross-schema (academic.subjects +
/// academic.chairs + reviews.reviews) de verdad acote por <c>career_plan_id</c>, que una materia bajo
/// el piso no aparezca, y que cruzar el piso la haga aparecer una sola vez aunque tenga más de una
/// cátedra.
/// </para>
/// </summary>
public class GetCoveredSubjectsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    // TUDCS (UNSTA), mismos ids que GetCareerFactsEndpointTests: 21 materias en el plan vigente.
    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");

    // 211 Fundamentos de Control de Calidad: la única materia con cátedras sembradas.
    private static readonly Guid Subject211 =
        Guid.Parse("00000004-0000-4000-a000-000000000012");

    private static readonly Guid ChairPerez =
        Guid.Parse("00000008-0000-4000-a000-000000000001");
    private static readonly Guid ChairGonzalez =
        Guid.Parse("00000008-0000-4000-a000-000000000002");

    private static readonly Guid[] Terms =
    [
        Guid.Parse("00000005-0000-4000-a000-000000000001"),
        Guid.Parse("00000005-0000-4000-a000-000000000002"),
        Guid.Parse("00000005-0000-4000-a000-000000000003"),
        Guid.Parse("00000005-0000-4000-a000-000000000004"),
        Guid.Parse("00000005-0000-4000-a000-000000000005"),
        Guid.Parse("00000005-0000-4000-a000-000000000006"),
    ];

    public GetCoveredSubjectsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    /// <summary>Publica reseñas de 211 sobre una cátedra puntual, cada una con su cuenta.</summary>
    private async Task PublishAsync(Guid chairId, int from, int count)
    {
        for (var i = from; i < from + count; i++)
        {
            var auth = await AuthenticatedClient.CreateAsync(
                _fixture, $"covered-subjects-{i}.{Guid.NewGuid():N}@planb.local");

            var profile = await auth.Client.PostAsJsonAsync(
                "/api/me/student-profiles",
                new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
            profile.EnsureSuccessStatusCode();

            var published = await auth.Client.PostAsJsonAsync(
                "/api/reviews/courses",
                new
                {
                    subjectId = Subject211,
                    termId = Terms[i % Terms.Length],
                    chairId = (Guid?)chairId,
                    answers = new[]
                    {
                        new { itemCode = "COURSE_OUTCOME", optionValue = 1 },
                        new { itemCode = "CHAIR_ANSWERS_IN_CLASS", optionValue = 1 },
                    },
                    freeText = (string?)null,
                });
            published.StatusCode.ShouldBe(HttpStatusCode.Created);
        }
    }

    [Fact]
    public async Task An_unknown_plan_has_no_covered_subjects()
    {
        var response = await _anonymous.GetAsync(
            $"/api/reviews/career-plans/{Guid.NewGuid()}/covered-subjects");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var subjectIds = await response.Content.ReadFromJsonAsync<List<Guid>>();
        subjectIds.ShouldBeEmpty();
    }

    [Fact]
    public async Task The_plan_lists_a_subject_once_a_chair_crosses_the_floor()
    {
        // ---- Sin reseñas: la lista no trae 211 (ni ninguna otra materia del plan).
        var empty = await _anonymous.GetOkAsync<List<Guid>>(
            $"/api/reviews/career-plans/{TudcsPlanId}/covered-subjects");
        empty!.ShouldNotContain(Subject211);

        // ---- Bajo el piso en Pérez: 211 todavía no cuenta.
        await PublishAsync(ChairPerez, from: 200, count: 4);
        var below = await _anonymous.GetOkAsync<List<Guid>>(
            $"/api/reviews/career-plans/{TudcsPlanId}/covered-subjects");
        below!.ShouldNotContain(Subject211);

        // ---- González llega al piso: 211 aparece, una sola vez aunque tenga dos cátedras.
        await PublishAsync(ChairGonzalez, from: 300, count: 10);
        var covered = await _anonymous.GetOkAsync<List<Guid>>(
            $"/api/reviews/career-plans/{TudcsPlanId}/covered-subjects");
        covered!.ShouldContain(Subject211);
        covered.Count(id => id == Subject211).ShouldBe(1);
    }
}
