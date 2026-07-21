using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Prerequisites;
using Planb.Academic.Domain.Subjects;
using Planb.Academic.Domain.Universities;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Tests de integración del admin CRUD de materias (US-062). Cubren el wiring HTTP + persistencia +
/// el gating por rol Admin (RequireRole contra el claim del JWT), mismo patrón que
/// <see cref="AdminAcademicTermsEndpointTests"/> y <see cref="AdminCareerPlansEndpointTests"/>.
///
/// <para>
/// Las materias cuelgan de un CareerPlan real (parent-existence, sin FK cross-schema: ADR-0017).
/// Cada test que lo necesita arma su propia Career + CareerPlan vía <see cref="AcademicDbContext"/>
/// (mismo idiom que <see cref="AdminCareerPlansEndpointTests"/>): así queda aislado del catálogo
/// sembrado por <c>AcademicSeeder</c> y del constraint UNIQUE(career_plan_id, code).
/// </para>
/// </summary>
public class AdminSubjectsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid Unsta = Guid.Parse("00000001-0000-4000-a000-000000000001");

    private readonly RegisterApiFixture _fixture;

    public AdminSubjectsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"admin.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    private async Task<Guid> CreateCareerPlanAsync()
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

        var plan = CareerPlan.Create(career.Id, 2015, clock, isOfficial: true).Value;
        db.CareerPlans.Add(plan);

        await db.SaveChangesAsync();

        return plan.Id.Value;
    }

    private static object NewSubjectBody(
        string? code = null, string? name = null,
        int yearInPlan = 1, int? termInYear = 1, string? termKind = "FourMonth",
        int weeklyHours = 4, int totalHours = 64, string? description = null)
    {
        var unique = Guid.NewGuid().ToString("N")[..8];
        return new
        {
            code = code ?? $"COD-{unique}",
            name = name ?? $"Materia de Prueba {unique}",
            yearInPlan,
            termInYear,
            termKind,
            weeklyHours,
            totalHours,
            description,
        };
    }

    [Fact]
    public async Task Admin_creates_subject_and_it_appears_in_the_admin_list_and_detail()
    {
        var admin = await AdminAsync();
        var planId = await CreateCareerPlanAsync();

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/career-plans/{planId}/subjects",
            NewSubjectBody(
                yearInPlan: 2, termInYear: 1, weeklyHours: 6, totalHours: 96,
                description: "Materia de prueba"));
        create.StatusCode.ShouldBe(HttpStatusCode.Created);
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var list = await admin.Client.GetFromJsonAsync<ListDto>(
            $"/api/academic/career-plans/{planId}/subjects");
        var row = list!.Items.SingleOrDefault(s => s.Id == created!.Id);
        row.ShouldNotBeNull();
        row.YearInPlan.ShouldBe(2);
        row.TermInYear.ShouldBe(1);
        row.TermKind.ShouldBe("FourMonth");
        row.WeeklyHours.ShouldBe(6);
        row.TotalHours.ShouldBe(96);
        row.Description.ShouldBe("Materia de prueba");
        row.IsOfficial.ShouldBeTrue();
        row.IsActive.ShouldBeTrue();

        var detail = await admin.Client.GetFromJsonAsync<SubjectDto>(
            $"/api/academic/career-plans/{planId}/subjects/{created!.Id}");
        detail!.Code.ShouldBe(row.Code);
        detail.Name.ShouldBe(row.Name);
        detail.WeeklyHours.ShouldBe(6);
    }

    [Fact]
    public async Task Create_with_duplicate_code_in_same_plan_returns_409()
    {
        var admin = await AdminAsync();
        var planId = await CreateCareerPlanAsync();
        var code = $"DUP-{Guid.NewGuid():N}"[..12];

        (await admin.Client.PostAsJsonAsync(
                $"/api/academic/career-plans/{planId}/subjects", NewSubjectBody(code: code)))
            .EnsureSuccessStatusCode();

        var second = await admin.Client.PostAsJsonAsync(
            $"/api/academic/career-plans/{planId}/subjects", NewSubjectBody(code: code));

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await second.Content.ReadAsStringAsync())
            .ShouldContain("academic.subject.code_already_exists");
    }

    [Fact]
    public async Task Create_with_unknown_career_plan_returns_404()
    {
        var admin = await AdminAsync();

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/career-plans/{Guid.NewGuid()}/subjects", NewSubjectBody());

        create.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await create.Content.ReadAsStringAsync())
            .ShouldContain("academic.subject.career_plan_not_found");
    }

    [Fact]
    public async Task Member_cannot_create_subject_403()
    {
        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"member.{Guid.NewGuid():N}@planb.local");
        var planId = await CreateCareerPlanAsync();

        var create = await member.Client.PostAsJsonAsync(
            $"/api/academic/career-plans/{planId}/subjects", NewSubjectBody());

        create.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Anonymous_cannot_create_subject_401()
    {
        using var anon = _fixture.Factory.CreateClient();
        var planId = await CreateCareerPlanAsync();

        var create = await anon.PostAsJsonAsync(
            $"/api/academic/career-plans/{planId}/subjects", NewSubjectBody());

        create.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Admin_updates_subject()
    {
        var admin = await AdminAsync();
        var planId = await CreateCareerPlanAsync();
        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/career-plans/{planId}/subjects", NewSubjectBody());
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var update = await admin.Client.PatchAsJsonAsync(
            $"/api/academic/subjects/{created!.Id}",
            NewSubjectBody(name: "Materia Actualizada", weeklyHours: 8, totalHours: 128));
        update.StatusCode.ShouldBe(HttpStatusCode.OK);

        var detail = await admin.Client.GetFromJsonAsync<SubjectDto>(
            $"/api/academic/career-plans/{planId}/subjects/{created.Id}");
        detail!.Name.ShouldBe("Materia Actualizada");
        detail.WeeklyHours.ShouldBe(8);
        detail.TotalHours.ShouldBe(128);
    }

    [Fact]
    public async Task Delete_with_dependents_returns_409_with_dependents_list()
    {
        var admin = await AdminAsync();
        var planId = await CreateCareerPlanAsync();

        var requiredCreate = await admin.Client.PostAsJsonAsync(
            $"/api/academic/career-plans/{planId}/subjects", NewSubjectBody(yearInPlan: 1));
        var required = await requiredCreate.Content.ReadFromJsonAsync<CreatedDto>();

        var dependentCreate = await admin.Client.PostAsJsonAsync(
            $"/api/academic/career-plans/{planId}/subjects", NewSubjectBody(yearInPlan: 2));
        var dependent = await dependentCreate.Content.ReadFromJsonAsync<CreatedDto>();

        // La correlativa se arma directo contra el DbContext: este slice (US-062) es el CRUD de
        // Subject, no el de correlativas, así que el setup del test inserta la arista como lo
        // haría el flujo real.
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
            var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();
            var prerequisite = Prerequisite.Create(
                new SubjectId(dependent!.Id),
                new SubjectId(required!.Id),
                PrerequisiteType.ToEnroll,
                clock.UtcNow).Value;
            db.Prerequisites.Add(prerequisite);
            await db.SaveChangesAsync();
        }

        var delete = await admin.Client.DeleteAsync($"/api/academic/subjects/{required.Id}");

        delete.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        var body = await delete.Content.ReadFromJsonAsync<HasDependentsDto>();
        body!.Code.ShouldBe("academic.subject.has_dependents");
        body.Dependents.ShouldContain(d => d.Id == dependent.Id);

        // No se tocó: sigue activa.
        var detail = await admin.Client.GetFromJsonAsync<SubjectDto>(
            $"/api/academic/career-plans/{planId}/subjects/{required.Id}");
        detail!.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task Delete_without_dependents_returns_204_and_disappears_from_public_catalog()
    {
        var admin = await AdminAsync();
        var planId = await CreateCareerPlanAsync();
        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/career-plans/{planId}/subjects", NewSubjectBody());
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        var delete = await admin.Client.DeleteAsync($"/api/academic/subjects/{created!.Id}");
        delete.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var publicDetail = await admin.Client.GetAsync($"/api/academic/subjects/{created.Id}");
        publicDetail.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Admin_reactivates_subject()
    {
        var admin = await AdminAsync();
        var planId = await CreateCareerPlanAsync();
        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/career-plans/{planId}/subjects", NewSubjectBody());
        var created = await create.Content.ReadFromJsonAsync<CreatedDto>();

        (await admin.Client.DeleteAsync($"/api/academic/subjects/{created!.Id}"))
            .EnsureSuccessStatusCode();

        var reactivate = await admin.Client.PostAsync(
            $"/api/academic/subjects/{created.Id}/reactivate", content: null);
        reactivate.StatusCode.ShouldBe(HttpStatusCode.OK);
        var afterReactivate = await reactivate.Content.ReadFromJsonAsync<StatusDto>();
        afterReactivate!.IsActive.ShouldBeTrue();

        var publicDetail = await admin.Client.GetAsync($"/api/academic/subjects/{created.Id}");
        publicDetail.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task List_admin_includes_archived_subjects_but_public_catalog_does_not()
    {
        var admin = await AdminAsync();
        var planId = await CreateCareerPlanAsync();

        var activeCreate = await admin.Client.PostAsJsonAsync(
            $"/api/academic/career-plans/{planId}/subjects", NewSubjectBody(yearInPlan: 1));
        var active = await activeCreate.Content.ReadFromJsonAsync<CreatedDto>();

        var archivedCreate = await admin.Client.PostAsJsonAsync(
            $"/api/academic/career-plans/{planId}/subjects", NewSubjectBody(yearInPlan: 1));
        var archived = await archivedCreate.Content.ReadFromJsonAsync<CreatedDto>();
        (await admin.Client.DeleteAsync($"/api/academic/subjects/{archived!.Id}"))
            .EnsureSuccessStatusCode();

        var adminList = await admin.Client.GetFromJsonAsync<ListDto>(
            $"/api/academic/career-plans/{planId}/subjects");
        adminList!.Items.Single(s => s.Id == active!.Id).IsActive.ShouldBeTrue();
        adminList.Items.Single(s => s.Id == archived.Id).IsActive.ShouldBeFalse();

        var publicList = await admin.Client.GetFromJsonAsync<List<PublicSubjectDto>>(
            $"/api/academic/subjects?careerPlanId={planId}");
        publicList!.ShouldContain(s => s.Id == active!.Id);
        publicList!.ShouldNotContain(s => s.Id == archived.Id);
    }

    private sealed record CreatedDto(Guid Id);
    private sealed record StatusDto(Guid Id, bool IsActive);
    private sealed record ListDto(IReadOnlyList<SubjectDto> Items);
    private sealed record SubjectDto(
        Guid Id, string Code, string Name, int YearInPlan, int? TermInYear, string TermKind,
        int WeeklyHours, int TotalHours, string? Description, bool IsOfficial, bool IsActive);
    private sealed record PublicSubjectDto(
        Guid Id, Guid CareerPlanId, string Code, string Name, int YearInPlan, int? TermInYear,
        string TermKind);
    private sealed record DependentDto(Guid Id, string Code, string Name);
    private sealed record HasDependentsDto(string Code, IReadOnlyList<DependentDto> Dependents);
}
