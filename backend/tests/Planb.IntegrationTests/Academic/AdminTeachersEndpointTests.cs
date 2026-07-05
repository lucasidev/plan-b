using System.Net;
using System.Net.Http.Json;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Identity;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Tests de integración del admin CRUD de docentes (US-063). Cubren el wiring HTTP + persistencia +
/// el gating por rol Admin (RequireRole contra el claim del JWT). El gating es la razón principal de
/// que estos vivan en integration: confirma que el string "Admin" del endpoint matchea el claim real
/// que emite el JwtIssuer.
/// </summary>
public class AdminTeachersEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid Unsta = Guid.Parse("00000001-0000-4000-a000-000000000001");

    private readonly RegisterApiFixture _fixture;

    public AdminTeachersEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"admin.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    private static object NewTeacherBody(
        string firstName = "Ada", string lastName = "Lovelace",
        string? title = "Titular", string? bio = "Docente de referencia.",
        string? photoUrl = "https://cdn.planb.local/ada.jpg") =>
        new { universityId = Unsta, firstName, lastName, title, bio, photoUrl };

    [Fact]
    public async Task Admin_creates_teacher_and_it_appears_in_the_list()
    {
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync("/api/academic/teachers", NewTeacherBody());
        create.StatusCode.ShouldBe(HttpStatusCode.Created);
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var list = await admin.Client.GetFromJsonAsync<ListDto>("/api/academic/teachers");
        var row = list!.Items.SingleOrDefault(t => t.Id == created!.Id);
        row.ShouldNotBeNull();
        row.FirstName.ShouldBe("Ada");        // storage lowercase, se devuelve title case
        row.LastName.ShouldBe("Lovelace");
        row.Title.ShouldBe("Titular");
        row.IsActive.ShouldBeTrue();
        row.UniversityId.ShouldBe(Unsta);
        row.UniversityName.ShouldNotBeNullOrWhiteSpace();

        // El profile completo (incluida la photoUrl del flujo "URL + preview") round-trippea por el
        // GET público por id.
        var detail = await admin.Client.GetFromJsonAsync<DetailDto>(
            $"/api/academic/teachers/{created!.Id}");
        detail!.PhotoUrl.ShouldBe("https://cdn.planb.local/ada.jpg");
        detail.Bio.ShouldBe("Docente de referencia.");
    }

    [Fact]
    public async Task Admin_updates_teacher_fields()
    {
        var admin = await AdminAsync();
        var create = await admin.Client.PostAsJsonAsync("/api/academic/teachers", NewTeacherBody());
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var update = await admin.Client.PatchAsJsonAsync(
            $"/api/academic/teachers/{created!.Id}",
            new
            {
                firstName = "Grace",
                lastName = "Hopper",
                title = "Adjunta",
                bio = "Actualizada.",
                photoUrl = (string?)null,
            });
        update.StatusCode.ShouldBe(HttpStatusCode.OK);

        var list = await admin.Client.GetFromJsonAsync<ListDto>("/api/academic/teachers");
        var row = list!.Items.Single(t => t.Id == created.Id);
        row.FirstName.ShouldBe("Grace");
        row.LastName.ShouldBe("Hopper");
        row.Title.ShouldBe("Adjunta");
    }

    [Fact]
    public async Task Admin_deactivates_and_reactivates_teacher()
    {
        var admin = await AdminAsync();
        var create = await admin.Client.PostAsJsonAsync("/api/academic/teachers", NewTeacherBody());
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var deactivate = await admin.Client.DeleteAsync($"/api/academic/teachers/{created!.Id}");
        deactivate.StatusCode.ShouldBe(HttpStatusCode.OK);
        var afterDeactivate = await deactivate.Content.ReadFromJsonAsync<StatusDto>();
        afterDeactivate!.IsActive.ShouldBeFalse();

        // Soft delete: sigue en el listado admin (inactivo), no desaparece.
        var list = await admin.Client.GetFromJsonAsync<ListDto>("/api/academic/teachers");
        list!.Items.Single(t => t.Id == created.Id).IsActive.ShouldBeFalse();

        var reactivate = await admin.Client.PostAsync(
            $"/api/academic/teachers/{created.Id}/reactivate", content: null);
        reactivate.StatusCode.ShouldBe(HttpStatusCode.OK);
        var afterReactivate = await reactivate.Content.ReadFromJsonAsync<StatusDto>();
        afterReactivate!.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task Deactivating_an_already_inactive_teacher_is_409()
    {
        var admin = await AdminAsync();
        var create = await admin.Client.PostAsJsonAsync("/api/academic/teachers", NewTeacherBody());
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        (await admin.Client.DeleteAsync($"/api/academic/teachers/{created!.Id}"))
            .EnsureSuccessStatusCode();

        var second = await admin.Client.DeleteAsync($"/api/academic/teachers/{created.Id}");
        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Create_with_unknown_university_returns_404()
    {
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync(
            "/api/academic/teachers",
            new
            {
                universityId = Guid.NewGuid(),
                firstName = "Ada",
                lastName = "Lovelace",
                title = (string?)null,
                bio = (string?)null,
                photoUrl = (string?)null,
            });

        create.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await create.Content.ReadAsStringAsync())
            .ShouldContain("academic.teacher.university_not_found");
    }

    [Fact]
    public async Task Update_unknown_teacher_returns_404()
    {
        var admin = await AdminAsync();

        var update = await admin.Client.PatchAsJsonAsync(
            $"/api/academic/teachers/{Guid.NewGuid()}",
            new { firstName = "Ada", lastName = "Lovelace", title = (string?)null, bio = (string?)null, photoUrl = (string?)null });

        update.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Member_cannot_create_teacher_403()
    {
        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"member.{Guid.NewGuid():N}@planb.local");

        var create = await member.Client.PostAsJsonAsync("/api/academic/teachers", NewTeacherBody());

        create.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Member_cannot_list_teachers_403()
    {
        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"member.{Guid.NewGuid():N}@planb.local");

        var list = await member.Client.GetAsync("/api/academic/teachers");

        list.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Seeded_admin_persona_can_manage_teachers()
    {
        // Camino real de producción: el admin provisionado por el seed (RegisterStaff) se loguea y
        // gestiona el catálogo. Prueba la cadena seed -> login -> endpoint gateado end-to-end.
        var admin = await AuthenticatedClient.SignInAsync(
            _fixture, TestPersonas.AdminEmail, TestPersonas.AdminPassword);

        var create = await admin.Client.PostAsJsonAsync("/api/academic/teachers", NewTeacherBody());

        create.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Anonymous_cannot_create_teacher_401()
    {
        using var anon = _fixture.Factory.CreateClient();

        var create = await anon.PostAsJsonAsync("/api/academic/teachers", NewTeacherBody());

        create.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    private sealed record CreatedDto(Guid Id);
    private sealed record StatusDto(Guid Id, bool IsActive);
    private sealed record ListDto(IReadOnlyList<AdminTeacherRow> Items);
    private sealed record AdminTeacherRow(
        Guid Id, Guid UniversityId, string UniversityName,
        string FirstName, string LastName, string? Title, bool IsActive, DateTime CreatedAt);
    private sealed record DetailDto(Guid Id, string? Bio, string? PhotoUrl, bool IsActive);
}
