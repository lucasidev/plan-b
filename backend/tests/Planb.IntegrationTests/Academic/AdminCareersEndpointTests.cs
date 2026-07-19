using System.Net;
using System.Net.Http.Json;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Tests de integración del admin CRUD de carreras (US-061-b). Cubren el wiring HTTP +
/// persistencia + el gating por rol Admin (RequireRole contra el claim del JWT), mismo patrón que
/// <see cref="AdminUniversitiesEndpointTests"/> y <see cref="AdminTeachersEndpointTests"/>.
///
/// <para>
/// Las carreras cuelgan de una University real (parent-existence, sin FK cross-schema: ADR-0017).
/// Usamos la UNSTA sembrada por <c>AcademicSeeder</c> (arranca en Development, que es el
/// environment de <see cref="RegisterApiFixture"/>) como padre, igual que
/// <see cref="AdminTeachersEndpointTests"/> hace con sus docentes.
/// </para>
/// </summary>
public class AdminCareersEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid Unsta = Guid.Parse("00000001-0000-4000-a000-000000000001");

    private readonly RegisterApiFixture _fixture;

    public AdminCareersEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"admin.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    private static object NewCareerBody(
        string? name = null, string? slug = null,
        string? shortName = "Ing. Sistemas", string? code = null)
    {
        var unique = Guid.NewGuid().ToString("N")[..8];
        return new
        {
            name = name ?? $"Carrera de Prueba {unique}",
            slug = slug ?? $"carrera-prueba-{unique}",
            shortName,
            code,
        };
    }

    [Fact]
    public async Task Admin_creates_career_and_it_appears_in_the_admin_list()
    {
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/careers", NewCareerBody());
        create.StatusCode.ShouldBe(HttpStatusCode.Created);
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var list = await admin.Client.GetFromJsonAsync<ListDto>(
            $"/api/academic/universities/{Unsta}/careers");
        var row = list!.Items.SingleOrDefault(c => c.Id == created!.Id);
        row.ShouldNotBeNull();
        row.ShortName.ShouldBe("Ing. Sistemas");
        row.IsOfficial.ShouldBeTrue();
        row.IsActive.ShouldBeTrue();
        row.PlanCount.ShouldBe(0); // carrera recién creada, sin planes todavía

        var detail = await admin.Client.GetFromJsonAsync<DetailDto>(
            $"/api/academic/careers/{created!.Id}");
        detail!.Name.ShouldBe(row.Name);
        detail.Slug.ShouldBe(row.Slug);
        detail.ShortName.ShouldBe(row.ShortName);
        detail.UniversityId.ShouldBe(Unsta);
        detail.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task Create_with_duplicate_slug_in_same_university_returns_409()
    {
        var admin = await AdminAsync();
        var slug = $"dup-{Guid.NewGuid():N}"[..12];

        (await admin.Client.PostAsJsonAsync(
                $"/api/academic/universities/{Unsta}/careers", NewCareerBody(slug: slug)))
            .EnsureSuccessStatusCode();

        // Mismo slug con distinto casing: la unicidad compara normalizado (lowercase), igual que
        // en University.
        var second = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/careers",
            NewCareerBody(slug: slug.ToUpperInvariant()));

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await second.Content.ReadAsStringAsync())
            .ShouldContain("academic.career.slug_already_taken");
    }

    [Fact]
    public async Task Create_with_duplicate_code_returns_409()
    {
        var admin = await AdminAsync();
        var code = $"COD-{Guid.NewGuid():N}"[..12];

        (await admin.Client.PostAsJsonAsync(
                $"/api/academic/universities/{Unsta}/careers", NewCareerBody(code: code)))
            .EnsureSuccessStatusCode();

        var second = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/careers", NewCareerBody(code: code));

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await second.Content.ReadAsStringAsync())
            .ShouldContain("academic.career.code_already_taken");
    }

    [Fact]
    public async Task Create_with_unknown_university_returns_404()
    {
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Guid.NewGuid()}/careers", NewCareerBody());

        create.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await create.Content.ReadAsStringAsync())
            .ShouldContain("academic.career.university_not_found");
    }

    [Fact]
    public async Task Admin_updates_career_fields()
    {
        var admin = await AdminAsync();
        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/careers", NewCareerBody());
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var update = await admin.Client.PatchAsJsonAsync(
            $"/api/academic/careers/{created!.Id}",
            NewCareerBody(name: "Carrera Actualizada", shortName: "Actualizada"));
        update.StatusCode.ShouldBe(HttpStatusCode.OK);

        var detail = await admin.Client.GetFromJsonAsync<DetailDto>(
            $"/api/academic/careers/{created.Id}");
        detail!.Name.ShouldBe("Carrera Actualizada");
        detail.ShortName.ShouldBe("Actualizada");
    }

    [Fact]
    public async Task Update_with_slug_of_another_career_returns_409()
    {
        var admin = await AdminAsync();
        var takenSlug = $"taken-{Guid.NewGuid():N}"[..12];

        (await admin.Client.PostAsJsonAsync(
                $"/api/academic/universities/{Unsta}/careers", NewCareerBody(slug: takenSlug)))
            .EnsureSuccessStatusCode();

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/careers", NewCareerBody());
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var update = await admin.Client.PatchAsJsonAsync(
            $"/api/academic/careers/{created!.Id}", NewCareerBody(slug: takenSlug));

        update.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await update.Content.ReadAsStringAsync())
            .ShouldContain("academic.career.slug_already_taken");
    }

    [Fact]
    public async Task Admin_deactivates_and_reactivates_career()
    {
        var admin = await AdminAsync();
        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/careers", NewCareerBody());
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var deactivate = await admin.Client.DeleteAsync($"/api/academic/careers/{created!.Id}");
        deactivate.StatusCode.ShouldBe(HttpStatusCode.OK);
        var afterDeactivate = await deactivate.Content.ReadFromJsonAsync<StatusDto>();
        afterDeactivate!.IsActive.ShouldBeFalse();

        var detail = await admin.Client.GetFromJsonAsync<DetailDto>(
            $"/api/academic/careers/{created.Id}");
        detail!.IsActive.ShouldBeFalse();

        var reactivate = await admin.Client.PostAsync(
            $"/api/academic/careers/{created.Id}/reactivate", content: null);
        reactivate.StatusCode.ShouldBe(HttpStatusCode.OK);
        var afterReactivate = await reactivate.Content.ReadFromJsonAsync<StatusDto>();
        afterReactivate!.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task List_admin_returns_active_and_inactive_careers()
    {
        var admin = await AdminAsync();
        var activeCreate = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/careers", NewCareerBody());
        var active = await activeCreate.Content.ReadFromJsonAsync<CreatedDto>();

        var inactiveCreate = await admin.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Unsta}/careers", NewCareerBody());
        var inactive = await inactiveCreate.Content.ReadFromJsonAsync<CreatedDto>();
        (await admin.Client.DeleteAsync($"/api/academic/careers/{inactive!.Id}"))
            .EnsureSuccessStatusCode();

        var list = await admin.Client.GetFromJsonAsync<ListDto>(
            $"/api/academic/universities/{Unsta}/careers");

        list!.Items.Single(c => c.Id == active!.Id).IsActive.ShouldBeTrue();
        list.Items.Single(c => c.Id == inactive.Id).IsActive.ShouldBeFalse();
    }

    [Fact]
    public async Task Member_cannot_create_career_403()
    {
        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"member.{Guid.NewGuid():N}@planb.local");

        var create = await member.Client.PostAsJsonAsync(
            $"/api/academic/universities/{Guid.NewGuid()}/careers", NewCareerBody());

        create.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Anonymous_cannot_create_career_401()
    {
        using var anon = _fixture.Factory.CreateClient();

        var create = await anon.PostAsJsonAsync(
            $"/api/academic/universities/{Guid.NewGuid()}/careers", NewCareerBody());

        create.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    private sealed record CreatedDto(Guid Id);
    private sealed record StatusDto(Guid Id, bool IsActive);
    private sealed record ListDto(IReadOnlyList<AdminCareerRow> Items);
    private sealed record AdminCareerRow(
        Guid Id, string Name, string Slug, string? ShortName, string? Code,
        bool IsOfficial, bool IsActive, int PlanCount);
    private sealed record DetailDto(
        Guid Id, Guid UniversityId, string Name, string Slug,
        string? ShortName, string? Code, bool IsOfficial, bool IsActive);
}
