using System.Net;
using System.Net.Http.Json;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Identity;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Tests de integración del listado global de comisiones de un término, cross-materia (US-093 cont.),
/// para la pantalla "Comisiones · cuatri" del backoffice. A diferencia de
/// <see cref="AdminCommissionsEndpointTests"/> (una materia+término), este trae TODAS las materias de
/// ese término en un mismo listado, ordenado por nombre de materia.
///
/// Subject 111 (Desarrollo de Software) y subject 121 (Base de datos) son ambas de UNSTA/TUDCS y
/// cuatrimestrales (mismo term_kind que el término 2026-C1). "Base de datos" (B) ordena antes que
/// "Desarrollo de Software" (D) en cualquier collation, así que el assert de orden no depende de cómo
/// Postgres colacione acentos.
/// </summary>
public class TermCommissionsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid Unsta = Guid.Parse("00000001-0000-4000-a000-000000000001");
    private static readonly Guid Subject111Id = Guid.Parse("00000004-0000-4000-a000-000000000005");
    private static readonly Guid SubjectBaseDeDatosId = Guid.Parse("00000004-0000-4000-a000-000000000007");
    private static readonly Guid Term2026C1Id = Guid.Parse("00000005-0000-4000-a000-000000000005");

    private readonly RegisterApiFixture _fixture;

    public TermCommissionsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"admin.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    private static async Task<Guid> CreateTeacherAsync(AuthenticatedClient admin)
    {
        var res = await admin.Client.PostAsJsonAsync(
            "/api/academic/teachers",
            new
            {
                universityId = Unsta,
                firstName = "Grace",
                lastName = "Hopper",
                title = (string?)null,
                bio = (string?)null,
                photoUrl = (string?)null,
            });
        res.EnsureSuccessStatusCode();
        var dto = await res.Content.ReadFromJsonAsync<CreatedDto>();
        return dto!.Id;
    }

    private static string UniqueName() => $"IT-{Guid.NewGuid():N}"[..12];

    private static string CreateUrl(Guid subjectId) => $"/api/academic/subjects/{subjectId}/commissions";

    private static string TermListUrl(Guid termId) => $"/api/academic/terms/{termId}/commissions";

    [Fact]
    public async Task Lists_commissions_from_two_subjects_ordered_by_subject_name()
    {
        var admin = await AdminAsync();
        var teacherId = await CreateTeacherAsync(admin);

        var name111 = UniqueName();
        var create111 = await admin.Client.PostAsJsonAsync(CreateUrl(Subject111Id), new
        {
            termId = Term2026C1Id,
            name = name111,
            modality = "Presencial",
            capacity = 40,
            notes = (string?)null,
            teachers = new[] { new { teacherId, role = "Lead" } },
            schedule = new[] { new { day = "Monday", start = "14:00", end = "16:00" } },
        });
        create111.StatusCode.ShouldBe(HttpStatusCode.Created);
        var created111 = await create111.Content.ReadFromJsonAsync<CreatedDto>();

        var nameBase = UniqueName();
        var createBase = await admin.Client.PostAsJsonAsync(CreateUrl(SubjectBaseDeDatosId), new
        {
            termId = Term2026C1Id,
            name = nameBase,
            modality = "Virtual",
            capacity = 25,
            notes = (string?)null,
            teachers = new[] { new { teacherId, role = "Lead" } },
            schedule = new[] { new { day = "Tuesday", start = "18:00", end = "20:00" } },
        });
        createBase.StatusCode.ShouldBe(HttpStatusCode.Created);
        var createdBase = await createBase.Content.ReadFromJsonAsync<CreatedDto>();

        var list = await admin.Client.GetFromJsonAsync<TermListDto>(TermListUrl(Term2026C1Id));
        var items = list!.Items.ToList();

        var row111 = items.Single(c => c.CommissionId == created111!.Id);
        row111.SubjectId.ShouldBe(Subject111Id);
        row111.SubjectName.ShouldBe("Desarrollo de Software");
        row111.Teachers.Count.ShouldBe(1);
        row111.Schedule.Count.ShouldBe(1);
        row111.Schedule[0].Day.ShouldBe("Monday");

        var rowBase = items.Single(c => c.CommissionId == createdBase!.Id);
        rowBase.SubjectId.ShouldBe(SubjectBaseDeDatosId);
        rowBase.SubjectName.ShouldBe("Base de datos");
        rowBase.Teachers.Count.ShouldBe(1);
        rowBase.Schedule.Count.ShouldBe(1);
        rowBase.Schedule[0].Day.ShouldBe("Tuesday");

        // Orden por nombre de materia: "Base de datos" (B) antes que "Desarrollo de Software" (D),
        // sin importar cuántas otras comisiones del seed haya intercaladas en ese término.
        var indexBase = items.FindIndex(c => c.CommissionId == createdBase!.Id);
        var index111 = items.FindIndex(c => c.CommissionId == created111!.Id);
        indexBase.ShouldBeLessThan(index111);
    }

    [Fact]
    public async Task Member_cannot_list_term_commissions_403()
    {
        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"member.{Guid.NewGuid():N}@planb.local");

        var response = await member.Client.GetAsync(TermListUrl(Term2026C1Id));

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Anonymous_cannot_list_term_commissions_401()
    {
        using var anon = _fixture.Factory.CreateClient();

        var response = await anon.GetAsync(TermListUrl(Term2026C1Id));

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    private sealed record CreatedDto(Guid Id);

    private sealed record TermListDto(IReadOnlyList<TermCommissionDto> Items);

    private sealed record TermCommissionDto(
        Guid CommissionId,
        Guid SubjectId,
        string SubjectCode,
        string SubjectName,
        string Name,
        string Modality,
        int? Capacity,
        bool IsActive,
        IReadOnlyList<TeacherDto> Teachers,
        IReadOnlyList<ScheduleDto> Schedule);

    private sealed record TeacherDto(Guid TeacherId, string FirstName, string LastName, string Role);

    private sealed record ScheduleDto(string Day, string Start, string End);
}
