using System.Net;
using System.Net.Http.Json;
using Planb.Enrollments.Application.Features.RegisterEnrollment;
using Planb.Enrollments.Application.Features.UpdateEnrollment;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Enrollments;

/// <summary>
/// Tests integration de US-015 (editar entrada del historial). El caso que motiva la US es el
/// cierre de cuatrimestre: la cursada que arrancó como <c>Cursando</c> pasa a su estado final.
///
/// Confirma que el endpoint:
///   - Cierra una cursada en curso y persiste el cambio.
///   - Es idempotente: el mismo payload dos veces no vuelve a sellar UpdatedAt.
///   - Revalida las invariantes sobre el estado resultante, no sobre los campos sueltos.
///   - Devuelve 404 tanto para un record inexistente como para uno de otro alumno.
/// </summary>
public class UpdateEnrollmentEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    private static readonly Guid TudcsPlanId =
        Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject111 =
        Guid.Parse("00000004-0000-4000-a000-000000000005");
    private static readonly Guid Term2026_1c =
        Guid.Parse("00000005-0000-4000-a000-000000000005");
    private static readonly Guid Commission111A =
        Guid.Parse("00000007-0000-4000-a000-000000000001");

    public UpdateEnrollmentEndpointTests(RegisterApiFixture fixture) => _fixture = fixture;

    private async Task<AuthenticatedClient> SetupUserWithProfileAsync(string label)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"enrollments-update-{label}.{Guid.NewGuid():N}@planb.local");

        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();

        return auth;
    }

    /// <summary>Deja una cursada en curso, que es el estado del que sale todo cierre.</summary>
    private static async Task<Guid> RegisterInProgressAsync(AuthenticatedClient auth)
    {
        var response = await auth.Client.PostAsJsonAsync(
            "/api/me/enrollment-records",
            new
            {
                subjectId = Subject111,
                commissionId = (Guid?)Commission111A,
                termId = (Guid?)Term2026_1c,
                status = "InProgress",
                approvalMethod = (string?)null,
                grade = (decimal?)null,
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<RegisterEnrollmentResponse>();
        return body!.Id;
    }

    private static object ClosePayload(string status, string? method, decimal? grade) => new
    {
        commissionId = (Guid?)Commission111A,
        termId = (Guid?)Term2026_1c,
        status,
        approvalMethod = method,
        grade,
    };

    [Fact]
    public async Task Returns_200_and_closes_the_in_progress_cursada()
    {
        var auth = await SetupUserWithProfileAsync("close");
        var id = await RegisterInProgressAsync(auth);

        var response = await auth.Client.PatchAsJsonAsync(
            $"/api/me/enrollment-records/{id}",
            ClosePayload("Passed", "Promotion", 9m));

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<UpdateEnrollmentResponse>();
        body.ShouldNotBeNull();
        body!.Status.ShouldBe("Passed");
        body.ApprovalMethod.ShouldBe("Promotion");
        body.Grade.ShouldBe(9m);
        body.Changed.ShouldBeTrue();
    }

    [Fact]
    public async Task Second_identical_patch_is_a_no_op()
    {
        var auth = await SetupUserWithProfileAsync("idempotent");
        var id = await RegisterInProgressAsync(auth);
        var payload = ClosePayload("Passed", "Promotion", 9m);

        var first = await auth.Client.PatchAsJsonAsync($"/api/me/enrollment-records/{id}", payload);
        first.StatusCode.ShouldBe(HttpStatusCode.OK);
        var firstBody = await first.Content.ReadFromJsonAsync<UpdateEnrollmentResponse>();

        var second = await auth.Client.PatchAsJsonAsync($"/api/me/enrollment-records/{id}", payload);
        second.StatusCode.ShouldBe(HttpStatusCode.OK);
        var secondBody = await second.Content.ReadFromJsonAsync<UpdateEnrollmentResponse>();

        secondBody!.Changed.ShouldBeFalse();

        // Tolerancia de un microsegundo, no capricho: el UpdatedAt de la primera respuesta sale del
        // aggregate en memoria (ticks de 100 ns) y el de la segunda sale leído de Postgres, que
        // guarda timestamptz con precisión de microsegundo. Son el mismo instante con distinta
        // resolución, y compararlos exacto falla mostrando dos valores que se imprimen idénticos.
        secondBody.UpdatedAt.ShouldBe(firstBody!.UpdatedAt, TimeSpan.FromMicroseconds(1));
    }

    [Fact]
    public async Task Returns_400_when_the_resulting_state_breaks_an_invariant()
    {
        // Aprobada sin nota: cada campo es plausible por separado y la combinación no existe. Es el
        // caso que obliga a validar el estado resultante entero y no los campos que llegaron.
        var auth = await SetupUserWithProfileAsync("invariant");
        var id = await RegisterInProgressAsync(auth);

        var response = await auth.Client.PatchAsJsonAsync(
            $"/api/me/enrollment-records/{id}",
            ClosePayload("Passed", "Coursework", grade: null));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Returns_400_when_credit_transfer_keeps_the_commission()
    {
        // La cursada tenía comisión y período válidos. Pasar a equivalencia conservándolos es
        // válido campo por campo e inválido como estado resultante.
        var auth = await SetupUserWithProfileAsync("equiv");
        var id = await RegisterInProgressAsync(auth);

        var response = await auth.Client.PatchAsJsonAsync(
            $"/api/me/enrollment-records/{id}",
            ClosePayload("Passed", "CreditTransfer", 8m));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Returns_400_for_an_unknown_status_string()
    {
        var auth = await SetupUserWithProfileAsync("badstatus");
        var id = await RegisterInProgressAsync(auth);

        var response = await auth.Client.PatchAsJsonAsync(
            $"/api/me/enrollment-records/{id}",
            ClosePayload("9", null, null));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Returns_404_for_an_unknown_record()
    {
        var auth = await SetupUserWithProfileAsync("missing");

        var response = await auth.Client.PatchAsJsonAsync(
            $"/api/me/enrollment-records/{Guid.NewGuid()}",
            ClosePayload("Passed", "Promotion", 9m));

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Returns_404_when_the_record_belongs_to_another_student()
    {
        // Mismo 404 que un record inexistente, a propósito: responder distinto convertiría al
        // endpoint en un oráculo de ids ajenos.
        var owner = await SetupUserWithProfileAsync("owner");
        var id = await RegisterInProgressAsync(owner);

        var intruder = await SetupUserWithProfileAsync("intruder");

        var response = await intruder.Client.PatchAsJsonAsync(
            $"/api/me/enrollment-records/{id}",
            ClosePayload("Passed", "Promotion", 9m));

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Returns_401_without_a_token()
    {
        var client = _fixture.Factory.CreateClient();

        var response = await client.PatchAsJsonAsync(
            $"/api/me/enrollment-records/{Guid.NewGuid()}",
            ClosePayload("Passed", "Promotion", 9m));

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }
}
