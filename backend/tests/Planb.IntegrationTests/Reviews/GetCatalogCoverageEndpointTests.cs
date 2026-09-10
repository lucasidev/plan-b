using System.Net;
using System.Net.Http.Json;
using Planb.Academic.Application.Features.AdminCareers;
using Planb.Academic.Infrastructure.Seeding;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Features.CatalogCoverage;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

/// <summary>
/// Integration tests de <c>GET /api/reviews/catalog-coverage</c> (US-222, ficha de SC-003) contra
/// la base real: que el batch cruce academic con reviews de verdad (ADR-0017), que una carrera sin
/// plan cargado no rompa el conteo y quede en cero en vez de faltar, que la presencia de datos
/// oficiales (ADR-0090) viaje independiente de las voces, y que ninguna reseña bajo el piso de
/// publicación aparezca como número.
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

    // Con las 225 carreras reales de R6 (Guía SIU, ADR-0090) ya no queda ninguna sin al menos un
    // dato oficial relevado: hasta "Abogado", que este test usaba antes, tiene duración y régimen
    // de ingreso desde R6. El caso "la carrera sin nada del catálogo" se crea en el propio test
    // (POST admin) en vez de apoyarse en un id fijo del seed.

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
    ///
    /// El tramo bajo el piso es el caso que corrige el hueco original (R6, #486): una cátedra con
    /// menos reseñas que el piso no puede aportar su conteo a <c>VoiceCount</c>, ni siquiera una vez
    /// que OTRA cátedra de la misma carrera sí publica.
    /// </summary>
    [Fact]
    public async Task A_career_with_nothing_stays_zero_while_another_gains_voices_and_coverage()
    {
        // Nace sin plan y sin ningún dato oficial declarado: es la carrera sin nada del catálogo.
        var admin = await AuthenticatedClient.CreateAsync(
            _fixture, $"catalog-coverage-admin.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);
        var createCareer = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{AcademicSeedData.Unsta.Id.Value}/careers",
            new
            {
                name = "Carrera Sin Relevar",
                slug = $"carrera-sin-relevar-{Guid.NewGuid():N}",
                shortName = (string?)null,
                code = (string?)null,
                degreeType = (string?)null,
                durationYears = (int?)null,
                cadence = (string?)null,
                description = (string?)null,
            });
        createCareer.StatusCode.ShouldBe(HttpStatusCode.Created);
        var emptyCareerId = (await createCareer.Content.ReadFromJsonAsync<CreateCareerResponse>())!.Id;

        // ---- Sin reseñas: la carrera recién creada no tiene plan ni datos oficiales, TUDCS ya
        // tiene datos oficiales (sembrados) pero todavía ninguna voz.
        var before = await _anonymous.GetOkAsync<GetCatalogCoverageResponse>(
            "/api/reviews/catalog-coverage");

        var emptyCareer = before!.Careers.Single(c => c.CareerId == emptyCareerId);
        emptyCareer.CareerName.ShouldBe("Carrera Sin Relevar");
        emptyCareer.HasOfficialData.ShouldBeFalse();
        emptyCareer.VoiceCount.ShouldBe(0);
        emptyCareer.HasReviewsBelowFloor.ShouldBeFalse();
        emptyCareer.TotalSubjects.ShouldBe(0);
        emptyCareer.CoveredSubjects.ShouldBe(0);

        var tudcsBefore = before.Careers.Single(c => c.CareerId == TudcsCareerId);
        tudcsBefore.CareerName.ShouldBe("Tecnicatura Universitaria en Desarrollo y Calidad de Software");
        tudcsBefore.UniversityName.ShouldBe("Universidad del Norte Santo Tomás de Aquino");
        tudcsBefore.HasOfficialData.ShouldBeTrue();
        tudcsBefore.VoiceCount.ShouldBe(0);
        tudcsBefore.HasReviewsBelowFloor.ShouldBeFalse();
        tudcsBefore.TotalSubjects.ShouldBe(21);
        tudcsBefore.CoveredSubjects.ShouldBe(0);

        // ---- Pérez junta 3 (bajo el piso de 10): esa cátedra no publica, así que ni la cobertura
        // ni las voces se mueven. Lo único que cambia es que ahora hay actividad para señalar, sin
        // decir cuánta: nunca "3 voces" al lado de una carrera con una sola cátedra bajo el piso.
        await PublishAsync(ChairPerez, from: 0, count: 3);

        var underFloor = await _anonymous.GetOkAsync<GetCatalogCoverageResponse>(
            "/api/reviews/catalog-coverage");
        var tudcsUnderFloor = underFloor!.Careers.Single(c => c.CareerId == TudcsCareerId);
        tudcsUnderFloor.VoiceCount.ShouldBe(0);
        tudcsUnderFloor.HasReviewsBelowFloor.ShouldBeTrue();
        tudcsUnderFloor.CoveredSubjects.ShouldBe(0);

        // ---- González llega justo a las 10 (el piso): la materia 211 ya cuenta, pero las voces
        // publicadas son solo las de González (10), no la suma con Pérez (3 + 10 = 13): la cátedra
        // de Pérez sigue bajo su propio piso y sus reseñas no publican, aunque la materia ya mida.
        await PublishAsync(ChairGonzalez, from: 100, count: 10);

        var after = await _anonymous.GetOkAsync<GetCatalogCoverageResponse>(
            "/api/reviews/catalog-coverage");
        var tudcsAfter = after!.Careers.Single(c => c.CareerId == TudcsCareerId);
        tudcsAfter.VoiceCount.ShouldBe(10);
        tudcsAfter.HasReviewsBelowFloor.ShouldBeTrue();
        tudcsAfter.TotalSubjects.ShouldBe(21);
        tudcsAfter.CoveredSubjects.ShouldBe(1);
        tudcsAfter.HasOfficialData.ShouldBeTrue();

        // La carrera recién creada no se movió: nadie reseñó ahí.
        var emptyCareerAfter = after.Careers.Single(c => c.CareerId == emptyCareerId);
        emptyCareerAfter.VoiceCount.ShouldBe(0);
        emptyCareerAfter.HasReviewsBelowFloor.ShouldBeFalse();
        emptyCareerAfter.HasOfficialData.ShouldBeFalse();
    }
}
