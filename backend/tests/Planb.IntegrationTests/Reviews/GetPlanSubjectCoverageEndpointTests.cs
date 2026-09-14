using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de <c>GET /api/reviews/career-plans/{careerPlanId}/subject-coverage</c>
/// (US-134): el conteo detrás de la cobertura de cada materia con al menos una reseña, cubierta o
/// no. Mismo seed que <see cref="GetChairsNearFloorEndpointTests"/>: TUDCS (UNSTA), 211 Fundamentos
/// de Control de Calidad con tres cátedras (Pérez, González, Ruiz) y el resto de las materias del
/// plan con una sola cátedra cada una.
/// </summary>
public class GetPlanSubjectCoverageEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");

    // 211 Fundamentos de Control de Calidad, con las cátedras de González y Pérez.
    private static readonly Guid Subject211 =
        Guid.Parse("00000004-0000-4000-a000-000000000012");
    private static readonly Guid ChairGonzalez =
        Guid.Parse("00000008-0000-4000-a000-000000000002");
    private static readonly Guid ChairPerez =
        Guid.Parse("00000008-0000-4000-a000-000000000001");

    // Otra materia del mismo plan, con dos cátedras sembradas (Ibáñez y Vega): esta prueba solo
    // reseña la de Ibáñez, así que ChairCount cuenta 1 (cátedras CON reseña, no cátedras del
    // catálogo), lo que sirve para tener, en la misma respuesta, una materia por debajo del piso
    // además de la que lo cruza.
    private static readonly Guid Subject205 =
        Guid.Parse("00000004-0000-4000-a000-000000000005");
    private static readonly Guid ChairIbanez =
        Guid.Parse("00000008-0000-4000-a000-000000000004");

    private static readonly Guid[] Terms =
    [
        Guid.Parse("00000005-0000-4000-a000-000000000001"),
        Guid.Parse("00000005-0000-4000-a000-000000000002"),
        Guid.Parse("00000005-0000-4000-a000-000000000003"),
        Guid.Parse("00000005-0000-4000-a000-000000000004"),
        Guid.Parse("00000005-0000-4000-a000-000000000005"),
        Guid.Parse("00000005-0000-4000-a000-000000000006"),
    ];

    public GetPlanSubjectCoverageEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    /// <summary>Publica reseñas de <paramref name="subjectId"/> sobre una cátedra puntual, cada una con su propia cuenta.</summary>
    private async Task PublishAsync(Guid subjectId, Guid chairId, int from, int count)
    {
        for (var i = from; i < from + count; i++)
        {
            var auth = await AuthenticatedClient.CreateAsync(
                _fixture, $"plan-subject-coverage-{i}.{Guid.NewGuid():N}@planb.local");

            var profile = await auth.Client.PostAsJsonAsync(
                "/api/me/student-profiles",
                new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
            profile.EnsureSuccessStatusCode();

            var published = await auth.Client.PostAsJsonAsync(
                "/api/reviews/courses",
                new
                {
                    subjectId,
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
    public async Task An_unknown_plan_has_no_subject_coverage()
    {
        var response = await _anonymous.GetAsync(
            $"/api/reviews/career-plans/{Guid.NewGuid()}/subject-coverage");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var views = await response.Content.ReadFromJsonAsync<List<ViewDto>>();
        views.ShouldBeEmpty();
    }

    /// <summary>
    /// Recorrido único (mismo criterio que <c>GetCatalogCoverageEndpointTests</c>): las dos
    /// materias del plan comparten la base sembrada, así que partirlo en tests separados las
    /// contaminaría entre sí según el orden en que xUnit los corra.
    /// </summary>
    [Fact]
    public async Task A_covered_subject_and_one_below_the_floor_both_appear_with_their_own_counts()
    {
        // ---- Sin reseñas: ninguna de las dos materias aparece (nada que contar todavía).
        var empty = await _anonymous.GetOkAsync<List<ViewDto>>(
            $"/api/reviews/career-plans/{TudcsPlanId}/subject-coverage");
        empty!.ShouldNotContain(v => v.SubjectId == Subject211);
        empty.ShouldNotContain(v => v.SubjectId == Subject205);

        // ---- 205 junta 4 reseñas en la cátedra de Ibáñez: por debajo del piso, pero aparece.
        await PublishAsync(Subject205, ChairIbanez, from: 400, count: 4);
        // ---- 211 llega a las 10 con González: cruza el piso con una sola cátedra.
        await PublishAsync(Subject211, ChairGonzalez, from: 500, count: 10);

        var views = await _anonymous.GetOkAsync<List<ViewDto>>(
            $"/api/reviews/career-plans/{TudcsPlanId}/subject-coverage");

        var below = views!.Single(v => v.SubjectId == Subject205);
        below.ReviewCount.ShouldBe(4);
        below.ChairCount.ShouldBe(1);
        below.IsCovered.ShouldBeFalse();

        var covered = views.Single(v => v.SubjectId == Subject211);
        covered.ReviewCount.ShouldBe(10);
        covered.ChairCount.ShouldBe(1);
        covered.IsCovered.ShouldBeTrue();

        // ---- 211 suma una segunda cátedra (Pérez, 3 reseñas): el total sube a 13 y ChairCount a
        // 2, pero la cobertura sigue viniendo de González sola, no de la suma (Pérez con 3 no
        // cruza nada, y no hace falta que lo haga).
        await PublishAsync(Subject211, ChairPerez, from: 600, count: 3);

        var afterSecondChair = await _anonymous.GetOkAsync<List<ViewDto>>(
            $"/api/reviews/career-plans/{TudcsPlanId}/subject-coverage");
        var twoChairs = afterSecondChair!.Single(v => v.SubjectId == Subject211);
        twoChairs.ReviewCount.ShouldBe(13);
        twoChairs.ChairCount.ShouldBe(2);
        twoChairs.IsCovered.ShouldBeTrue();
    }

    private sealed record ViewDto(Guid SubjectId, int ReviewCount, int ChairCount, bool IsCovered);
}
