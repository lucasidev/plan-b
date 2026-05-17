using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Application.Features.CareerPlanImports;
using Planb.Academic.Domain.CareerPlanImports;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Universities;
using Planb.Academic.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Integration tests del flujo POST /GET /approve de US-088 con foco en:
///   - 401 sin auth en los 3 endpoints (gate)
///   - 202 + GET shape correcto
///   - Conflict 409 cuando el plan ya existe (career+year colisiona)
///   - isOfficial=false en la response del GET /career-plans para los crowdsourced
///
/// El worker async (parser) se testea por separado en unit tests; acá nos enfocamos en
/// el contrato HTTP + transición a Approved + propagación del IsOfficial al catálogo.
/// </summary>
public class CareerPlanImportEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    private static readonly Guid UnstaUniversityId =
        Guid.Parse("00000001-0000-4000-a000-000000000001");

    public CareerPlanImportEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    // ── Auth gates ────────────────────────────────────────────────────────

    [Fact]
    public async Task Post_returns_401_without_session()
    {
        using var bootstrap = _fixture.Factory.CreateClient();
        var response = await bootstrap.PostAsJsonAsync(
            "/api/me/career-plan-imports",
            new
            {
                universityId = UnstaUniversityId,
                careerName = "Test",
                planYear = 2024,
                studentEnrollmentYear = 2024,
                rawText = "MAT101",
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_returns_401_without_session()
    {
        using var bootstrap = _fixture.Factory.CreateClient();
        var response = await bootstrap.GetAsync($"/api/me/career-plan-imports/{Guid.NewGuid()}");
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Approve_returns_401_without_session()
    {
        using var bootstrap = _fixture.Factory.CreateClient();
        var response = await bootstrap.PostAsJsonAsync(
            $"/api/me/career-plan-imports/{Guid.NewGuid()}/approve",
            new { items = Array.Empty<object>() });
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    // ── 404 university inexistente ────────────────────────────────────────

    [Fact]
    public async Task Post_returns_404_when_university_not_found()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"plan-import-noUni.{Guid.NewGuid():N}@planb.local");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/career-plan-imports",
            new
            {
                universityId = Guid.NewGuid(), // no existe
                careerName = "Test",
                planYear = 2024,
                studentEnrollmentYear = 2024,
                rawText = "MAT101 Algo",
            });

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    // ── Happy path: POST → GET ────────────────────────────────────────────

    [Fact]
    public async Task Post_returns_202_with_id_and_pending_status()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"plan-import-create.{Guid.NewGuid():N}@planb.local");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/career-plan-imports",
            new
            {
                universityId = UnstaUniversityId,
                careerName = "Tecnicatura En Algo Nuevo",
                planYear = 2024,
                studentEnrollmentYear = 2024,
                rawText = "MAT101 Análisis Matemático I",
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Accepted);
        var body = await response.Content.ReadFromJsonAsync<CreateCareerPlanImportResponse>();
        body.ShouldNotBeNull();
        body!.Id.ShouldNotBe(Guid.Empty);
        body.Status.ShouldBe("Pending");
    }

    [Fact]
    public async Task Get_returns_200_with_owner_import()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"plan-import-get.{Guid.NewGuid():N}@planb.local");

        var post = await auth.Client.PostAsJsonAsync(
            "/api/me/career-plan-imports",
            new
            {
                universityId = UnstaUniversityId,
                careerName = "Carrera Get Test",
                planYear = 2024,
                studentEnrollmentYear = 2024,
                rawText = "MAT101 Algo",
            });
        var created = await post.Content.ReadFromJsonAsync<CreateCareerPlanImportResponse>();

        var get = await auth.Client.GetAsync($"/api/me/career-plan-imports/{created!.Id}");
        get.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await get.Content.ReadFromJsonAsync<CareerPlanImportResponse>();
        body.ShouldNotBeNull();
        body!.Id.ShouldBe(created.Id);
        body.UniversityId.ShouldBe(UnstaUniversityId);
        body.CareerName.ShouldBe("Carrera Get Test");
    }

    [Fact]
    public async Task Get_returns_404_when_import_belongs_to_other_user()
    {
        var owner = await AuthenticatedClient.CreateAsync(
            _fixture, $"plan-import-owner.{Guid.NewGuid():N}@planb.local");
        var intruder = await AuthenticatedClient.CreateAsync(
            _fixture, $"plan-import-intruder.{Guid.NewGuid():N}@planb.local");

        var post = await owner.Client.PostAsJsonAsync(
            "/api/me/career-plan-imports",
            new
            {
                universityId = UnstaUniversityId,
                careerName = "Privada",
                planYear = 2024,
                studentEnrollmentYear = 2024,
                rawText = "MAT101",
            });
        var created = await post.Content.ReadFromJsonAsync<CreateCareerPlanImportResponse>();

        var sneak = await intruder.Client.GetAsync($"/api/me/career-plan-imports/{created!.Id}");
        sneak.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    // ── 413 payload too large ─────────────────────────────────────────────

    [Fact]
    public async Task Post_returns_413_when_text_payload_exceeds_5mb()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"plan-import-big.{Guid.NewGuid():N}@planb.local");

        var huge = new string('x', 6 * 1024 * 1024);

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/career-plan-imports",
            new
            {
                universityId = UnstaUniversityId,
                careerName = "BigPayload",
                planYear = 2024,
                studentEnrollmentYear = 2024,
                rawText = huge,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.RequestEntityTooLarge);
    }

    // ── Conflict 409: plan duplicado ──────────────────────────────────────

    [Fact]
    public async Task Approve_returns_409_when_plan_already_exists()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"plan-import-conflict.{Guid.NewGuid():N}@planb.local");

        // Setup: pre-cargar via DbContext una Career + CareerPlan con la triple que
        // vamos a tratar de duplicar via approve. Más rápido que correr 2 flujos paralelos.
        const string CareerNameForConflict = "Carrera En Conflicto";
        const int Year = 2024;
        var careerSlug = CareerNameForConflict.Trim().ToLowerInvariant().Replace(' ', '-');

        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
            var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();

            var existingCareer = Career.Create(
                new UniversityId(UnstaUniversityId),
                CareerNameForConflict,
                careerSlug,
                clock,
                isOfficial: true).Value;
            db.Careers.Add(existingCareer);

            var existingPlan = CareerPlan.Create(existingCareer.Id, Year, clock, isOfficial: true).Value;
            db.CareerPlans.Add(existingPlan);

            await db.SaveChangesAsync();
        }

        // Crear el import. Necesitamos llevarlo a Parsed manualmente porque sin esperar al
        // worker el aggregate queda en Pending y el approve falla con 409 distinto.
        var importPost = await auth.Client.PostAsJsonAsync(
            "/api/me/career-plan-imports",
            new
            {
                universityId = UnstaUniversityId,
                careerName = CareerNameForConflict,
                planYear = Year,
                studentEnrollmentYear = Year,
                rawText = "MAT101 Algo",
            });
        var created = await importPost.Content.ReadFromJsonAsync<CreateCareerPlanImportResponse>();

        // Forzar el aggregate a Parsed con un payload mínimo (saltea el worker async para
        // tener un test determinístico sin depender del timing de Wolverine).
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
            var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();
            var import = await db.CareerPlanImports.FindAsync(new CareerPlanImportId(created!.Id));
            import.ShouldNotBeNull();
            import!.MarkParsing(clock);
            import.MarkParsed(
                new CareerPlanImportPayload(
                    "MAT101 Algo",
                    new List<ParsedSubjectItem>
                    {
                        new(0, "MAT101 Algo", "MAT101", "Algo", 1, 1, "Cuatrimestral",
                            SubjectParseConfidence.High, Array.Empty<string>()),
                    },
                    new CareerPlanImportSummary(1, 1, 0, 0)),
                clock);
            await db.SaveChangesAsync();
        }

        // Approve: debería pegar 409 por el plan duplicado pre-existente.
        var approve = await auth.Client.PostAsJsonAsync(
            $"/api/me/career-plan-imports/{created.Id}/approve",
            new
            {
                items = new[]
                {
                    new
                    {
                        code = "MAT101",
                        name = "Algo",
                        yearInPlan = 1,
                        termInYear = (int?)1,
                        termKind = "Cuatrimestral",
                    },
                },
            });

        approve.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    // ── IsOfficial propaga al catálogo ────────────────────────────────────

    [Fact]
    public async Task CareerPlansList_exposes_isOfficial_flag_for_crowdsourced_plans()
    {
        // Insertamos directo via DbContext: Career + CareerPlan no-oficiales, después GET el
        // catálogo y verificamos que la flag aparece false en el response.
        const string CareerName = "Carrera No Oficial Catalogada";
        var slug = CareerName.Trim().ToLowerInvariant().Replace(' ', '-');
        Guid careerId;

        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
            var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();

            var career = Career.Create(
                new UniversityId(UnstaUniversityId),
                CareerName,
                slug,
                clock,
                isOfficial: false).Value;
            db.Careers.Add(career);

            var plan = CareerPlan.Create(career.Id, 2023, clock, isOfficial: false).Value;
            db.CareerPlans.Add(plan);

            await db.SaveChangesAsync();
            careerId = career.Id.Value;
        }

        using var client = _fixture.Factory.CreateClient();
        var response = await client.GetAsync($"/api/academic/career-plans?careerId={careerId}");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var plans = await response.Content.ReadFromJsonAsync<List<CareerPlanListItem>>();
        plans.ShouldNotBeNull();
        plans!.ShouldNotBeEmpty();
        plans.All(p => !p.IsOfficial).ShouldBeTrue();
    }

    [Fact]
    public async Task CareersList_exposes_isOfficial_flag_for_crowdsourced_careers()
    {
        const string CareerName = "Carrera Solo Crowdsourced";
        var slug = CareerName.Trim().ToLowerInvariant().Replace(' ', '-');

        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
            var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();
            var career = Career.Create(
                new UniversityId(UnstaUniversityId),
                CareerName,
                slug,
                clock,
                isOfficial: false).Value;
            db.Careers.Add(career);
            await db.SaveChangesAsync();
        }

        using var client = _fixture.Factory.CreateClient();
        var response = await client.GetAsync($"/api/academic/careers?universityId={UnstaUniversityId}");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var careers = await response.Content.ReadFromJsonAsync<List<CareerListItem>>();
        careers.ShouldNotBeNull();
        var crowd = careers!.SingleOrDefault(c => c.Slug == slug);
        crowd.ShouldNotBeNull();
        crowd!.IsOfficial.ShouldBeFalse();
    }
}
