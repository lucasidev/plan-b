using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Universities;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Tests de integración del admin CRUD de planes de estudio (US-061-b). Cubren el wiring HTTP +
/// persistencia + el gating por rol Admin (RequireRole contra el claim del JWT), mismo patrón que
/// <see cref="AdminCareersEndpointTests"/>.
///
/// <para>
/// Los planes cuelgan de una Career real (parent-existence, sin FK cross-schema: ADR-0017). Cada
/// test que lo necesita arma su propia Career vía <see cref="AcademicDbContext"/> (mismo idiom que
/// <c>CareerPlanImportEndpointTests</c>): así queda aislado de los años que ya trae sembrados
/// <c>AcademicSeeder</c> en la TUDCS y no depende del orden de ejecución de la suite para el
/// constraint UNIQUE(career_id, year).
/// </para>
/// </summary>
public class AdminCareerPlansEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid Unsta = Guid.Parse("00000001-0000-4000-a000-000000000001");

    private readonly RegisterApiFixture _fixture;

    public AdminCareerPlansEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"admin.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    private async Task<Guid> CreateCareerAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
        var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();

        var unique = Guid.NewGuid().ToString("N")[..8];
        var career = Career.Create(
            new UniversityId(Unsta),
            $"Carrera de Prueba {unique}",
            $"carrera-prueba-{unique}",
            clock,
            isOfficial: true).Value;
        db.Careers.Add(career);
        await db.SaveChangesAsync();

        return career.Id.Value;
    }

    [Fact]
    public async Task Admin_creates_career_plan_and_it_appears_in_the_list()
    {
        var admin = await AdminAsync();
        var careerId = await CreateCareerAsync();

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/careers/{careerId}/plans", new { year = 2015 });
        create.StatusCode.ShouldBe(HttpStatusCode.Created);
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var list = await admin.Client.GetFromJsonAsync<ListDto>(
            $"/api/academic/careers/{careerId}/plans");
        var row = list!.Items.SingleOrDefault(p => p.Id == created!.Id);
        row.ShouldNotBeNull();
        row.Year.ShouldBe(2015);
        row.Status.ShouldBe("Active");
        row.IsOfficial.ShouldBeTrue();
    }

    [Fact]
    public async Task Create_with_duplicate_year_in_same_career_returns_409()
    {
        var admin = await AdminAsync();
        var careerId = await CreateCareerAsync();

        (await admin.Client.PostAsJsonAsync(
                $"/api/academic/careers/{careerId}/plans", new { year = 2016 }))
            .EnsureSuccessStatusCode();

        var second = await admin.Client.PostAsJsonAsync(
            $"/api/academic/careers/{careerId}/plans", new { year = 2016 });

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await second.Content.ReadAsStringAsync())
            .ShouldContain("academic.career_plan.year_already_taken");
    }

    [Fact]
    public async Task Create_with_unknown_career_returns_404()
    {
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/careers/{Guid.NewGuid()}/plans", new { year = 2020 });

        create.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await create.Content.ReadAsStringAsync())
            .ShouldContain("academic.career.not_found");
    }

    [Fact]
    public async Task Admin_deprecates_career_plan()
    {
        var admin = await AdminAsync();
        var careerId = await CreateCareerAsync();
        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/careers/{careerId}/plans", new { year = 2017 });
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var deprecate = await admin.Client.PostAsync(
            $"/api/academic/career-plans/{created!.Id}/deprecate", content: null);
        deprecate.StatusCode.ShouldBe(HttpStatusCode.OK);
        var afterDeprecate = await deprecate.Content.ReadFromJsonAsync<StatusDto>();
        afterDeprecate!.Status.ShouldBe("Deprecated");

        var list = await admin.Client.GetFromJsonAsync<ListDto>(
            $"/api/academic/careers/{careerId}/plans");
        list!.Items.Single(p => p.Id == created.Id).Status.ShouldBe("Deprecated");
    }

    [Fact]
    public async Task Deprecating_an_already_deprecated_career_plan_is_409()
    {
        var admin = await AdminAsync();
        var careerId = await CreateCareerAsync();
        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/careers/{careerId}/plans", new { year = 2018 });
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        (await admin.Client.PostAsync(
                $"/api/academic/career-plans/{created!.Id}/deprecate", content: null))
            .EnsureSuccessStatusCode();

        var second = await admin.Client.PostAsync(
            $"/api/academic/career-plans/{created.Id}/deprecate", content: null);

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await second.Content.ReadAsStringAsync())
            .ShouldContain("academic.career_plan.already_deprecated");
    }

    [Fact]
    public async Task Admin_reactivates_deprecated_career_plan()
    {
        var admin = await AdminAsync();
        var careerId = await CreateCareerAsync();
        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/careers/{careerId}/plans", new { year = 2019 });
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        (await admin.Client.PostAsync(
                $"/api/academic/career-plans/{created!.Id}/deprecate", content: null))
            .EnsureSuccessStatusCode();

        var reactivate = await admin.Client.PostAsync(
            $"/api/academic/career-plans/{created.Id}/reactivate", content: null);
        reactivate.StatusCode.ShouldBe(HttpStatusCode.OK);
        var afterReactivate = await reactivate.Content.ReadFromJsonAsync<StatusDto>();
        afterReactivate!.Status.ShouldBe("Active");
    }

    [Fact]
    public async Task List_returns_active_and_deprecated_plans()
    {
        var admin = await AdminAsync();
        var careerId = await CreateCareerAsync();

        var activeCreate = await admin.Client.PostAsJsonAsync(
            $"/api/academic/careers/{careerId}/plans", new { year = 2020 });
        var active = await activeCreate.Content.ReadFromJsonAsync<CreatedDto>();

        var deprecatedCreate = await admin.Client.PostAsJsonAsync(
            $"/api/academic/careers/{careerId}/plans", new { year = 2021 });
        var deprecated = await deprecatedCreate.Content.ReadFromJsonAsync<CreatedDto>();
        (await admin.Client.PostAsync(
                $"/api/academic/career-plans/{deprecated!.Id}/deprecate", content: null))
            .EnsureSuccessStatusCode();

        var list = await admin.Client.GetFromJsonAsync<ListDto>(
            $"/api/academic/careers/{careerId}/plans");

        list!.Items.Single(p => p.Id == active!.Id).Status.ShouldBe("Active");
        list.Items.Single(p => p.Id == deprecated.Id).Status.ShouldBe("Deprecated");
    }

    [Fact]
    public async Task Member_cannot_create_career_plan_403()
    {
        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"member.{Guid.NewGuid():N}@planb.local");

        var create = await member.Client.PostAsJsonAsync(
            $"/api/academic/careers/{Guid.NewGuid()}/plans", new { year = 2015 });

        create.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Anonymous_cannot_create_career_plan_401()
    {
        using var anon = _fixture.Factory.CreateClient();

        var create = await anon.PostAsJsonAsync(
            $"/api/academic/careers/{Guid.NewGuid()}/plans", new { year = 2015 });

        create.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    private sealed record CreatedDto(Guid Id);
    private sealed record StatusDto(Guid Id, string Status);
    private sealed record ListDto(IReadOnlyList<AdminCareerPlanRow> Items);
    private sealed record AdminCareerPlanRow(Guid Id, int Year, string Status, bool IsOfficial);
}
