using System.Net;
using System.Net.Http.Json;
using Planb.Enrollments.Application.Features.SubjectPassRate;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Enrollments;

/// <summary>
/// Tests de GET /api/enrollments/subjects/{id}/pass-rate (ADR-0047): aprobación histórica.
/// Público. Definición: aprobadas (Aprobada no-Equivalencia) / (aprobadas + reprobadas), con gate
/// de muestra mínima (N &lt; 5 -&gt; null).
///
/// El fixture comparte una DB por clase, así que cada test usa una materia distinta para que su
/// agregación no se mezcle. Un mismo alumno carga varias cursadas de la materia en terms distintos
/// (el UNIQUE es por profile+subject+term), lo que alcanza para poblar la muestra.
/// </summary>
public class SubjectPassRateEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject101 = Guid.Parse("00000004-0000-4000-a000-000000000001");
    private static readonly Guid Subject111 = Guid.Parse("00000004-0000-4000-a000-000000000005");
    private static readonly Guid Subject121 = Guid.Parse("00000004-0000-4000-a000-000000000007");
    private static readonly Guid Subject213 = Guid.Parse("00000004-0000-4000-a000-000000000014");

    private static readonly Guid[] Terms =
    [
        Guid.Parse("00000005-0000-4000-a000-000000000001"),
        Guid.Parse("00000005-0000-4000-a000-000000000002"),
        Guid.Parse("00000005-0000-4000-a000-000000000003"),
        Guid.Parse("00000005-0000-4000-a000-000000000004"),
        Guid.Parse("00000005-0000-4000-a000-000000000005"),
        Guid.Parse("00000005-0000-4000-a000-000000000006"),
    ];

    private readonly RegisterApiFixture _fixture;

    public SubjectPassRateEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Computes_pass_rate_when_sample_meets_the_gate()
    {
        var auth = await SetupUserAsync("met");

        // 3 aprobadas + 2 reprobadas -> 3/5 = 60%.
        await PassFinalLibre(auth, Subject111, Terms[0]);
        await PassFinalLibre(auth, Subject111, Terms[1]);
        await PassFinalLibre(auth, Subject111, Terms[2]);
        await Fail(auth, Subject111, Terms[3]);
        await Fail(auth, Subject111, Terms[4]);

        var body = await GetPassRate(auth.Client, Subject111);
        body.SampleSize.ShouldBe(5);
        body.PassRate.ShouldNotBeNull();
        body.PassRate!.Value.ShouldBe(60.0, 0.01);
    }

    [Fact]
    public async Task Gates_the_number_below_the_minimum_sample()
    {
        var auth = await SetupUserAsync("gated");

        // Solo 3 con verdicto: bajo el gate de 5 -> PassRate null.
        await PassFinalLibre(auth, Subject213, Terms[0]);
        await PassFinalLibre(auth, Subject213, Terms[1]);
        await Fail(auth, Subject213, Terms[2]);

        var body = await GetPassRate(auth.Client, Subject213);
        body.SampleSize.ShouldBe(3);
        body.PassRate.ShouldBeNull();
    }

    [Fact]
    public async Task Excludes_equivalencia_from_numerator_and_abandonada_from_denominator()
    {
        var auth = await SetupUserAsync("excl");

        // 4 aprobadas (FinalLibre) + 1 reprobada -> 4/5 = 80%. La equivalencia y la abandonada
        // quedan afuera del cálculo (no rindió acá / sin verdicto de examen).
        await PassFinalLibre(auth, Subject121, Terms[0]);
        await PassFinalLibre(auth, Subject121, Terms[1]);
        await PassFinalLibre(auth, Subject121, Terms[2]);
        await PassFinalLibre(auth, Subject121, Terms[3]);
        await Fail(auth, Subject121, Terms[4]);
        await Abandon(auth, Subject121, Terms[5]);
        await PassEquivalencia(auth, Subject121);

        var body = await GetPassRate(auth.Client, Subject121);
        body.SampleSize.ShouldBe(5);
        body.PassRate.ShouldNotBeNull();
        body.PassRate!.Value.ShouldBe(80.0, 0.01);
    }

    [Fact]
    public async Task Is_public_no_auth_required()
    {
        using var client = _fixture.Factory.CreateClient();

        var response = await client.GetAsync($"/api/enrollments/subjects/{Subject101}/pass-rate");

        response.StatusCode.ShouldNotBe(HttpStatusCode.Unauthorized);
    }

    private async Task<AuthenticatedClient> SetupUserAsync(string label)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"passrate-{label}.{Guid.NewGuid():N}@planb.local");
        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();
        return auth;
    }

    private static Task PassFinalLibre(AuthenticatedClient auth, Guid subject, Guid term) =>
        Post(auth, subject, term, "Passed", "IndependentFinalExam", 8m);

    private static Task PassEquivalencia(AuthenticatedClient auth, Guid subject) =>
        Post(auth, subject, null, "Passed", "CreditTransfer", 8m);

    private static Task Fail(AuthenticatedClient auth, Guid subject, Guid term) =>
        Post(auth, subject, term, "Failed", null, null);

    private static Task Abandon(AuthenticatedClient auth, Guid subject, Guid term) =>
        Post(auth, subject, term, "Dropped", null, null);

    private static async Task Post(
        AuthenticatedClient auth, Guid subject, Guid? term, string status, string? method, decimal? grade)
    {
        var resp = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = subject,
                commissionId = (Guid?)null,
                termId = term,
                status,
                approvalMethod = method,
                grade,
            });
        resp.EnsureSuccessStatusCode();
    }

    private static async Task<SubjectPassRate> GetPassRate(HttpClient client, Guid subject)
    {
        var response = await client.GetAsync($"/api/enrollments/subjects/{subject}/pass-rate");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<SubjectPassRate>();
        body.ShouldNotBeNull();
        return body!;
    }
}
