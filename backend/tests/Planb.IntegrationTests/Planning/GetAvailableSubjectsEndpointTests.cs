using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Domain;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Subjects;
using Planb.Academic.Domain.Universities;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Planning;

/// <summary>
/// Tests de integración de US-016 (simulador, lado "available"). Cubren el wiring HTTP +
/// el cruce cross-schema (academic.subjects + academic.prerequisites + enrollments.enrollment_records)
/// + el gating por sesión. Mismo patrón que <see cref="Academic.AdminPrerequisitesEndpointTests"/>:
/// cada test arma su propia Career + CareerPlan + Subjects vía <see cref="AcademicDbContext"/>, y
/// crea las correlativas / el estado del alumno a través de los endpoints reales (admin y del
/// propio alumno), no tocando la DB de Enrollments directo.
/// </summary>
public class GetAvailableSubjectsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid Unsta = Guid.Parse("00000001-0000-4000-a000-000000000001");

    private readonly RegisterApiFixture _fixture;

    public GetAvailableSubjectsEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"admin-simulator.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    /// <summary>Crea un user autenticado + StudentProfile activo sobre <paramref name="careerPlanId"/>.</summary>
    private async Task<AuthenticatedClient> StudentAsync(Guid careerPlanId, string label)
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"simulator-{label}.{Guid.NewGuid():N}@planb.local");

        var profile = await auth.Client.PostAsJsonAsync(
            "/api/me/student-profiles",
            new { careerPlanId, enrollmentYear = 2024 });
        profile.EnsureSuccessStatusCode();

        return auth;
    }

    /// <summary>
    /// Arma una Career + CareerPlan propios (aislados del seed) con <paramref name="subjectCount"/>
    /// materias nuevas colgando de ese plan. Mismo idiom que
    /// <c>AdminPrerequisitesEndpointTests.CreatePlanWithSubjectsAsync</c>, pero devuelve también
    /// code/name de cada materia: los tests de este archivo los necesitan para verificar
    /// <c>blockedBy</c>.
    /// </summary>
    private async Task<(Guid PlanId, List<SubjectSeed> Subjects)> CreatePlanWithSubjectsAsync(int subjectCount)
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
        var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();

        var unique = Guid.NewGuid().ToString("N")[..8];
        var career = Career.Create(
            new UniversityId(Unsta),
            $"Carrera Simulador {unique}",
            $"carrera-simulador-{unique}",
            clock,
            isOfficial: true).Value;
        db.Careers.Add(career);

        var plan = CareerPlan.Create(career.Id, 2015, clock, isOfficial: true).Value;
        db.CareerPlans.Add(plan);

        var subjects = new List<SubjectSeed>();
        for (var i = 0; i < subjectCount; i++)
        {
            var code = $"SIM{i}-{unique}";
            var name = $"Materia Simulador {i} {unique}";
            var subject = Subject.Create(
                plan.Id,
                code: code,
                name: name,
                yearInPlan: 1,
                termInYear: 1,
                termKind: TermKind.FourMonth,
                weeklyHours: 4,
                totalHours: 64,
                description: null,
                clock: clock,
                isOfficial: true).Value;
            db.Subjects.Add(subject);
            subjects.Add(new SubjectSeed(subject.Id.Value, code, name));
        }

        await db.SaveChangesAsync();

        return (plan.Id.Value, subjects);
    }

    [Fact]
    public async Task Subject_without_prerequisites_is_available_and_dependent_is_blocked_with_code()
    {
        var admin = await AdminAsync();
        var (planId, subjects) = await CreatePlanWithSubjectsAsync(2);
        var a = subjects[0];
        var b = subjects[1];

        // B requiere A para_cursar.
        (await admin.Client.PostAsJsonAsync(
                $"/api/academic/subjects/{b.Id}/prerequisites",
                new { requiredSubjectId = a.Id, type = "ToEnroll" }))
            .EnsureSuccessStatusCode();

        var student = await StudentAsync(planId, "noprereq");

        var response = await student.Client.GetAsync("/api/me/simulator/available");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<AvailableSubjectsDto>();
        body.ShouldNotBeNull();

        var itemA = body!.Items.Single(i => i.Id == a.Id);
        itemA.Status.ShouldBe("Available");
        itemA.BlockedBy.ShouldBeEmpty();

        var itemB = body.Items.Single(i => i.Id == b.Id);
        itemB.Status.ShouldBe("Blocked");
        itemB.BlockedBy.ShouldHaveSingleItem();
        itemB.BlockedBy[0].Id.ShouldBe(a.Id);
        itemB.BlockedBy[0].Code.ShouldBe(a.Code);
        itemB.BlockedBy[0].Name.ShouldBe(a.Name);
    }

    [Fact]
    public async Task Regularizing_the_prerequisite_unlocks_the_dependent_subject()
    {
        var admin = await AdminAsync();
        var (planId, subjects) = await CreatePlanWithSubjectsAsync(2);
        var a = subjects[0];
        var b = subjects[1];

        (await admin.Client.PostAsJsonAsync(
                $"/api/academic/subjects/{b.Id}/prerequisites",
                new { requiredSubjectId = a.Id, type = "ToEnroll" }))
            .EnsureSuccessStatusCode();

        var student = await StudentAsync(planId, "regularized");

        // El alumno regulariza A: Regular exige grade, no exige term (a diferencia de Cursando).
        (await student.Client.PostAsJsonAsync(
                "/api/me/enrollment-records",
                new
                {
                    subjectId = a.Id,
                    commissionId = (Guid?)null,
                    termId = (Guid?)null,
                    status = "Regularized",
                    approvalMethod = (string?)null,
                    grade = 6m,
                }))
            .EnsureSuccessStatusCode();

        var response = await student.Client.GetAsync("/api/me/simulator/available");
        var body = await response.Content.ReadFromJsonAsync<AvailableSubjectsDto>();
        body.ShouldNotBeNull();

        // A ya la regularizó: no se vuelve a ofrecer, y no cuenta como "bloqueada".
        body!.Items.Single(i => i.Id == a.Id).Status.ShouldBe("AlreadyRegularized");

        // B ahora está disponible: la correlativa para_cursar ya está cumplida.
        var itemB = body.Items.Single(i => i.Id == b.Id);
        itemB.Status.ShouldBe("Available");
        itemB.BlockedBy.ShouldBeEmpty();
    }

    [Fact]
    public async Task Archived_subject_does_not_appear_in_the_listing()
    {
        var admin = await AdminAsync();
        var (planId, subjects) = await CreatePlanWithSubjectsAsync(2);
        var kept = subjects[0];
        var archived = subjects[1];

        (await admin.Client.DeleteAsync($"/api/academic/subjects/{archived.Id}"))
            .StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var student = await StudentAsync(planId, "archived");

        var response = await student.Client.GetAsync("/api/me/simulator/available");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<AvailableSubjectsDto>();
        body.ShouldNotBeNull();

        body!.Items.ShouldContain(i => i.Id == kept.Id);
        body.Items.ShouldNotContain(i => i.Id == archived.Id);
    }

    [Fact]
    public async Task Returns_404_when_user_has_no_student_profile()
    {
        var auth = await AuthenticatedClient.CreateAsync(
            _fixture, $"simulator-noprofile.{Guid.NewGuid():N}@planb.local");

        var response = await auth.Client.GetAsync("/api/me/simulator/available");

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await response.Content.ReadAsStringAsync())
            .ShouldContain("planning.simulator.student_profile_required");
    }

    [Fact]
    public async Task Returns_401_when_no_session_cookie()
    {
        using var anon = _fixture.Factory.CreateClient();

        var response = await anon.GetAsync("/api/me/simulator/available");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    private sealed record SubjectSeed(Guid Id, string Code, string Name);

    private sealed record BlockedByDto(Guid Id, string Code, string Name);

    private sealed record AvailableSubjectDto(
        Guid Id,
        string Code,
        string Name,
        int YearInPlan,
        int? TermInYear,
        string TermKind,
        int WeeklyHours,
        int TotalHours,
        string Status,
        List<BlockedByDto> BlockedBy);

    private sealed record AvailableSubjectsDto(List<AvailableSubjectDto> Items);
}
