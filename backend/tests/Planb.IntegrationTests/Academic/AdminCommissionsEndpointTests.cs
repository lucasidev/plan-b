using System.Net;
using System.Net.Http.Json;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Identity;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Tests de integración del admin CRUD de comisiones (US-093). Cubren el wiring HTTP + persistencia +
/// gating por rol Admin, y las dos cosas que solo se validan contra Postgres + Wolverine reales: que
/// el horario (`TimeOnly` vía Dapper) round-trippee bien y salga en orden cronológico, y que un PUT
/// que falla a mitad NO deje la comisión mutada (el middleware de transacción commitea aunque el
/// handler devuelva un Result de falla; la atomicidad la garantiza `Commission.Reconfigure`).
///
/// Subject 111 (Desarrollo de Software) + term 2026·1c son de UNSTA y ya tienen comisiones sembradas;
/// estos tests crean las suyas con nombres únicos y filtran por id, sin depender del seed.
/// </summary>
public class AdminCommissionsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid Unsta = Guid.Parse("00000001-0000-4000-a000-000000000001");
    private static readonly Guid Subject111Id = Guid.Parse("00000004-0000-4000-a000-000000000005");
    private static readonly Guid Term2026C1Id = Guid.Parse("00000005-0000-4000-a000-000000000005");

    private readonly RegisterApiFixture _fixture;

    public AdminCommissionsEndpointTests(RegisterApiFixture fixture)
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
                firstName = "Ada",
                lastName = "Lovelace",
                title = (string?)null,
                bio = (string?)null,
                photoUrl = (string?)null,
            });
        res.EnsureSuccessStatusCode();
        var dto = await res.Content.ReadFromJsonAsync<CreatedDto>();
        return dto!.Id;
    }

    private static string UniqueName() => $"IT-{Guid.NewGuid():N}"[..12];

    private static string AdminListUrl() =>
        $"/api/academic/subjects/{Subject111Id}/commissions/admin?termId={Term2026C1Id}";

    private static string CreateUrl() =>
        $"/api/academic/subjects/{Subject111Id}/commissions";

    [Fact]
    public async Task Admin_creates_commission_with_schedule_and_reads_it_back_chronologically()
    {
        var admin = await AdminAsync();
        var teacherId = await CreateTeacherAsync(admin);
        var name = UniqueName();

        var create = await admin.Client.PostAsJsonAsync(CreateUrl(), new
        {
            termId = Term2026C1Id,
            name,
            modality = "Presencial",
            capacity = 40,
            notes = (string?)null,
            teachers = new[] { new { teacherId, role = "Lead" } },
            // A propósito fuera de orden: el read debe devolverlos cronológicos (lunes antes que martes).
            schedule = new[]
            {
                new { day = "Tuesday", start = "18:00", end = "22:00" },
                new { day = "Monday", start = "14:00", end = "16:00" },
            },
        });
        create.StatusCode.ShouldBe(HttpStatusCode.Created);
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var list = await admin.Client.GetFromJsonAsync<AdminListDto>(AdminListUrl());
        var row = list!.Items.Single(c => c.Id == created!.Id);
        row.Name.ShouldBe(name);
        row.IsActive.ShouldBeTrue();
        row.Teachers.Count.ShouldBe(1);
        row.Teachers[0].Role.ShouldBe("Lead");

        // TimeOnly round-trippea a "HH:mm" (mapeo Dapper real) y el orden es cronológico.
        row.Schedule.Count.ShouldBe(2);
        row.Schedule[0].Day.ShouldBe("Monday");
        row.Schedule[0].Start.ShouldBe("14:00");
        row.Schedule[0].End.ShouldBe("16:00");
        row.Schedule[1].Day.ShouldBe("Tuesday");
        row.Schedule[1].Start.ShouldBe("18:00");
    }

    [Fact]
    public async Task Update_with_overlapping_schedule_leaves_commission_unchanged()
    {
        var admin = await AdminAsync();
        var teacherId = await CreateTeacherAsync(admin);
        var name = UniqueName();

        var create = await admin.Client.PostAsJsonAsync(CreateUrl(), new
        {
            termId = Term2026C1Id,
            name,
            modality = "Presencial",
            capacity = 30,
            notes = (string?)null,
            teachers = new[] { new { teacherId, role = "Lead" } },
            schedule = new[] { new { day = "Monday", start = "08:00", end = "10:00" } },
        });
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        // PUT con dos franjas solapadas el mismo día: el aggregate rechaza (409). El rename y el
        // cambio de modalidad/horario NO deben quedar persistidos (el fix del review: Reconfigure
        // valida todo antes de mutar, así que un fallo tardío deja el aggregate intacto).
        var update = await admin.Client.PutAsJsonAsync(
            $"/api/academic/commissions/{created!.Id}",
            new
            {
                name = name + "-EDIT",
                modality = "Virtual",
                capacity = 99,
                notes = (string?)null,
                teachers = new[] { new { teacherId, role = "Lead" } },
                schedule = new[]
                {
                    new { day = "Tuesday", start = "18:00", end = "22:00" },
                    new { day = "Tuesday", start = "19:00", end = "21:00" },
                },
            });
        update.StatusCode.ShouldBe(HttpStatusCode.Conflict);

        var list = await admin.Client.GetFromJsonAsync<AdminListDto>(AdminListUrl());
        var row = list!.Items.Single(c => c.Id == created.Id);
        row.Name.ShouldBe(name);                 // no quedó el "-EDIT"
        row.Modality.ShouldBe("Presencial");     // no quedó "Virtual"
        row.Schedule.Count.ShouldBe(1);          // el horario original sigue
        row.Schedule[0].Day.ShouldBe("Monday");
    }

    [Fact]
    public async Task Deactivated_commission_disappears_from_public_read_but_stays_in_admin_list()
    {
        var admin = await AdminAsync();
        var teacherId = await CreateTeacherAsync(admin);
        var name = UniqueName();

        var create = await admin.Client.PostAsJsonAsync(CreateUrl(), new
        {
            termId = Term2026C1Id,
            name,
            modality = "Presencial",
            capacity = 40,
            notes = (string?)null,
            teachers = new[] { new { teacherId, role = "Lead" } },
            schedule = new[] { new { day = "Monday", start = "14:00", end = "16:00" } },
        });
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var deactivate = await admin.Client.PostAsync(
            $"/api/academic/commissions/{created!.Id}/deactivate", content: null);
        deactivate.StatusCode.ShouldBe(HttpStatusCode.OK);

        // El catálogo público solo muestra activas.
        var publicList = await admin.Client.GetFromJsonAsync<List<PublicCommissionDto>>(
            $"/api/academic/subjects/{Subject111Id}/commissions?termId={Term2026C1Id}");
        publicList!.Any(c => c.Id == created.Id).ShouldBeFalse();

        // El listado admin la conserva, inactiva (soft delete).
        var adminList = await admin.Client.GetFromJsonAsync<AdminListDto>(AdminListUrl());
        adminList!.Items.Single(c => c.Id == created.Id).IsActive.ShouldBeFalse();
    }

    [Fact]
    public async Task Member_cannot_create_commission_403()
    {
        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"member.{Guid.NewGuid():N}@planb.local");

        var create = await member.Client.PostAsJsonAsync(CreateUrl(), new
        {
            termId = Term2026C1Id,
            name = UniqueName(),
            modality = "Presencial",
            capacity = (int?)null,
            notes = (string?)null,
            teachers = Array.Empty<object>(),
            schedule = Array.Empty<object>(),
        });

        create.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Anonymous_cannot_create_commission_401()
    {
        using var anon = _fixture.Factory.CreateClient();

        var create = await anon.PostAsJsonAsync(CreateUrl(), new
        {
            termId = Term2026C1Id,
            name = UniqueName(),
            modality = "Presencial",
            capacity = (int?)null,
            notes = (string?)null,
            teachers = Array.Empty<object>(),
            schedule = Array.Empty<object>(),
        });

        create.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    private sealed record CreatedDto(Guid Id);

    private sealed record AdminListDto(IReadOnlyList<AdminCommissionDto> Items);

    private sealed record AdminCommissionDto(
        Guid Id, string Name, string Modality, int? Capacity, string? Notes, bool IsActive,
        IReadOnlyList<AdminTeacherDto> Teachers, IReadOnlyList<ScheduleDto> Schedule);

    private sealed record AdminTeacherDto(Guid TeacherId, string FirstName, string LastName, string Role);

    private sealed record ScheduleDto(string Day, string Start, string End);

    // Solo el id: alcanza para verificar presencia/ausencia en el catálogo público.
    private sealed record PublicCommissionDto(Guid Id);
}
