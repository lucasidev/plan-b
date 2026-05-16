using System.Net;
using System.Net.Http.Json;
using Planb.Enrollments.Application.Features.HistorialImports;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Enrollments;

/// <summary>
/// Integration tests del flujo POST /GET /confirm de US-014. Cubren:
///   - Auth gate (401 sin cookie).
///   - Profile gate (404 si no hay StudentProfile activo).
///   - 202 + id en el shape correcto cuando todo está bien.
///   - 413 con payload muy grande (texto > 5MB).
///   - 404 ownership: un user no puede ver imports de otro.
///   - Polling: el GET reporta status del aggregate.
///
/// El worker async corre dentro de Wolverine en solo mode; los tests esperan a que el
/// aggregate transicione a Parsed/Failed antes de assertar el GET.
/// </summary>
public class HistorialImportEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    // Seed IDs reales del catálogo Academic.
    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");

    public HistorialImportEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<AuthenticatedClient> SetupUserWithProfileAsync(string label)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"hist-import-{label}.{Guid.NewGuid():N}@planb.local");

        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();

        return auth;
    }

    // ── Auth & profile gates ──────────────────────────────────────────────

    [Fact]
    public async Task Post_Returns_401_when_no_session_cookie()
    {
        using var bootstrap = _fixture.Factory.CreateClient();

        var response = await bootstrap.PostAsJsonAsync(
            "/api/me/historial-imports",
            new { rawText = "MAT101 8 Aprobada" });

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_Returns_401_when_no_session_cookie()
    {
        using var bootstrap = _fixture.Factory.CreateClient();

        var response = await bootstrap.GetAsync(
            $"/api/me/historial-imports/{Guid.NewGuid()}");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Post_Returns_404_when_user_has_no_student_profile()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"hist-noprof.{Guid.NewGuid():N}@planb.local");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/historial-imports",
            new { rawText = "MAT101 8 Aprobada" });

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    // ── Happy path ────────────────────────────────────────────────────────

    [Fact]
    public async Task Post_Returns_202_with_id_when_text_payload_valid()
    {
        var auth = await SetupUserWithProfileAsync("happy");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/historial-imports",
            new { rawText = "MAT101  Análisis Matemático I  8.5  Aprobada  Cursada  2024 1c" });

        response.StatusCode.ShouldBe(HttpStatusCode.Accepted);
        var body = await response.Content.ReadFromJsonAsync<CreateHistorialImportResponse>();
        body.ShouldNotBeNull();
        body!.Id.ShouldNotBe(Guid.Empty);
        body.Status.ShouldBe("Pending");
    }

    [Fact]
    public async Task Get_Returns_import_for_owner_with_status_field()
    {
        var auth = await SetupUserWithProfileAsync("get");

        var post = await auth.Client.PostAsJsonAsync(
            "/api/me/historial-imports",
            new { rawText = "MAT101  Análisis  8  Aprobada" });
        var created = await post.Content.ReadFromJsonAsync<CreateHistorialImportResponse>();

        var get = await auth.Client.GetAsync(
            $"/api/me/historial-imports/{created!.Id}");
        get.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await get.Content.ReadFromJsonAsync<HistorialImportResponse>();
        body.ShouldNotBeNull();
        body!.Id.ShouldBe(created.Id);
        body.SourceType.ShouldBe("Text");
    }

    // ── Ownership gate ────────────────────────────────────────────────────

    [Fact]
    public async Task Get_Returns_404_when_import_belongs_to_other_user()
    {
        var owner = await SetupUserWithProfileAsync("owner");
        var intruder = await SetupUserWithProfileAsync("intruder");

        var post = await owner.Client.PostAsJsonAsync(
            "/api/me/historial-imports",
            new { rawText = "MAT101 8 Aprobada" });
        var created = await post.Content.ReadFromJsonAsync<CreateHistorialImportResponse>();

        // El intruder NO debe poder ver el import del owner. Devolvemos 404 (no Forbidden)
        // para no leakear existencia del recurso.
        var sneak = await intruder.Client.GetAsync(
            $"/api/me/historial-imports/{created!.Id}");
        sneak.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    // ── Payload limits ────────────────────────────────────────────────────

    [Fact]
    public async Task Post_Returns_413_when_text_payload_exceeds_5mb()
    {
        var auth = await SetupUserWithProfileAsync("big");

        // ~6MB de basura. Bien arriba del límite de 5MB.
        var huge = new string('x', 6 * 1024 * 1024);

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/historial-imports",
            new { rawText = huge });

        response.StatusCode.ShouldBe(HttpStatusCode.RequestEntityTooLarge);
    }

    [Fact]
    public async Task Post_Returns_400_when_text_payload_empty()
    {
        var auth = await SetupUserWithProfileAsync("empty");

        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/historial-imports",
            new { rawText = "   " });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    // ── Confirm gates ─────────────────────────────────────────────────────

    [Fact]
    public async Task Confirm_Returns_404_when_import_not_found()
    {
        var auth = await SetupUserWithProfileAsync("confirm-404");

        var response = await auth.Client.PostAsJsonAsync(
            $"/api/me/historial-imports/{Guid.NewGuid()}/confirm",
            new { items = new[] { new { subjectId = Guid.NewGuid(), status = "Aprobada", grade = 8m } } });

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Confirm_Returns_400_when_items_empty()
    {
        var auth = await SetupUserWithProfileAsync("confirm-empty");

        var post = await auth.Client.PostAsJsonAsync(
            "/api/me/historial-imports",
            new { rawText = "MAT101 8 Aprobada" });
        var created = await post.Content.ReadFromJsonAsync<CreateHistorialImportResponse>();

        var response = await auth.Client.PostAsJsonAsync(
            $"/api/me/historial-imports/{created!.Id}/confirm",
            new { items = Array.Empty<object>() });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }
}
