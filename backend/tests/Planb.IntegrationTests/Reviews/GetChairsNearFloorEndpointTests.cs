using System.Net;
using System.Net.Http.Json;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de <c>GET /api/reviews/careers/{careerId}/chairs-near-floor</c> (US-134):
/// qué cátedras están a exactamente una reseña de cruzar el piso. Mismo seed que
/// <see cref="GetPlanSubjectCoverageEndpointTests"/>: TUDCS (UNSTA), materia 211 Fundamentos de
/// Control de Calidad con tres cátedras (Pérez, González, Ruiz) y el resto de las materias del
/// plan con una sola cátedra cada una.
/// </summary>
public class GetChairsNearFloorEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    private static readonly Guid TudcsCareerId =
        Guid.Parse("00000002-0000-4000-a000-000000000003");
    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject211 =
        Guid.Parse("00000004-0000-4000-a000-000000000012");
    private static readonly Guid ChairPerez =
        Guid.Parse("00000008-0000-4000-a000-000000000001");
    private static readonly Guid ChairGonzalez =
        Guid.Parse("00000008-0000-4000-a000-000000000002");
    private static readonly Guid ChairRuiz =
        Guid.Parse("00000008-0000-4000-a000-000000000003");

    // Dos materias distintas del mismo plan, cada una con su única cátedra sembrada: sirven para
    // que dos cátedras a la vez lleguen a nueve en sujetos distintos (GetLabelsAsync en lote con
    // más de un id de materia y de cátedra).
    private static readonly Guid Subject207 =
        Guid.Parse("00000004-0000-4000-a000-000000000007");
    private static readonly Guid ChairDominguez =
        Guid.Parse("00000008-0000-4000-a000-000000000006");
    private static readonly Guid Subject208 =
        Guid.Parse("00000004-0000-4000-a000-000000000008");
    private static readonly Guid ChairAraoz =
        Guid.Parse("00000008-0000-4000-a000-000000000007");

    private static readonly Guid[] Terms =
    [
        Guid.Parse("00000005-0000-4000-a000-000000000001"),
        Guid.Parse("00000005-0000-4000-a000-000000000002"),
        Guid.Parse("00000005-0000-4000-a000-000000000003"),
        Guid.Parse("00000005-0000-4000-a000-000000000004"),
        Guid.Parse("00000005-0000-4000-a000-000000000005"),
        Guid.Parse("00000005-0000-4000-a000-000000000006"),
    ];

    public GetChairsNearFloorEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"admin.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    /// <summary>Publica reseñas de <paramref name="subjectId"/> sobre una cátedra puntual, cada una con su propia cuenta.</summary>
    private async Task PublishAsync(Guid subjectId, Guid chairId, int from, int count)
    {
        for (var i = from; i < from + count; i++)
        {
            var auth = await AuthenticatedClient.CreateAsync(
                _fixture, $"chairs-near-floor-{i}.{Guid.NewGuid():N}@planb.local");

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
    public async Task An_unknown_career_has_no_chairs_near_floor()
    {
        var response = await _anonymous.GetAsync(
            $"/api/reviews/careers/{Guid.NewGuid()}/chairs-near-floor");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var views = await response.Content.ReadFromJsonAsync<List<ViewDto>>();
        views.ShouldBeEmpty();
    }

    /// <summary>
    /// Recorrido único (mismo criterio que <c>GetCatalogCoverageEndpointTests</c>): las cátedras de
    /// TUDCS comparten la base sembrada, así que partirlo en tests separados las contaminaría entre
    /// sí según el orden en que xUnit los corra.
    /// </summary>
    [Fact]
    public async Task Chairs_near_the_floor_appear_across_subjects_but_not_from_a_deprecated_plan()
    {
        // ---- Pérez llega a exactamente 9 (el piso menos una): a una reseña de publicar.
        await PublishAsync(Subject211, ChairPerez, from: 600, count: 9);
        // ---- González cruza el piso con 10: ya publica, no es "casi".
        await PublishAsync(Subject211, ChairGonzalez, from: 700, count: 10);
        // ---- Ruiz junta 8: todavía le faltan dos, no una.
        await PublishAsync(Subject211, ChairRuiz, from: 800, count: 8);
        // ---- Domínguez (207) y Aráoz (208) llegan a nueve al mismo tiempo, en materias
        // distintas: ejercita el lote de nombres (GetLabelsAsync) con más de un id de cátedra y
        // de materia.
        await PublishAsync(Subject207, ChairDominguez, from: 900, count: 9);
        await PublishAsync(Subject208, ChairAraoz, from: 950, count: 9);

        var views = await _anonymous.GetOkAsync<List<ViewDto>>(
            $"/api/reviews/careers/{TudcsCareerId}/chairs-near-floor");

        views!.Select(v => v.ChairId).ShouldBe(
            [ChairPerez, ChairDominguez, ChairAraoz], ignoreOrder: true);

        var perez = views.Single(v => v.ChairId == ChairPerez);
        perez.ChairName.ShouldBe("Pérez");
        perez.SubjectId.ShouldBe(Subject211);
        perez.SubjectName.ShouldBe("Fundamentos de Control de Calidad");
        perez.ReviewCount.ShouldBe(9);

        var dominguez = views.Single(v => v.ChairId == ChairDominguez);
        dominguez.ChairName.ShouldBe("Domínguez");
        dominguez.SubjectId.ShouldBe(Subject207);

        var araoz = views.Single(v => v.ChairId == ChairAraoz);
        araoz.ChairName.ShouldBe("Aráoz");
        araoz.SubjectId.ShouldBe(Subject208);

        // ---- Una materia nueva, en un plan de la misma carrera que se archiva antes de reseñar:
        // el piso no cambia (nueve reseñas), pero el plan deprecado ya no cuenta para la carrera
        // (mismo filtro que la cobertura M/N), así que su cátedra no puede estar "a una de
        // publicar" para algo que la carrera ya no mide.
        var admin = await AdminAsync();

        var createPlan = await admin.Client.PostAsJsonAsync(
            $"/api/academic/careers/{TudcsCareerId}/plans",
            new { year = 2015, label = "Plan archivado para el test" });
        createPlan.StatusCode.ShouldBe(HttpStatusCode.Created);
        var planId = (await createPlan.Content.ReadFromJsonAsync<CreatedDto>())!.Id;

        var deprecate = await admin.Client.PostAsync(
            $"/api/academic/career-plans/{planId}/deprecate", null);
        deprecate.StatusCode.ShouldBe(HttpStatusCode.OK);

        var createSubject = await admin.Client.PostAsJsonAsync(
            $"/api/academic/career-plans/{planId}/subjects",
            new
            {
                code = "TEST-DEPRECATED",
                name = "Materia de un plan archivado",
                yearInPlan = 1,
                termInYear = 1,
                termKind = "FourMonth",
                weeklyHours = 4,
                totalHours = 64,
                description = (string?)null,
            });
        createSubject.StatusCode.ShouldBe(HttpStatusCode.Created);
        var deprecatedSubjectId = (await createSubject.Content.ReadFromJsonAsync<CreatedDto>())!.Id;

        var createChair = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{deprecatedSubjectId}/chairs",
            new { name = "Cátedra archivada" });
        createChair.StatusCode.ShouldBe(HttpStatusCode.Created);
        var deprecatedChairId = (await createChair.Content.ReadFromJsonAsync<CreatedDto>())!.Id;

        await PublishAsync(deprecatedSubjectId, deprecatedChairId, from: 1000, count: 9);

        var afterDeprecated = await _anonymous.GetOkAsync<List<ViewDto>>(
            $"/api/reviews/careers/{TudcsCareerId}/chairs-near-floor");

        afterDeprecated!.ShouldNotContain(v => v.ChairId == deprecatedChairId);
        // Las tres de antes siguen ahí: archivar un plan nuevo no las afecta.
        afterDeprecated.Select(v => v.ChairId).ShouldBe(
            [ChairPerez, ChairDominguez, ChairAraoz], ignoreOrder: true);
    }

    private sealed record CreatedDto(Guid Id);
    private sealed record ViewDto(
        Guid ChairId, string ChairName, Guid SubjectId, string SubjectName, int ReviewCount);
}
