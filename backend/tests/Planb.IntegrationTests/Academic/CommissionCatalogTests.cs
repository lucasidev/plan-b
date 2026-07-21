using System.Net;
using System.Net.Http.Json;
using Planb.Academic.Application.Contracts;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Integration tests para el read-side de comisiones (US-065):
///   - GET /api/academic/subjects/{subjectId}/commissions?termId={id}
///
/// El seed siembra comisiones con ids determinísticos (00000007-0000-4000-a000-0000000000NN) sobre
/// subjects TUDCS + terms UNSTA, con docentes asignados. Los tests resuelven por id sin crear data.
/// Verifican el agrupado comisión -> docentes, el orden titular-primero y el title-casing (initcap).
/// </summary>
public class CommissionCatalogTests : IClassFixture<RegisterApiFixture>
{
    private readonly HttpClient _client;

    public CommissionCatalogTests(RegisterApiFixture fixture)
    {
        _client = fixture.Factory.CreateClient();
    }

    // Desarrollo de Software (111) + 2026·1c: tiene 2 comisiones sembradas (A presencial, B virtual).
    private static readonly Guid Subject111Id =
        Guid.Parse("00000004-0000-4000-a000-000000000005");
    private static readonly Guid Term2026C1Id =
        Guid.Parse("00000005-0000-4000-a000-000000000005");

    [Fact]
    public async Task ListCommissions_returns_seeded_commissions_with_teachers()
    {
        var response = await _client.GetAsync(
            $"/api/academic/subjects/{Subject111Id}/commissions?termId={Term2026C1Id}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var commissions = await response.Content.ReadFromJsonAsync<List<CommissionListItem>>();
        commissions.ShouldNotBeNull();
        commissions!.Count.ShouldBe(2);

        // Orden por nombre: "A" antes que "B (Virtual)".
        var comA = commissions[0];
        comA.Name.ShouldBe("A");
        comA.Modality.ShouldBe("Presencial");
        comA.Capacity.ShouldBe(40);

        // Titular primero: brandt (Titular) antes que sosa (Jtp).
        comA.Teachers.Count.ShouldBe(2);
        comA.Teachers[0].FirstName.ShouldBe("Carlos");
        comA.Teachers[0].LastName.ShouldBe("Brandt");
        comA.Teachers[0].Role.ShouldBe("Titular");
        comA.Teachers[1].FirstName.ShouldBe("Diego");
        comA.Teachers[1].Role.ShouldBe("Jtp");

        var comB = commissions[1];
        comB.Name.ShouldBe("B (Virtual)");
        comB.Modality.ShouldBe("Virtual");
        comB.Teachers[0].Role.ShouldBe("Titular");
        comB.Teachers[0].LastName.ShouldBe("Reynoso");
    }

    [Fact]
    public async Task ListCommissions_title_cases_accented_teacher_names()
    {
        var response = await _client.GetAsync(
            $"/api/academic/subjects/{Subject111Id}/commissions?termId={Term2026C1Id}");

        var commissions = await response.Content.ReadFromJsonAsync<List<CommissionListItem>>();
        commissions.ShouldNotBeNull();

        // hernán quiroga (Ayudante en la comisión B virtual) valida initcap unicode-aware.
        var quiroga = commissions!
            .SelectMany(c => c.Teachers)
            .FirstOrDefault(t => t.LastName == "Quiroga");
        quiroga.ShouldNotBeNull();
        quiroga!.FirstName.ShouldBe("Hernán");
    }

    [Fact]
    public async Task ListCommissions_returns_empty_for_unknown_subject_or_term()
    {
        var response = await _client.GetAsync(
            $"/api/academic/subjects/{Guid.NewGuid()}/commissions?termId={Term2026C1Id}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var commissions = await response.Content.ReadFromJsonAsync<List<CommissionListItem>>();
        commissions.ShouldBeEmpty();
    }

    [Fact]
    public async Task ListCommissions_returns_400_when_termId_missing()
    {
        var response = await _client.GetAsync(
            $"/api/academic/subjects/{Subject111Id}/commissions");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    // Comisión "A" de 111 Desarrollo de Software: brandt (Titular) + sosa (Jtp). Caller
    // del endpoint: el picker de docente del editor de reseña (US-065 docente real por reseña).
    private static readonly Guid Subject111CommissionAId =
        Guid.Parse("00000007-0000-4000-a000-000000000001");

    [Fact]
    public async Task GetCommissionTeachers_returns_titular_first_title_cased()
    {
        var response = await _client.GetAsync(
            $"/api/academic/commissions/{Subject111CommissionAId}/teachers");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var teachers = await response.Content.ReadFromJsonAsync<List<CommissionTeacherItem>>();
        teachers.ShouldNotBeNull();
        teachers!.Count.ShouldBe(2);
        teachers[0].FirstName.ShouldBe("Carlos");
        teachers[0].LastName.ShouldBe("Brandt");
        teachers[0].Role.ShouldBe("Titular");
        teachers[1].LastName.ShouldBe("Sosa");
        teachers[1].Role.ShouldBe("Jtp");
    }

    [Fact]
    public async Task GetCommissionTeachers_returns_empty_for_unknown_commission()
    {
        var response = await _client.GetAsync(
            $"/api/academic/commissions/{Guid.NewGuid()}/teachers");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var teachers = await response.Content.ReadFromJsonAsync<List<CommissionTeacherItem>>();
        teachers.ShouldBeEmpty();
    }
}
