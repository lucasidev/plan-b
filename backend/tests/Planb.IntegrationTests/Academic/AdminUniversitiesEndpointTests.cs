using System.Net;
using System.Net.Http.Json;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Identity;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Tests de integración del admin CRUD de universidades (US-060). Cubren el wiring HTTP +
/// persistencia + el gating por rol Admin (RequireRole contra el claim del JWT).
///
/// <para>
/// El listado admin vive en <c>GET /api/academic/universities/admin</c>, no en la ruta desnuda:
/// esa ya la ocupa el catálogo público <c>AllowAnonymous</c> preexistente (US-037,
/// <c>PublicCatalog/ListUniversitiesEndpoint</c>), consumido hoy por el onboarding cascada. Ver
/// <see cref="Public_catalog_list_stays_separate_from_admin_list"/>.
/// </para>
/// </summary>
public class AdminUniversitiesEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    public AdminUniversitiesEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"admin.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    private static object NewUniversityBody(
        string? name = null, string? slug = null, string[]? institutionalEmailDomains = null)
    {
        var unique = Guid.NewGuid().ToString("N")[..8];
        return new
        {
            name = name ?? $"Universidad de Prueba {unique}",
            slug = slug ?? $"uni-prueba-{unique}",
            institutionalEmailDomains = institutionalEmailDomains ?? ["prueba.edu.ar"],
        };
    }

    [Fact]
    public async Task Admin_creates_university_and_it_appears_in_the_admin_list()
    {
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync(
            "/api/academic/universities", NewUniversityBody());
        create.StatusCode.ShouldBe(HttpStatusCode.Created);
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var list = await admin.Client.GetFromJsonAsync<ListDto>("/api/academic/universities/admin");
        var row = list!.Items.SingleOrDefault(u => u.Id == created!.Id);
        row.ShouldNotBeNull();
        row.IsActive.ShouldBeTrue();
        row.CareerCount.ShouldBe(0); // universidad recién creada, sin careers todavía

        var detail = await admin.Client.GetFromJsonAsync<DetailDto>(
            $"/api/academic/universities/{created!.Id}");
        detail!.Name.ShouldBe(row.Name);
        detail.Slug.ShouldBe(row.Slug);
        detail.InstitutionalEmailDomains.ShouldBe(row.InstitutionalEmailDomains);
        detail.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task Create_normalizes_institutional_email_domains()
    {
        var admin = await AdminAsync();
        var body = NewUniversityBody(
            institutionalEmailDomains: ["UNSTA.edu.ar", "unsta.edu.ar"]);

        var create = await admin.Client.PostAsJsonAsync("/api/academic/universities", body);
        create.StatusCode.ShouldBe(HttpStatusCode.Created);
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var detail = await admin.Client.GetFromJsonAsync<DetailDto>(
            $"/api/academic/universities/{created!.Id}");
        detail!.InstitutionalEmailDomains.ShouldBe(["unsta.edu.ar"]); // lowercase + dedup
    }

    [Fact]
    public async Task Create_with_duplicate_slug_returns_409()
    {
        var admin = await AdminAsync();
        var slug = $"dup-{Guid.NewGuid():N}"[..12];

        (await admin.Client.PostAsJsonAsync(
                "/api/academic/universities", NewUniversityBody(slug: slug)))
            .EnsureSuccessStatusCode();

        // Mismo slug con distinto casing: la unicidad compara normalizado (lowercase).
        var second = await admin.Client.PostAsJsonAsync(
            "/api/academic/universities", NewUniversityBody(slug: slug.ToUpperInvariant()));

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await second.Content.ReadAsStringAsync())
            .ShouldContain("academic.university.slug_already_taken");
    }

    [Fact]
    public async Task Admin_updates_university_fields()
    {
        var admin = await AdminAsync();
        var create = await admin.Client.PostAsJsonAsync(
            "/api/academic/universities", NewUniversityBody());
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var update = await admin.Client.PatchAsJsonAsync(
            $"/api/academic/universities/{created!.Id}",
            NewUniversityBody(
                name: "Universidad Actualizada",
                institutionalEmailDomains: ["actualizada.edu.ar"]));
        update.StatusCode.ShouldBe(HttpStatusCode.OK);

        var detail = await admin.Client.GetFromJsonAsync<DetailDto>(
            $"/api/academic/universities/{created.Id}");
        detail!.Name.ShouldBe("Universidad Actualizada");
        detail.InstitutionalEmailDomains.ShouldBe(["actualizada.edu.ar"]);
    }

    [Fact]
    public async Task Admin_deactivates_and_reactivates_university()
    {
        var admin = await AdminAsync();
        var create = await admin.Client.PostAsJsonAsync(
            "/api/academic/universities", NewUniversityBody());
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var deactivate = await admin.Client.DeleteAsync(
            $"/api/academic/universities/{created!.Id}");
        deactivate.StatusCode.ShouldBe(HttpStatusCode.OK);
        var afterDeactivate = await deactivate.Content.ReadFromJsonAsync<StatusDto>();
        afterDeactivate!.IsActive.ShouldBeFalse();

        // Soft delete: sigue en el listado admin (inactiva), no desaparece.
        var list = await admin.Client.GetFromJsonAsync<ListDto>("/api/academic/universities/admin");
        list!.Items.Single(u => u.Id == created.Id).IsActive.ShouldBeFalse();

        var reactivate = await admin.Client.PostAsync(
            $"/api/academic/universities/{created.Id}/reactivate", content: null);
        reactivate.StatusCode.ShouldBe(HttpStatusCode.OK);
        var afterReactivate = await reactivate.Content.ReadFromJsonAsync<StatusDto>();
        afterReactivate!.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task Deactivating_an_already_inactive_university_is_409()
    {
        var admin = await AdminAsync();
        var create = await admin.Client.PostAsJsonAsync(
            "/api/academic/universities", NewUniversityBody());
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        (await admin.Client.DeleteAsync($"/api/academic/universities/{created!.Id}"))
            .EnsureSuccessStatusCode();

        var second = await admin.Client.DeleteAsync($"/api/academic/universities/{created.Id}");
        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Update_unknown_university_returns_404()
    {
        var admin = await AdminAsync();

        var update = await admin.Client.PatchAsJsonAsync(
            $"/api/academic/universities/{Guid.NewGuid()}", NewUniversityBody());

        update.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Member_cannot_create_university_403()
    {
        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"member.{Guid.NewGuid():N}@planb.local");

        var create = await member.Client.PostAsJsonAsync(
            "/api/academic/universities", NewUniversityBody());

        create.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Member_cannot_list_universities_admin_403()
    {
        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"member.{Guid.NewGuid():N}@planb.local");

        var list = await member.Client.GetAsync("/api/academic/universities/admin");

        list.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Anonymous_cannot_create_university_401()
    {
        using var anon = _fixture.Factory.CreateClient();

        var create = await anon.PostAsJsonAsync("/api/academic/universities", NewUniversityBody());

        create.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Public_catalog_list_stays_separate_from_admin_list()
    {
        // GET /api/academic/universities (sin /admin) sigue siendo el catálogo público
        // AllowAnonymous preexistente (US-037): el endpoint admin nuevo no lo pisa.
        using var anon = _fixture.Factory.CreateClient();

        var publicList = await anon.GetAsync("/api/academic/universities");
        publicList.StatusCode.ShouldBe(HttpStatusCode.OK);

        var adminList = await anon.GetAsync("/api/academic/universities/admin");
        adminList.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    private sealed record CreatedDto(Guid Id);
    private sealed record StatusDto(Guid Id, bool IsActive);
    private sealed record ListDto(IReadOnlyList<AdminUniversityRow> Items);
    private sealed record AdminUniversityRow(
        Guid Id, string Name, string Slug, string[] InstitutionalEmailDomains,
        bool IsActive, int CareerCount);
    private sealed record DetailDto(
        Guid Id, string Name, string Slug,
        IReadOnlyList<string> InstitutionalEmailDomains, bool IsActive);
}
