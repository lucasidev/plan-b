using System.Net;
using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.CareerFacts;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de <c>GET /api/reviews/careers/{careerId}/facts</c> (US-134, ADR-0085): la
/// ficha de una carrera contra la base real.
///
/// <para>
/// Lo que se prueba acá y no en el unit del handler: que la cobertura cruce de verdad academic con
/// reviews (el JOIN cross-schema, ADR-0017), que una materia sin cátedras no rompa el conteo, y que
/// una materia con una cátedra bajo el piso y otra sobre el piso cuente una sola vez.
/// </para>
/// </summary>
public class GetCareerFactsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    // TUDCS (UNSTA): 21 materias en su plan vigente, ver AcademicSeedData.
    private static readonly Guid TudcsCareerId =
        Guid.Parse("00000002-0000-4000-a000-000000000003");

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

    public GetCareerFactsEndpointTests(RegisterApiFixture fixture)
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
                _fixture, $"career-facts-{i}.{Guid.NewGuid():N}@planb.local");

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
    public async Task An_unknown_career_is_not_found()
    {
        var response = await _anonymous.GetAsync($"/api/reviews/careers/{Guid.NewGuid()}/facts");

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    /// <summary>
    /// El recorrido entero en un solo test, y no tres, a propósito: la cobertura de una carrera
    /// agrega TODO lo que hay sobre sus materias, así que dos tests que publiquen sobre la misma
    /// se contaminan siempre. Partirlo daría tests que pasan o fallan según el orden en que xUnit
    /// los corra, que es peor que un test largo (mismo criterio que
    /// <c>GetSubjectFactsEndpointTests</c>).
    /// </summary>
    [Fact]
    public async Task The_career_goes_from_no_coverage_to_one_subject_crossing_the_floor()
    {
        // ---- Sin reseñas: identidad más cobertura vacía, honesta y sin inventar datos oficiales.
        var empty = await _anonymous.GetFromJsonAsync<GetCareerFactsResponse>(
            $"/api/reviews/careers/{TudcsCareerId}/facts");

        empty!.CareerId.ShouldBe(TudcsCareerId);
        empty.CareerName.ShouldBe("Tecnicatura Universitaria en Desarrollo y Calidad de Software");
        empty.UniversityName.ShouldBe("Universidad del Norte Santo Tomás de Aquino");
        // El seed no carga duración: la ficha no puede inventarla.
        empty.DurationYears.ShouldBeNull();
        empty.TotalSubjects.ShouldBe(21);
        empty.CoveredSubjects.ShouldBe(0);
        empty.CoveragePercent.ShouldBe(0);

        // ---- Bajo el piso en las dos cátedras: la materia todavía no cuenta.
        await PublishAsync(ChairPerez, from: 0, count: 4);

        var below = await _anonymous.GetFromJsonAsync<GetCareerFactsResponse>(
            $"/api/reviews/careers/{TudcsCareerId}/facts");
        below!.CoveredSubjects.ShouldBe(0);

        // ---- González llega justo a las 10 (el piso, ni una reseña de más): ya alcanza.
        await PublishAsync(ChairGonzalez, from: 100, count: 10);

        var facts = await _anonymous.GetFromJsonAsync<GetCareerFactsResponse>(
            $"/api/reviews/careers/{TudcsCareerId}/facts");

        facts!.TotalSubjects.ShouldBe(21);
        // Una sola materia (211) cuenta, aunque tenga dos cátedras: la que no llegó al piso
        // (Pérez, con 4) no le agrega ni le resta nada al número.
        facts.CoveredSubjects.ShouldBe(1);
        // 1/21 = 4,76...%, redondeado hacia arriba (AwayFromZero) da 5.
        facts.CoveragePercent.ShouldBe(5);
    }
}
