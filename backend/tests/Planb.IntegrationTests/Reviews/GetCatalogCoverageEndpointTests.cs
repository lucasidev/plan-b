using System.Net.Http.Json;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.CatalogCoverage;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de <c>GET /api/reviews/catalog-coverage</c> (US-222, ficha de SC-003) contra
/// la base real: que el batch cruce academic con reviews de verdad (ADR-0017), que una carrera sin
/// plan cargado no rompa el conteo y quede en cero en vez de faltar, y que la presencia de datos
/// oficiales (ADR-0090) viaje independiente de las voces.
/// </summary>
public class GetCatalogCoverageEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;
    private readonly HttpClient _anonymous;

    // TUDCS (UNSTA): 21 materias en su plan vigente, con datos oficiales sembrados
    // (OfficialFactSeedData). Mismos ids que GetCareerFactsEndpointTests.
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

    // Abogado (UNSTA, Centro Universitario Concepción): sembrada sin plan (AcademicSeedData,
    // Plan: null) y sin ninguna fila en OfficialFactSeedData. Es la carrera sin nada del catálogo:
    // el caso que prueba que el vacío se completa con cero en vez de faltar en la respuesta.
    private static readonly Guid AbogadoCareerId =
        Guid.Parse("00000002-0000-4000-a000-000000000100");

    private static readonly Guid[] Terms =
    [
        Guid.Parse("00000005-0000-4000-a000-000000000001"),
        Guid.Parse("00000005-0000-4000-a000-000000000002"),
        Guid.Parse("00000005-0000-4000-a000-000000000003"),
        Guid.Parse("00000005-0000-4000-a000-000000000004"),
        Guid.Parse("00000005-0000-4000-a000-000000000005"),
        Guid.Parse("00000005-0000-4000-a000-000000000006"),
    ];

    public GetCatalogCoverageEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
        _anonymous = fixture.Factory.CreateClient();
    }

    private async Task PublishAsync(Guid chairId, int from, int count)
    {
        for (var i = from; i < from + count; i++)
        {
            var auth = await AuthenticatedClient.CreateAsync(
                _fixture, $"catalog-coverage-{i}.{Guid.NewGuid():N}@planb.local");

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
            published.EnsureSuccessStatusCode();
        }
    }

    /// <summary>
    /// Recorrido único (mismo criterio que <c>GetCareerFactsEndpointTests</c>): la cobertura y las
    /// voces agregan TODO lo que hay sobre la carrera, así que partirlo en tests separados los
    /// contamina entre sí según el orden en que xUnit los corra.
    ///
    /// US-222 E2: cada entrada trae nombre, institución, voces y cobertura. N1/E3 (orden): esta
    /// respuesta no ordena nada, así que no hay cobertura ni voces "primero" que verificar acá; el
    /// criterio de orden lo prueba quien arma la pantalla.
    /// </summary>
    [Fact]
    public async Task A_career_with_nothing_stays_zero_while_another_gains_voices_and_coverage()
    {
        // ---- Sin reseñas: Abogado no tiene plan ni datos oficiales, TUDCS ya tiene datos
        // oficiales (sembrados) pero todavía ninguna voz.
        var before = await _anonymous.GetOkAsync<GetCatalogCoverageResponse>(
            "/api/reviews/catalog-coverage");

        var abogado = before!.Careers.Single(c => c.CareerId == AbogadoCareerId);
        abogado.CareerName.ShouldBe("Abogado");
        abogado.HasOfficialData.ShouldBeFalse();
        abogado.VoiceCount.ShouldBe(0);
        abogado.TotalSubjects.ShouldBe(0);
        abogado.CoveredSubjects.ShouldBe(0);

        var tudcsBefore = before.Careers.Single(c => c.CareerId == TudcsCareerId);
        tudcsBefore.CareerName.ShouldBe("Tecnicatura Universitaria en Desarrollo y Calidad de Software");
        tudcsBefore.UniversityName.ShouldBe("Universidad del Norte Santo Tomás de Aquino");
        tudcsBefore.HasOfficialData.ShouldBeTrue();
        tudcsBefore.VoiceCount.ShouldBe(0);
        tudcsBefore.TotalSubjects.ShouldBe(21);
        tudcsBefore.CoveredSubjects.ShouldBe(0);

        // ---- Pérez junta 3 (bajo el piso): las voces cuentan, la cobertura todavía no.
        await PublishAsync(ChairPerez, from: 0, count: 3);

        var underFloor = await _anonymous.GetOkAsync<GetCatalogCoverageResponse>(
            "/api/reviews/catalog-coverage");
        var tudcsUnderFloor = underFloor!.Careers.Single(c => c.CareerId == TudcsCareerId);
        tudcsUnderFloor.VoiceCount.ShouldBe(3);
        tudcsUnderFloor.CoveredSubjects.ShouldBe(0);

        // ---- González llega justo a las 10 (el piso): la materia 211 ya cuenta, las voces suman
        // las dos cátedras (3 + 10 = 13).
        await PublishAsync(ChairGonzalez, from: 100, count: 10);

        var after = await _anonymous.GetOkAsync<GetCatalogCoverageResponse>(
            "/api/reviews/catalog-coverage");
        var tudcsAfter = after!.Careers.Single(c => c.CareerId == TudcsCareerId);
        tudcsAfter.VoiceCount.ShouldBe(13);
        tudcsAfter.TotalSubjects.ShouldBe(21);
        tudcsAfter.CoveredSubjects.ShouldBe(1);
        tudcsAfter.HasOfficialData.ShouldBeTrue();

        // Abogado no se movió: nadie reseñó ahí.
        var abogadoAfter = after.Careers.Single(c => c.CareerId == AbogadoCareerId);
        abogadoAfter.VoiceCount.ShouldBe(0);
        abogadoAfter.HasOfficialData.ShouldBeFalse();
    }
}
