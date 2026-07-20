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

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Tests de integración del admin CRUD de correlativas (US-062). Cubren el wiring HTTP +
/// persistencia + el gating por rol Admin (RequireRole contra el claim del JWT), mismo patrón que
/// <see cref="AdminAcademicTermsEndpointTests"/>. El corazón de la suite es la detección de ciclos
/// (directo e indirecto) y la independencia de los dos grafos (ParaCursar / ParaRendir, ADR-0003).
///
/// <para>
/// Cada test que necesita materias arma su propia Career + CareerPlan + Subjects vía
/// <see cref="AcademicDbContext"/> (mismo idiom que <c>AdminCareerPlansEndpointTests</c>): así queda
/// aislado del seed de <c>AcademicSeeder</c> y de los demás tests de la clase, que comparten DB vía
/// el class fixture.
/// </para>
/// </summary>
public class AdminPrerequisitesEndpointTests : IClassFixture<RegisterApiFixture>
{
    private static readonly Guid Unsta = Guid.Parse("00000001-0000-4000-a000-000000000001");

    private readonly RegisterApiFixture _fixture;

    public AdminPrerequisitesEndpointTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"admin.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    /// <summary>
    /// Arma una Career + CareerPlan propios (aislados del seed) con <paramref name="subjectCount"/>
    /// materias nuevas colgando de ese plan. Cada test pide solo las materias que necesita.
    /// </summary>
    private async Task<(Guid PlanId, List<Guid> SubjectIds)> CreatePlanWithSubjectsAsync(int subjectCount)
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

        var subjectIds = new List<Guid>();
        for (var i = 0; i < subjectCount; i++)
        {
            var subject = Subject.Create(
                plan.Id,
                code: $"SUB{i}",
                name: $"Materia de Prueba {i}",
                yearInPlan: 1,
                termInYear: 1,
                termKind: TermKind.Cuatrimestral,
                weeklyHours: 4,
                totalHours: 64,
                description: null,
                clock: clock,
                isOfficial: true).Value;
            db.Subjects.Add(subject);
            subjectIds.Add(subject.Id.Value);
        }

        await db.SaveChangesAsync();

        return (plan.Id.Value, subjectIds);
    }

    private static object NewEdgeBody(Guid requiredSubjectId, string type = "ParaCursar") =>
        new { requiredSubjectId, type };

    [Fact]
    public async Task Admin_adds_prerequisite_and_it_appears_in_the_plan_graph()
    {
        var admin = await AdminAsync();
        var (planId, subjects) = await CreatePlanWithSubjectsAsync(2);
        var a = subjects[0];
        var b = subjects[1];

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{a}/prerequisites", NewEdgeBody(b));
        create.StatusCode.ShouldBe(HttpStatusCode.Created);
        var created = await create.Content.ReadFromJsonAsync<EdgeDto>();
        created!.SubjectId.ShouldBe(a);
        created.RequiredSubjectId.ShouldBe(b);
        created.Type.ShouldBe("ParaCursar");

        var graph = await admin.Client.GetFromJsonAsync<GraphDto>(
            $"/api/academic/career-plans/{planId}/prerequisites");
        graph!.Items.ShouldContain(
            e => e.SubjectId == a && e.RequiredSubjectId == b && e.Type == "ParaCursar");
    }

    [Fact]
    public async Task Direct_cycle_is_rejected()
    {
        var admin = await AdminAsync();
        var (_, subjects) = await CreatePlanWithSubjectsAsync(2);
        var a = subjects[0];
        var b = subjects[1];

        // A requiere B.
        (await admin.Client.PostAsJsonAsync(
                $"/api/academic/subjects/{a}/prerequisites", NewEdgeBody(b)))
            .EnsureSuccessStatusCode();

        // B requiere A cerraría el ciclo A -> B -> A.
        var second = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{b}/prerequisites", NewEdgeBody(a));

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await second.Content.ReadAsStringAsync())
            .ShouldContain("academic.prerequisite.cycle_detected");
    }

    [Fact]
    public async Task Indirect_cycle_is_rejected()
    {
        var admin = await AdminAsync();
        var (_, subjects) = await CreatePlanWithSubjectsAsync(3);
        var a = subjects[0];
        var b = subjects[1];
        var c = subjects[2];

        // A requiere B; B requiere C.
        (await admin.Client.PostAsJsonAsync(
                $"/api/academic/subjects/{a}/prerequisites", NewEdgeBody(b)))
            .EnsureSuccessStatusCode();
        (await admin.Client.PostAsJsonAsync(
                $"/api/academic/subjects/{b}/prerequisites", NewEdgeBody(c)))
            .EnsureSuccessStatusCode();

        // C requiere A cerraría el ciclo indirecto A -> B -> C -> A.
        var third = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{c}/prerequisites", NewEdgeBody(a));

        third.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await third.Content.ReadAsStringAsync())
            .ShouldContain("academic.prerequisite.cycle_detected");
    }

    [Fact]
    public async Task Same_pair_in_the_other_type_graph_is_independent()
    {
        var admin = await AdminAsync();
        var (_, subjects) = await CreatePlanWithSubjectsAsync(2);
        var a = subjects[0];
        var b = subjects[1];

        // A requiere B en ParaCursar.
        (await admin.Client.PostAsJsonAsync(
                $"/api/academic/subjects/{a}/prerequisites", NewEdgeBody(b, "ParaCursar")))
            .EnsureSuccessStatusCode();

        // B requiere A en ParaRendir: mismo par de materias, pero es un grafo distinto (ADR-0003).
        // No debería rechazarse como ciclo porque para_cursar y para_rendir son DAGs separados.
        var second = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{b}/prerequisites", NewEdgeBody(a, "ParaRendir"));

        second.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Self_reference_is_rejected()
    {
        var admin = await AdminAsync();
        var (_, subjects) = await CreatePlanWithSubjectsAsync(1);
        var a = subjects[0];

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{a}/prerequisites", NewEdgeBody(a));

        create.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await create.Content.ReadAsStringAsync())
            .ShouldContain("academic.prerequisite.self_reference");
    }

    [Fact]
    public async Task Cross_plan_is_rejected()
    {
        var admin = await AdminAsync();
        var (_, subjectsA) = await CreatePlanWithSubjectsAsync(1);
        var (_, subjectsB) = await CreatePlanWithSubjectsAsync(1);

        var create = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{subjectsA[0]}/prerequisites", NewEdgeBody(subjectsB[0]));

        create.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await create.Content.ReadAsStringAsync())
            .ShouldContain("academic.prerequisite.cross_plan");
    }

    [Fact]
    public async Task Duplicate_is_rejected()
    {
        var admin = await AdminAsync();
        var (_, subjects) = await CreatePlanWithSubjectsAsync(2);
        var a = subjects[0];
        var b = subjects[1];

        (await admin.Client.PostAsJsonAsync(
                $"/api/academic/subjects/{a}/prerequisites", NewEdgeBody(b)))
            .EnsureSuccessStatusCode();

        var second = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{a}/prerequisites", NewEdgeBody(b));

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await second.Content.ReadAsStringAsync())
            .ShouldContain("academic.prerequisite.already_exists");
    }

    [Fact]
    public async Task Delete_removes_the_edge_from_the_graph()
    {
        var admin = await AdminAsync();
        var (planId, subjects) = await CreatePlanWithSubjectsAsync(2);
        var a = subjects[0];
        var b = subjects[1];

        (await admin.Client.PostAsJsonAsync(
                $"/api/academic/subjects/{a}/prerequisites", NewEdgeBody(b)))
            .EnsureSuccessStatusCode();

        var delete = await admin.Client.DeleteAsync(
            $"/api/academic/subjects/{a}/prerequisites/{b}/ParaCursar");
        delete.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var graph = await admin.Client.GetFromJsonAsync<GraphDto>(
            $"/api/academic/career-plans/{planId}/prerequisites");
        graph!.Items.ShouldNotContain(e => e.SubjectId == a && e.RequiredSubjectId == b);
    }

    [Fact]
    public async Task Delete_of_unknown_edge_returns_404()
    {
        var admin = await AdminAsync();
        var (_, subjects) = await CreatePlanWithSubjectsAsync(2);
        var a = subjects[0];
        var b = subjects[1];

        var delete = await admin.Client.DeleteAsync(
            $"/api/academic/subjects/{a}/prerequisites/{b}/ParaCursar");

        delete.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await delete.Content.ReadAsStringAsync())
            .ShouldContain("academic.prerequisite.not_found");
    }

    [Fact]
    public async Task Member_cannot_create_prerequisite_403()
    {
        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"member.{Guid.NewGuid():N}@planb.local");
        var (_, subjects) = await CreatePlanWithSubjectsAsync(2);

        var create = await member.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{subjects[0]}/prerequisites", NewEdgeBody(subjects[1]));

        create.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Anonymous_cannot_create_prerequisite_401()
    {
        using var anon = _fixture.Factory.CreateClient();
        var (_, subjects) = await CreatePlanWithSubjectsAsync(2);

        var create = await anon.PostAsJsonAsync(
            $"/api/academic/subjects/{subjects[0]}/prerequisites", NewEdgeBody(subjects[1]));

        create.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    private sealed record EdgeDto(Guid SubjectId, Guid RequiredSubjectId, string Type);
    private sealed record GraphDto(List<EdgeDto> Items);
}
