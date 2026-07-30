using System.Net;
using System.Net.Http.Json;
using Planb.Enrollments.Application.Features.GetMyTranscript;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Enrollments;

/// <summary>
/// Tests integration de GET /api/me/enrollment-records (US-045-e): la pantalla de historial
/// dejaba de estar siempre vacía. Cubre:
///   - 401 sin sesión.
///   - 200 con lista vacía cuando el alumno no tiene profile activo.
///   - El caso rico: dos períodos distintos más una equivalencia sin período, verificando el
///     agrupado, el orden (más reciente primero, la equivalencia al final), el promedio por
///     período (una cursada sin nota no lo diluye a la baja) y que el docente viaja null cuando
///     no hay comisión, resuelto cuando sí la hay.
/// </summary>
public class GetMyTranscriptEndpointTests
    : IClassFixture<RegisterApiFixture>, IAsyncLifetime
{
    private readonly RegisterApiFixture _fixture;

    // Seed IDs alineados con los demás integration tests (Academic seed determinístico).
    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");

    // 111 Desarrollo de Software: la única terna del seed con comisión real + titular
    // (Brandt), necesaria para ejercitar la resolución de docente vía commission_teachers.
    private static readonly Guid Subject111 =
        Guid.Parse("00000004-0000-4000-a000-000000000005");
    private static readonly Guid Term2026_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000005");
    private static readonly Guid Commission111A =
        Guid.Parse("00000007-0000-4000-a000-000000000001");

    // Sin comisión sembrada en este período: el docente tiene que viajar null.
    private static readonly Guid Subject101 =
        Guid.Parse("00000004-0000-4000-a000-000000000001");
    private static readonly Guid Subject102 =
        Guid.Parse("00000004-0000-4000-a000-000000000002");
    private static readonly Guid Term2024_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000001");

    // Equivalencia: term_id null por invariante del data-model, va a su propio grupo.
    private static readonly Guid Subject121 =
        Guid.Parse("00000004-0000-4000-a000-000000000007");

    public GetMyTranscriptEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<AuthenticatedClient> SetupUserWithProfileAsync(string label)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"transcript-{label}.{Guid.NewGuid():N}@planb.local");

        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();

        return auth;
    }

    private static async Task RegisterAsync(
        AuthenticatedClient auth,
        Guid subjectId,
        Guid? commissionId,
        Guid? termId,
        string status,
        string? approvalMethod,
        decimal? grade)
    {
        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId,
                commissionId,
                termId,
                status,
                approvalMethod,
                grade,
            });
        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task Returns_401_when_no_session_cookie()
    {
        using var client = _fixture.Factory.CreateClient();

        var response = await client.GetAsync("/api/me/enrollment-records");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Returns_200_with_empty_list_when_no_active_profile()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"transcript-noprofile.{Guid.NewGuid():N}@planb.local");

        var response = await auth.Client.GetAsync("/api/me/enrollment-records");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<GetMyTranscriptResponse>();
        body.ShouldNotBeNull();
        body!.Periods.ShouldBeEmpty();
    }

    [Fact]
    public async Task Groups_by_period_orders_them_and_resolves_the_teacher_from_the_commission()
    {
        var auth = await SetupUserWithProfileAsync("rich");

        // Período reciente, con comisión real: el docente tiene que resolverse ("brandt").
        await RegisterAsync(
            auth, Subject111, Commission111A, Term2026_1c, "Passed", "Coursework", 9m);

        // Mismo período viejo, dos materias: una con nota (Regularized) y otra sin nota
        // (Failed), ninguna con comisión. El promedio del grupo tiene que salir de la única
        // nota real (6), sin diluirse por la que no tiene.
        await RegisterAsync(auth, Subject101, null, Term2024_1c, "Regularized", null, 6m);
        await RegisterAsync(auth, Subject102, null, Term2024_1c, "Failed", null, null);

        // Equivalencia: sin término, sin comisión.
        await RegisterAsync(auth, Subject121, null, null, "Passed", "CreditTransfer", 7m);

        var response = await auth.Client.GetAsync("/api/me/enrollment-records");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<GetMyTranscriptResponse>();
        body.ShouldNotBeNull();
        var periods = body!.Periods;

        periods.Count.ShouldBe(3);

        // Orden: 2026-C1 (más reciente), 2024-C1, y la equivalencia (sin período) al final.
        var recent = periods[0];
        recent.Label.ShouldBe("2026-C1");
        recent.Year.ShouldBe(2026);
        recent.Number.ShouldBe(1);
        recent.Average.ShouldBe(9m);
        recent.Items.ShouldHaveSingleItem();
        recent.Items[0].Status.ShouldBe("Passed");
        recent.Items[0].ApprovalMethod.ShouldBe("Coursework");
        recent.Items[0].Grade.ShouldBe(9m);
        recent.Items[0].TeacherLastName.ShouldBe("brandt");

        var old = periods[1];
        old.Label.ShouldBe("2024-C1");
        old.Year.ShouldBe(2024);
        old.Number.ShouldBe(1);
        old.Average.ShouldBe(6m);
        old.Items.Count.ShouldBe(2);
        old.Items.ShouldAllBe(i => i.TeacherLastName == null);
        old.Items.Single(i => i.Status == "Regularized").Grade.ShouldBe(6m);
        old.Items.Single(i => i.Status == "Failed").Grade.ShouldBeNull();

        var noPeriod = periods[2];
        noPeriod.Label.ShouldBeNull();
        noPeriod.Year.ShouldBeNull();
        noPeriod.Number.ShouldBeNull();
        noPeriod.Average.ShouldBe(7m);
        noPeriod.Items.ShouldHaveSingleItem();
        noPeriod.Items[0].Status.ShouldBe("Passed");
        noPeriod.Items[0].ApprovalMethod.ShouldBe("CreditTransfer");
        noPeriod.Items[0].TeacherLastName.ShouldBeNull();
    }
}
